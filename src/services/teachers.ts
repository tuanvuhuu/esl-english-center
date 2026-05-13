import { supabase } from '../lib/supabase'
import type { DbTeacher } from '../types/database'

export async function getTeachers() {
  const { data, error } = await supabase
    .from('teachers')
    .select(`
      *,
      teacher_subjects (
        subject: subjects ( id, name )
      ),
      primary_branch: branches!primary_branch_id ( id, name )
    `)
    .eq('is_deleted', false)
    .order('full_name')

  if (error) throw error
  return data as DbTeacher[]
}

export async function getTeacherById(id: string) {
  const { data, error } = await supabase
    .from('teachers')
    .select(`
      *,
      teacher_subjects ( subject: subjects ( id, name ) ),
      primary_branch: branches!primary_branch_id ( id, name, address, phone )
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error) throw error
  return data as DbTeacher
}

export async function createTeacher(payload: Partial<DbTeacher>) {
  const { data, error } = await supabase
    .from('teachers')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data as DbTeacher
}

export async function updateTeacher(id: string, payload: Partial<DbTeacher>) {
  const { data, error } = await supabase
    .from('teachers')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as DbTeacher
}

export async function softDeleteTeacher(id: string) {
  const { error } = await supabase
    .from('teachers')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) throw error
}
