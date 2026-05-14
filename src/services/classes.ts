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
  return data as DbClass[]
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
