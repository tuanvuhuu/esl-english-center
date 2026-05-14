import { supabase } from '../lib/supabase'
import type { Parent } from '../types/database'

export interface ParentLinkedStudent {
  id: string
  full_name: string
  level: string | null
  status: string
}

export interface DbParent extends Parent {
  student_parents?: {
    id: string
    relation: 'father' | 'mother' | 'grandfather' | 'grandmother' | 'guardian' | 'other'
    is_primary: boolean
    is_emergency: boolean
    student?: ParentLinkedStudent
  }[]
}

export async function getParents(): Promise<DbParent[]> {
  const { data, error } = await supabase
    .from('parents')
    .select(`
      *,
      student_parents (
        id, relation, is_primary, is_emergency,
        student: students ( id, full_name, level, status )
      )
    `)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as DbParent[]
}

export async function getParentById(id: string): Promise<DbParent> {
  const { data, error } = await supabase
    .from('parents')
    .select(`
      *,
      student_parents (
        id, relation, is_primary, is_emergency, notes,
        student: students ( id, full_name, level, status, dob, gender, phone )
      )
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .single()
  if (error) throw error
  return data as DbParent
}

export async function createParent(payload: Partial<Parent>): Promise<Parent> {
  const { data, error } = await supabase
    .from('parents')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data as Parent
}

export async function updateParent(id: string, payload: Partial<Parent>): Promise<Parent> {
  const { data, error } = await supabase
    .from('parents')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Parent
}

export async function softDeleteParent(id: string): Promise<void> {
  const { error } = await supabase
    .from('parents')
    .update({ is_deleted: true })
    .eq('id', id)
  if (error) throw error
}

/**
 * Link an existing parent to a student.
 */
export async function linkParentToStudent(
  parentId: string,
  studentId: string,
  relation: 'father' | 'mother' | 'grandfather' | 'grandmother' | 'guardian' | 'other' = 'mother',
  isPrimary: boolean = false,
  isEmergency: boolean = false,
): Promise<void> {
  const { error } = await supabase
    .from('student_parents')
    .insert({ parent_id: parentId, student_id: studentId, relation, is_primary: isPrimary, is_emergency: isEmergency })
  if (error) throw error
}

/**
 * Unlink a parent from a student.
 */
export async function unlinkParentFromStudent(studentParentId: string): Promise<void> {
  const { error } = await supabase
    .from('student_parents')
    .delete()
    .eq('id', studentParentId)
  if (error) throw error
}
