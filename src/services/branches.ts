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
