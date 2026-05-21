import { supabase } from '../lib/supabase'
import type { DbStudent, Parent, StudentParent } from '../types/database'

export interface AttendanceDeductionPolicy {
  present: boolean
  late: boolean
  absent: boolean
  excused: boolean
}

export const DEFAULT_ATTENDANCE_POLICY: AttendanceDeductionPolicy = {
  present: true,
  late: true,
  absent: true,
  excused: true,
}

export function getAttendancePolicy(): AttendanceDeductionPolicy {
  try {
    const raw = localStorage.getItem('attendance_deduction_policy')
    if (raw) {
      return { ...DEFAULT_ATTENDANCE_POLICY, ...JSON.parse(raw) }
    }
  } catch (e) {
    console.error('Failed to parse attendance policy', e)
  }
  return DEFAULT_ATTENDANCE_POLICY
}

export async function getStudents(filters?: { branchId?: string; yearId?: string }) {
  const hasFilter = filters?.branchId || filters?.yearId

  // When filtering by branch/year, use !inner join on student_academic_records
  // The cast is needed because Supabase TS parser can't resolve conditional select strings
  let query: any = supabase.from('students').select(
    hasFilter
      ? `*, student_parents ( id, relation, is_primary, is_emergency, parent: parents ( id, full_name, phone, phone_secondary, email, address ) ), student_academic_records!inner ( branch_id, academic_year_id ), enrollments ( id, status, enrolled_date, is_deleted, class: classes ( id, name, total_sessions ) )`
      : `*, student_parents ( id, relation, is_primary, is_emergency, parent: parents ( id, full_name, phone, phone_secondary, email, address ) ), enrollments ( id, status, enrolled_date, is_deleted, class: classes ( id, name, total_sessions ) )`
  ).eq('is_deleted', false)

  if (filters?.branchId) query = query.eq('student_academic_records.branch_id', filters.branchId)
  if (filters?.yearId)   query = query.eq('student_academic_records.academic_year_id', filters.yearId)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error

  const studentIds = data?.map((s: any) => s.id) ?? []
  let statsMap: Record<string, { present: number; late: number; absent: number; excused: number }> = {}
  if (studentIds.length > 0) {
    const { data: attData } = await supabase
      .from('attendance')
      .select('status, session_date, enrollment_id, enrollments!inner(student_id)')
      .in('enrollments.student_id', studentIds)
      .eq('is_deleted', false)

    // Build map of active enrollment for each student
    const activeEnrollmentByStudent: Record<string, any> = {}
    data?.forEach((s: any) => {
      const activeEnroll = (s.enrollments ?? []).find(
        (e: any) => (e.status === 'active' || e.status === 'enrolled') && e.is_deleted !== true
      )
      if (activeEnroll) {
        activeEnrollmentByStudent[s.id] = activeEnroll
      }
    })

    attData?.forEach((r: any) => {
      const sid = r.enrollments?.student_id
      if (!sid) return
      
      const activeEnroll = activeEnrollmentByStudent[sid]
      if (!activeEnroll) return

      // Count attendance only for the active enrollment AND date must be >= enrolled_date
      if (r.enrollment_id === activeEnroll.id) {
        if (!activeEnroll.enrolled_date || r.session_date >= activeEnroll.enrolled_date) {
          if (!statsMap[sid]) statsMap[sid] = { present: 0, late: 0, absent: 0, excused: 0 }
          if (r.status === 'present') statsMap[sid].present++
          else if (r.status === 'late') statsMap[sid].late++
          else if (r.status === 'absent') statsMap[sid].absent++
          else if (r.status === 'excused') statsMap[sid].excused++
        }
      }
    })
  }

  const policy = getAttendancePolicy()

  return (data ?? []).map((s: any) => {
    const st = statsMap[s.id]
    const activeEnroll = (s.enrollments ?? []).find(
      (e: any) => (e.status === 'active' || e.status === 'enrolled') && e.is_deleted !== true
    )
    const classTotalSessions = activeEnroll?.class?.total_sessions ?? null
    const className = activeEnroll?.class?.name ?? null
    const enrolledDate = activeEnroll?.enrolled_date ?? null

    const pCount = st?.present ?? 0
    const lCount = st?.late ?? 0
    const aCount = st?.absent ?? 0
    const eCount = st?.excused ?? 0

    // Present rate and absence count metrics
    const totalPresent = pCount + lCount
    const totalAbsent = aCount + eCount
    const totalAttended = totalPresent + totalAbsent

    let deductedSessions = 0
    if (policy.present) deductedSessions += pCount
    if (policy.late) deductedSessions += lCount
    if (policy.absent) deductedSessions += aCount
    if (policy.excused) deductedSessions += eCount

    const remainingSessions = classTotalSessions != null
      ? Math.max(0, classTotalSessions - deductedSessions)
      : null

    return {
      ...s,
      attendanceRate: totalAttended > 0 ? (totalPresent / totalAttended) * 100 : undefined,
      absenceCount: totalAbsent,
      className,
      enrolledDate,
      totalSessions: classTotalSessions,
      remainingSessions,
    }
  }) as DbStudent[]
}

export async function getStudentById(id: string) {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      student_parents (
        id, relation, is_primary, is_emergency, notes,
        parent: parents ( * )
      ),
      enrollments (
        id, status, enrolled_date, is_deleted,
        class: classes ( id, name, level, fee_per_month, total_sessions, end_date,
          teacher: teachers!teacher_id ( id, full_name ),
          class_schedules ( day_of_week, start_time, end_time )
        )
      )
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error) throw error

  const policy = getAttendancePolicy()

  // Đếm số buổi đã học cho từng enrollment
  const enrollmentIds = (data?.enrollments ?? []).map((e: any) => e.id)
  let attendanceMap: Record<string, { present: number; late: number; absent: number; excused: number }> = {}
  if (enrollmentIds.length > 0) {
    const { data: attRows } = await supabase
      .from('attendance')
      .select('enrollment_id, status')
      .in('enrollment_id', enrollmentIds)
      .eq('is_deleted', false)
    attRows?.forEach((r: any) => {
      if (!attendanceMap[r.enrollment_id]) {
        attendanceMap[r.enrollment_id] = { present: 0, late: 0, absent: 0, excused: 0 }
      }
      if (r.status === 'present') attendanceMap[r.enrollment_id].present++
      else if (r.status === 'late') attendanceMap[r.enrollment_id].late++
      else if (r.status === 'absent') attendanceMap[r.enrollment_id].absent++
      else if (r.status === 'excused') attendanceMap[r.enrollment_id].excused++
    })
  }

  const enriched = {
    ...data,
    enrollments: (data?.enrollments ?? []).map((e: any) => {
      const att = attendanceMap[e.id] ?? { present: 0, late: 0, absent: 0, excused: 0 }
      
      let consumed = 0
      if (policy.present) consumed += att.present
      if (policy.late) consumed += att.late
      if (policy.absent) consumed += att.absent
      if (policy.excused) consumed += att.excused

      const actualAbsences = att.absent + att.excused

      return {
        ...e,
        attendedSessions: consumed,
        absentSessions: actualAbsences,
      }
    })
  }

  return enriched as DbStudent
}

export async function createStudent(payload: Partial<DbStudent>) {
  const { data, error } = await supabase
    .from('students')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data as DbStudent
}

export async function updateStudent(id: string, payload: Partial<DbStudent>) {
  const { data, error } = await supabase
    .from('students')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as DbStudent
}

export async function softDeleteStudent(id: string) {
  const { error } = await supabase
    .from('students')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) throw error
}

export async function updateStudentStatus(id: string, status: DbStudent['status']) {
  const { data, error } = await supabase
    .from('students')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as DbStudent
}

export async function bulkSoftDeleteStudents(ids: string[]) {
  if (ids.length === 0) return
  const { error } = await supabase
    .from('students')
    .update({ is_deleted: true })
    .in('id', ids)

  if (error) throw error
}

export async function bulkUpdateStudentStatus(ids: string[], status: DbStudent['status']) {
  if (ids.length === 0) return
  const { error } = await supabase
    .from('students')
    .update({ status })
    .in('id', ids)

  if (error) throw error
}

/**
 * Liên kết HV với 1 chi nhánh + năm học (bảng student_academic_records).
 * Cần thiết để HV xuất hiện khi filter theo branch/year ở `getStudents`.
 * Idempotent: nếu đã tồn tại link thì bỏ qua.
 */
export async function linkStudentToAcademicYear(
  studentId: string,
  branchId: string,
  academicYearId: string,
  level?: string | null,
): Promise<void> {
  // Check existing first to keep this idempotent
  const { data: existing } = await supabase
    .from('student_academic_records')
    .select('id')
    .eq('student_id', studentId)
    .eq('branch_id', branchId)
    .eq('academic_year_id', academicYearId)
    .maybeSingle()

  if (existing) return

  const { error } = await supabase
    .from('student_academic_records')
    .insert({
      student_id: studentId,
      branch_id: branchId,
      academic_year_id: academicYearId,
      level: level ?? null,
      status: 'enrolled',
    })
  if (error) throw error
}

export interface FormParentItem {
  id?: string
  full_name: string
  phone: string
  email?: string | null
  address?: string | null
  gender?: 'M' | 'F' | null
  dob?: string | null
  occupation?: string | null
  notes?: string | null
  relation: StudentParent['relation']
  is_primary?: boolean
  is_emergency?: boolean
}

export async function createStudentWithParents(
  student: Partial<DbStudent>,
  parents: FormParentItem[]
) {
  const { data: newStudent, error: sErr } = await supabase
    .from('students').insert(student).select().single()
  if (sErr) throw sErr

  for (const item of parents) {
    const { relation, is_primary, is_emergency, id, ...parentFields } = item
    let parentId = id
    if (!parentId) {
      const { data: newParent, error: pErr } = await supabase
        .from('parents').insert(parentFields).select().single()
      if (pErr) throw pErr
      parentId = newParent.id
    }
    const { error: spErr } = await supabase.from('student_parents').insert({
      student_id: newStudent.id,
      parent_id: parentId,
      relation,
      is_primary: is_primary ?? false,
      is_emergency: is_emergency ?? false,
    })
    if (spErr) throw spErr
  }

  return newStudent as DbStudent
}

export async function updateStudentWithParents(
  studentId: string,
  studentUpdates: Partial<DbStudent>,
  parents: FormParentItem[]
) {
  // Update student
  const { error: sErr } = await supabase.from('students').update(studentUpdates).eq('id', studentId)
  if (sErr) throw sErr

  // Fetch all existing relations
  const { data: existingLinks, error: linkErr } = await supabase
    .from('student_parents')
    .select('*')
    .eq('student_id', studentId)
  if (linkErr) throw linkErr

  // Map to keep track of processed existing links
  const processedLinkIds = new Set<string>()

  for (const item of parents) {
    const { relation, is_primary, is_emergency, id, ...parentFields } = item
    let parentId = id

    // Find if this parent is already linked
    const existingLink = parentId
      ? existingLinks.find(el => String(el.parent_id) === String(parentId))
      : null

    if (existingLink) {
      processedLinkIds.add(existingLink.id)

      // Update relation and primary/emergency flags
      const { error: spErr } = await supabase
        .from('student_parents')
        .update({
          relation,
          is_primary: is_primary ?? false,
          is_emergency: is_emergency ?? false,
        })
        .eq('id', existingLink.id)
      if (spErr) throw spErr

      // Update parent info if needed
      if (parentId) {
        const { error: pErr } = await supabase
          .from('parents')
          .update(parentFields)
          .eq('id', parentId)
        if (pErr) throw pErr
      }
    } else {
      // If we don't have parent ID, or the parent is not linked to this student
      if (!parentId) {
        // Create new parent first
        const { data: newParent, error: pErr } = await supabase
          .from('parents').insert(parentFields).select().single()
        if (pErr) throw pErr
        parentId = newParent.id
      }

      // Create new link
      const { error: spErr } = await supabase
        .from('student_parents')
        .insert({
          student_id: studentId,
          parent_id: parentId,
          relation,
          is_primary: is_primary ?? false,
          is_emergency: is_emergency ?? false,
        })
      if (spErr) throw spErr
    }
  }

  // Remove any links that were not processed (i.e. deleted by user in the form)
  const linksToRemove = existingLinks.filter(el => !processedLinkIds.has(el.id))
  for (const link of linksToRemove) {
    const { error: delErr } = await supabase
      .from('student_parents')
      .delete()
      .eq('id', link.id)
    if (delErr) throw delErr
  }
}

export async function createStudentWithParent(
  student: Partial<DbStudent>,
  parent: Partial<Parent>,
  relation: StudentParent['relation'] = 'mother'
) {
  return createStudentWithParents(student, [
    {
      ...parent,
      relation,
      is_primary: true,
      is_emergency: true,
    } as any
  ])
}

export async function updateStudentWithParent(
  studentId: string,
  studentUpdates: Partial<DbStudent>,
  parentInfo: Partial<Parent>,
  relation: StudentParent['relation'] = 'mother'
) {
  await updateStudentWithParents(studentId, studentUpdates, [
    {
      ...parentInfo,
      relation,
      is_primary: true,
      is_emergency: true,
    } as any
  ])
}
