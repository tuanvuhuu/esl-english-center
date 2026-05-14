import { supabase } from '../lib/supabase'
import type { DbTest, DbTestResult, DbTestQuestion, DbQuestionOption } from '../types/database'

export async function getTests(filters?: {
  classId?: string
  type?: string
  status?: string
}) {
  let query = supabase
    .from('tests')
    .select(`
      *,
      class: classes ( id, name, level, teacher: teachers!teacher_id ( id, full_name ) )
    `)
    .eq('is_deleted', false)

  if (filters?.classId) query = query.eq('class_id', filters.classId)
  if (filters?.type)    query = query.eq('type', filters.type)
  if (filters?.status)  query = query.eq('status', filters.status)

  const { data, error } = await query.order('test_date', { ascending: false })
  if (error) throw error
  return (data ?? []) as DbTest[]
}

export async function getTestResults(testId: string) {
  const { data, error } = await supabase
    .from('test_results')
    .select(`
      *,
      student: students ( id, full_name, level, status )
    `)
    .eq('test_id', testId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as DbTestResult[]
}

export async function createTest(payload: Partial<DbTest>) {
  const { data, error } = await supabase
    .from('tests')
    .insert(payload)
    .select(`
      *,
      class: classes ( id, name, level, teacher: teachers!teacher_id ( id, full_name ) )
    `)
    .single()

  if (error) throw error
  return data as DbTest
}

export async function updateTest(id: string, payload: Partial<DbTest>) {
  const { data, error } = await supabase
    .from('tests')
    .update(payload)
    .eq('id', id)
    .select(`
      *,
      class: classes ( id, name, level, teacher: teachers!teacher_id ( id, full_name ) )
    `)
    .single()

  if (error) throw error
  return data as DbTest
}

export async function upsertTestResult(payload: Partial<DbTestResult>) {
  const { data, error } = await supabase
    .from('test_results')
    .upsert(payload, { onConflict: 'test_id,student_id' })
    .select(`
      *,
      student: students ( id, full_name, level, status )
    `)
    .single()

  if (error) throw error
  return data as DbTestResult
}

export async function softDeleteTest(id: string) {
  const { error } = await supabase
    .from('tests')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) throw error
}

// ── Test PDF ────────────────────────────────────────────────────

export async function uploadTestPdf(testId: string, file: File): Promise<string> {
  const BUCKET = 'test-files'
  const path = `tests/${testId}/test.pdf`

  // Diagnostic: list existing buckets
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets()
  console.log('[uploadTestPdf] available buckets:', buckets?.map(b => b.name), listErr)

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: 'application/pdf' })

  if (uploadError) {
    console.error('[uploadTestPdf] upload error:', uploadError)
    const bucketNames = buckets?.map(b => `"${b.name}"`).join(', ') || 'không tìm thấy bucket nào'
    throw new Error(
      uploadError.message === 'The resource was not found'
        ? `Bucket "${BUCKET}" không tồn tại. Buckets hiện có: ${bucketNames}`
        : uploadError.message
    )
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`
  await updateTest(testId, { pdf_url: publicUrl } as any)
  return publicUrl
}

export async function removeTestPdf(testId: string): Promise<void> {
  await supabase.storage.from('test-files').remove([`tests/${testId}/test.pdf`])
  await updateTest(testId, { pdf_url: null } as any)
}

// ── Test Questions ──────────────────────────────────────────────

export async function getTestQuestions(testId: string): Promise<DbTestQuestion[]> {
  const { data, error } = await supabase
    .from('test_questions')
    .select('*, options: test_question_options(*)')
    .eq('test_id', testId)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true })

  if (error) throw error
  return (data ?? []) as DbTestQuestion[]
}

export async function createTestQuestion(
  payload: Omit<DbTestQuestion, 'id' | 'created_at' | 'updated_at' | 'options'>,
): Promise<DbTestQuestion> {
  const { data, error } = await supabase
    .from('test_questions')
    .insert(payload)
    .select('*, options: test_question_options(*)')
    .single()

  if (error) throw error
  return data as DbTestQuestion
}

export async function updateTestQuestion(
  id: string,
  payload: Partial<DbTestQuestion>,
): Promise<DbTestQuestion> {
  const { data, error } = await supabase
    .from('test_questions')
    .update(payload)
    .eq('id', id)
    .select('*, options: test_question_options(*)')
    .single()

  if (error) throw error
  return data as DbTestQuestion
}

export async function softDeleteTestQuestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('test_questions')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) throw error
}

export async function upsertQuestionOptions(
  questionId: string,
  options: Omit<DbQuestionOption, 'id' | 'question_id'>[],
): Promise<DbQuestionOption[]> {
  await supabase.from('test_question_options').delete().eq('question_id', questionId)
  if (options.length === 0) return []

  const { data, error } = await supabase
    .from('test_question_options')
    .insert(options.map(o => ({ ...o, question_id: questionId })))
    .select('*')

  if (error) throw error
  return (data ?? []) as DbQuestionOption[]
}
