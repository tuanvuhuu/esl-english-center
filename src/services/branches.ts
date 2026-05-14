import { supabase } from '../lib/supabase'
import type { Branch } from '../types/database'

export async function getBranches() {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('is_deleted', false)
    .order('code')

  if (error) throw error
  return data as Branch[]
}

export async function getBranchById(id: string) {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Branch
}

export async function createBranch(payload: {
  code: string; name: string; address?: string | null
  phone?: string | null; email?: string | null; status: 'active' | 'inactive'; notes?: string | null
}) {
  const { data, error } = await supabase.from('branches').insert(payload).select().single()
  if (error) throw error
  return data as Branch
}

export async function updateBranch(id: string, payload: Partial<{
  code: string; name: string; address: string | null
  phone: string | null; email: string | null; status: 'active' | 'inactive'; notes: string | null
}>) {
  const { data, error } = await supabase.from('branches').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data as Branch
}

export async function softDeleteBranch(id: string) {
  const { error } = await supabase.from('branches').update({ is_deleted: true }).eq('id', id)
  if (error) throw error
}
