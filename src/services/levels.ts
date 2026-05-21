import { supabase } from '../lib/supabase'

export interface StudentLevel {
  id?: string;
  value: string;
  label: string;
  is_deleted?: boolean;
}

export async function getStudentLevels(): Promise<StudentLevel[]> {
  const { data, error } = await supabase
    .from('student_levels')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch levels from Supabase', error)
    throw error
  }
  return data || []
}

export async function createStudentLevel(payload: { value: string; label: string }): Promise<StudentLevel> {
  const { data, error } = await supabase
    .from('student_levels')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data as StudentLevel
}

export async function updateStudentLevel(id: string, payload: Partial<{ value: string; label: string }>): Promise<StudentLevel> {
  const { data, error } = await supabase
    .from('student_levels')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as StudentLevel
}

export async function softDeleteStudentLevel(id: string): Promise<void> {
  const { error } = await supabase
    .from('student_levels')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) throw error
}
