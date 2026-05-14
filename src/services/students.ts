import { supabase } from '../lib/supabase'
import type { DbStudent, Parent, StudentParent } from '../types/database'

export async function getStudents(filters?: { branchId?: string; yearId?: string }) {
  const hasFilter = filters?.branchId || filters?.yearId

  // When filtering by branch/year, use !inner join on student_academic_records
  // The cast is needed because Supabase TS parser can't resolve conditional select strings
  let query: any = supabase.from('students').select(
    hasFilter
      ? `*, student_parents ( id, relation, is_primary, is_emergency, parent: parents ( id, full_name, phone, phone_secondary, email, address ) ), student_academic_records!inner ( branch_id, academic_year_id )`
      : `*, student_parents ( id, relation, is_primary, is_emergency, parent: parents ( id, full_name, phone, phone_secondary, email, address ) )`
  ).eq('is_deleted', false)

  if (filters?.branchId) query = query.eq('student_academic_records.branch_id', filters.branchId)
  if (filters?.yearId)   query = query.eq('student_academic_records.academic_year_id', filters.yearId)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as DbStudent[]
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
        id, status, enrolled_date,
        class: classes ( id, name, level, fee_per_month,
          teacher: teachers ( id, full_name ),
          class_schedules ( day_of_week, start_time, end_time )
        )
      )
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error) throw error
  return data as DbStudent
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

export async function createStudentWithParent(
  student: Partial<DbStudent>,
  parent: Partial<Parent>,
  relation: StudentParent['relation'] = 'mother'
) {
  const { data: newStudent, error: sErr } = await supabase
    .from('students').insert(student).select().single()
  if (sErr) throw sErr

  const { data: newParent, error: pErr } = await supabase
    .from('parents').insert(parent).select().single()
  if (pErr) throw pErr

  const { error: spErr } = await supabase.from('student_parents').insert({
    student_id: newStudent.id,
    parent_id: newParent.id,
    relation,
    is_primary: true,
    is_emergency: true,
  })
  if (spErr) throw spErr

  return newStudent as DbStudent
}
