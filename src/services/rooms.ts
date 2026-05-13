import { supabase } from '../lib/supabase'
import type { DbRoom } from '../types/database'

export async function getRooms(branchId?: string) {
  let query = supabase
    .from('rooms')
    .select(`*, branch: branches ( id, name )`)
    .eq('is_deleted', false)

  if (branchId) query = query.eq('branch_id', branchId)

  const { data, error } = await query.order('name')
  if (error) throw error
  return data as DbRoom[]
}

export async function createRoom(payload: Partial<DbRoom>) {
  const { data, error } = await supabase
    .from('rooms')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data as DbRoom
}

export async function updateRoom(id: string, payload: Partial<DbRoom>) {
  const { data, error } = await supabase
    .from('rooms')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as DbRoom
}

export async function softDeleteRoom(id: string) {
  const { error } = await supabase
    .from('rooms')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) throw error
}
