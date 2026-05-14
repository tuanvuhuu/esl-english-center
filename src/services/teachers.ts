import { supabase } from '../lib/supabase'
import type { DbTeacher } from '../types/database'

export async function getTeachers(filters?: { branchId?: string }) {
  let query = supabase
    .from('teachers')
    .select(`
      *,
      teacher_subjects ( subject: subjects ( id, name ) ),
      teacher_branches ( branch_id, branch: branches ( id, name ) ),
      primary_branch: branches!primary_branch_id ( id, name )
    `)
    .eq('is_deleted', false)

  if (filters?.branchId) {
    // Nếu lọc theo branch, ta có thể lọc theo primary_branch_id 
    // HOẶC lọc những GV có trong teacher_branches. 
    // Ở đây ta ưu tiên lọc theo teacher_branches nếu GV có thể ở nhiều nơi.
    // Tuy nhiên, Supabase .eq() trên nested join hơi phức tạp nếu không dùng .rpc().
    // Tạm thời lọc theo primary_branch_id để tương thích code cũ, 
    // hoặc chuyển sang lọc client-side nếu danh sách không quá lớn.
    query = query.eq('primary_branch_id', filters.branchId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data as DbTeacher[]
}

export async function getTeacherById(id: string) {
  const { data, error } = await supabase
    .from('teachers')
    .select(`
      *,
      teacher_subjects ( subject: subjects ( id, name ) ),
      teacher_branches ( branch_id, branch: branches ( id, name ) ),
      primary_branch: branches!primary_branch_id ( id, name, address, phone )
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error) throw error
  return data as DbTeacher
}

export async function createTeacher(payload: Partial<DbTeacher>, branchIds?: string[]) {
  const { data, error } = await supabase
    .from('teachers')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  
  if (branchIds?.length) {
    const { error: branchError } = await supabase.rpc('sync_teacher_branches', {
      p_teacher_id: data.id,
      p_branch_ids: branchIds,
    })
    if (branchError) console.error('Error saving teacher branches:', branchError)
  }

  return data as DbTeacher
}

export async function updateTeacher(id: string, payload: Partial<DbTeacher>, branchIds?: string[]) {
  const { data, error } = await supabase
    .from('teachers')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  if (branchIds) {
    // Sync branches qua RPC: atomic trong 1 transaction
    const { error: syncError } = await supabase.rpc('sync_teacher_branches', {
      p_teacher_id: id,
      p_branch_ids: branchIds,
    })
    if (syncError) console.error('Error syncing teacher branches:', syncError)
  }

  return data as DbTeacher
}

export async function softDeleteTeacher(id: string) {
  const { error } = await supabase
    .from('teachers')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) throw error
}
