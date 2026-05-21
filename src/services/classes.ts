import { supabase } from '../lib/supabase'
import type { DbClass } from '../types/database'

export async function getClasses(filters?: { branchId?: string; academicYearId?: string; status?: string }) {
  let query = supabase
    .from('classes')
    .select(`
      *,
      teacher: teachers!teacher_id ( id, full_name, color ),
      room: rooms ( id, name, floor ),
      class_schedules ( id, day_of_week, start_time, end_time ),
      enrollments ( id ),
      class_assistants ( teacher_id, teacher: teachers!teacher_id ( id, full_name ) )
    `)
    .eq('is_deleted', false)

  if (filters?.branchId)       query = query.eq('branch_id', filters.branchId)
  if (filters?.academicYearId) query = query.eq('academic_year_id', filters.academicYearId)
  if (filters?.status)         query = query.eq('status', filters.status)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  
  // Lấy thêm số buổi đã học
  const classIds = data.map(c => c.id)
  let completedMap: Record<string, number> = {}
  if (classIds.length > 0) {
    const { data: attData } = await supabase
      .from('attendance')
      .select('session_date, enrollments!inner(class_id)')
      .in('enrollments.class_id', classIds)
      .eq('is_deleted', false)
      
    const classDates = new Map<string, Set<string>>()
    attData?.forEach((row: any) => {
      const cid = row.enrollments?.class_id
      if (!cid) return
      if (!classDates.has(cid)) classDates.set(cid, new Set())
      classDates.get(cid)!.add(row.session_date)
    })
    
    completedMap = Object.fromEntries(
      Array.from(classDates.entries()).map(([cid, set]) => [cid, set.size])
    )
  }

  return (data as DbClass[]).map(c => ({
    ...c,
    completed_sessions: completedMap[c.id] || 0
  }))
}

export async function getClassById(id: string) {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      teacher: teachers ( * ),
      room: rooms ( * ),
      class_schedules ( * ),
      enrollments (
        id, status, enrolled_date,
        student: students ( id, full_name, level, status )
      )
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error) throw error
  return data as DbClass
}

export async function createClass(payload: Partial<DbClass>, assistantIds?: string[]) {
  const { data, error } = await supabase
    .from('classes')
    .insert(payload)
    .select()
    .single()

  if (error) throw error

  if (assistantIds?.length) {
    const { error: syncError } = await supabase.rpc('sync_class_assistants', {
      p_class_id: data.id,
      p_teacher_ids: assistantIds,
    })
    if (syncError) console.error('Error saving class assistants:', syncError)
  }

  return data as DbClass
}

export async function updateClass(id: string, payload: Partial<DbClass>, assistantIds?: string[]) {
  const { data, error } = await supabase
    .from('classes')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  if (assistantIds !== undefined) {
    const { error: syncError } = await supabase.rpc('sync_class_assistants', {
      p_class_id: id,
      p_teacher_ids: assistantIds,
    })
    if (syncError) console.error('Error syncing class assistants:', syncError)
  }

  return data as DbClass
}

export async function getEnrollmentsByClass(classId: string) {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      id, status, enrolled_date,
      student: students ( id, full_name, level, status )
    `)
    .eq('class_id', classId)
    .eq('is_deleted', false)
    .order('enrolled_date', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function softDeleteClass(id: string) {
  const { error } = await supabase
    .from('classes')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) throw error
}

export async function createEnrollment(studentId: string, classId: string) {
  // Kiểm tra xem học sinh này đã có lớp nào hoạt động chưa (is_deleted = false)
  const { data: activeEnrollment } = await supabase
    .from('enrollments')
    .select(`
      id,
      class: classes ( name )
    `)
    .eq('student_id', studentId)
    .eq('is_deleted', false)
    .maybeSingle()

  if (activeEnrollment) {
    const clsName = (activeEnrollment as any).class?.name || 'lớp khác'
    throw new Error(`Học sinh đã đăng ký lớp "${clsName}". Vui lòng bỏ lớp cũ trước khi đăng ký lớp mới.`)
  }

  // Kiểm tra đã tồn tại liên kết này trong lịch sử chưa (kể cả đã bị soft-delete)
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id, is_deleted')
    .eq('student_id', studentId)
    .eq('class_id', classId)
    .maybeSingle()

  if (existing) {
    if (!existing.is_deleted) throw new Error('Học sinh đã được đăng ký vào lớp này')
    // Restore nếu đã bị xoá
    const { data, error } = await supabase
      .from('enrollments')
      .update({ is_deleted: false, status: 'active', enrolled_date: new Date().toISOString().split('T')[0] })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('enrollments')
    .insert({
      student_id: studentId,
      class_id: classId,
      status: 'active',
      enrolled_date: new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function removeEnrollment(enrollmentId: string) {
  const { error } = await supabase
    .from('enrollments')
    .update({ is_deleted: true })
    .eq('id', enrollmentId)

  if (error) throw error
}

export async function getStudentsNotInClass(_classId: string) {
  // Lấy tất cả student_id đã được enroll ở bất cứ lớp nào (is_deleted = false)
  const { data: enrolled } = await supabase
    .from('enrollments')
    .select('student_id')
    .eq('is_deleted', false)

  const enrolledIds = (enrolled ?? []).map((e: any) => e.student_id).filter(Boolean)

  let q = supabase
    .from('students')
    .select('id, full_name, level, status')
    .eq('is_deleted', false)
    .eq('status', 'active')
    .order('full_name')

  if (enrolledIds.length > 0) {
    q = q.not('id', 'in', `(${enrolledIds.join(',')})`)
  }

  const { data, error } = await q
  if (error) throw error
  return data ?? []
}
