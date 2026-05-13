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
