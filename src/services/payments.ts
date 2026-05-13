import { supabase } from '../lib/supabase'
import type { DbPayment } from '../types/database'

export async function getPayments(filters?: {
  branchId?: string
  academicYearId?: string
  status?: string
  month?: number
  year?: number
}) {
  let query = supabase
    .from('payments')
    .select(`
      *,
      student: students ( id, full_name ),
      class: classes ( id, name )
    `)
    .eq('is_deleted', false)

  if (filters?.branchId)       query = query.eq('branch_id', filters.branchId)
  if (filters?.academicYearId) query = query.eq('academic_year_id', filters.academicYearId)
  if (filters?.status)         query = query.eq('status', filters.status)
  if (filters?.month)          query = query.eq('period_month', filters.month)
  if (filters?.year)           query = query.eq('period_year', filters.year)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data as DbPayment[]
}

export async function getPaymentsByStudent(studentId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select(`*, class: classes ( id, name )`)
    .eq('student_id', studentId)
    .eq('is_deleted', false)
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false })

  if (error) throw error
  return data as DbPayment[]
}

export async function createPayment(payload: Partial<DbPayment>) {
  const { data, error } = await supabase
    .from('payments')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data as DbPayment
}

export async function updatePayment(id: string, payload: Partial<DbPayment>) {
  const { data, error } = await supabase
    .from('payments')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as DbPayment
}
