import { supabase } from '../lib/supabase'
import type { AcademicYear } from '../types/database'

export async function getAcademicYears() {
  const { data, error } = await supabase
    .from('academic_years')
    .select('*')
    .eq('is_deleted', false)
    .order('start_date', { ascending: false })

  if (error) throw error
  return data as AcademicYear[]
}

export async function getCurrentAcademicYear() {
  const { data, error } = await supabase
    .from('academic_years')
    .select('*')
    .eq('is_current', true)
    .single()

  if (error) throw error
  return data as AcademicYear
}

export async function createAcademicYear(payload: {
  name: string; start_date: string; end_date: string
  is_current?: boolean; notes?: string | null
}) {
  const { data, error } = await supabase.from('academic_years').insert(payload).select().single()
  if (error) throw error
  return data as AcademicYear
}

export async function updateAcademicYear(id: string, payload: Partial<{
  name: string; start_date: string; end_date: string; is_current: boolean; notes: string | null
}>) {
  const { data, error } = await supabase.from('academic_years').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data as AcademicYear
}

export async function softDeleteAcademicYear(id: string) {
  const { error } = await supabase.from('academic_years').update({ is_deleted: true }).eq('id', id)
  if (error) throw error
}

export async function setCurrentAcademicYear(id: string) {
  const { error: e1 } = await supabase.from('academic_years').update({ is_current: false }).eq('is_deleted', false)
  if (e1) throw e1
  const { error: e2 } = await supabase.from('academic_years').update({ is_current: true }).eq('id', id)
  if (e2) throw e2
}
