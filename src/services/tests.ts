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

export async function getStudentTestHistory(studentId: string): Promise<(DbTestResult & { test: DbTest })[]> {
  const { data, error } = await supabase
    .from('test_results')
    .select(`
      *,
      test: tests ( id, name, type, test_date, total_score, pass_threshold, status, class: classes ( id, name, level ) )
    `)
    .eq('student_id', studentId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })

  if (error) throw error
  return ((data ?? []) as any[]).filter(r => r.test && r.test.status === 'completed') as any
}

export async function softDeleteTest(id: string) {
  const { error } = await supabase
    .from('tests')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) throw error
}

// ── Question Bank ───────────────────────────────────────────────

export interface BankQuestion {
  id: string
  skill: 'reading' | 'listening' | 'speaking' | 'writing' | 'general'
  type: 'mcq' | 'true_false' | 'fill_blank' | 'short_answer' | 'essay' | 'speaking_prompt'
  level: string | null
  topic: string | null
  difficulty: number
  question_text: string
  image_url: string | null
  audio_url: string | null
  points: number
  explanation: string | null
  tags: string[] | null
  usage_count: number
  is_public: boolean
  created_by?: string | null
  options?: { id: string; option_text: string; is_correct: boolean; order_index: number }[]
}

export async function getBankQuestions(filters?: {
  skill?: string; level?: string; topic?: string; search?: string;
  scope?: 'all' | 'mine' | 'shared'; userId?: string;
}): Promise<BankQuestion[]> {
  let q = supabase
    .from('question_bank')
    .select('*, options: question_bank_options(*)')
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false })

  if (filters?.skill)  q = q.eq('skill', filters.skill)
  if (filters?.level)  q = q.eq('level', filters.level)
  if (filters?.topic)  q = q.eq('topic', filters.topic)
  if (filters?.search) q = q.ilike('question_text', `%${filters.search}%`)

  if (filters?.scope === 'mine' && filters.userId) {
    q = q.eq('created_by', filters.userId)
  } else if (filters?.scope === 'shared') {
    q = q.eq('is_public', true)
  }

  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as BankQuestion[]
}

export async function createBankQuestion(
  q: Partial<BankQuestion>,
  options?: { option_text: string; is_correct: boolean; order_index: number }[]
): Promise<BankQuestion> {
  const { data, error } = await supabase
    .from('question_bank')
    .insert(q)
    .select('*')
    .single()
  if (error) throw error

  if (options && options.length > 0) {
    const optsPayload = options.map(o => ({ ...o, bank_id: data.id }))
    const { error: optErr } = await supabase.from('question_bank_options').insert(optsPayload)
    if (optErr) throw optErr
  }
  return data as BankQuestion
}

export async function deleteBankQuestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('question_bank')
    .update({ is_deleted: true })
    .eq('id', id)
  if (error) throw error
}

export async function toggleBankQuestionPublic(id: string, isPublic: boolean): Promise<void> {
  const { error } = await supabase
    .from('question_bank')
    .update({ is_public: isPublic })
    .eq('id', id)
  if (error) throw error
}

// Save a test_question (and its options) into the bank
export async function saveQuestionToBank(testQuestionId: string, isPublic: boolean = false): Promise<void> {
  const { data: q, error } = await supabase
    .from('test_questions')
    .select('*, options: test_question_options(*)')
    .eq('id', testQuestionId)
    .single()
  if (error) throw error

  await createBankQuestion(
    {
      skill: q.skill, type: q.type, question_text: q.question_text,
      image_url: q.image_url, audio_url: q.audio_url,
      points: q.points, explanation: q.explanation,
      is_public: isPublic,
    },
    (q.options ?? []).map((o: any, i: number) => ({
      option_text: o.option_text, is_correct: o.is_correct, order_index: i,
    }))
  )
}

// Copy a bank question into a test
export async function addBankQuestionToTest(
  bankId: string,
  testId: string,
  orderIndex: number
): Promise<void> {
  const { data: bq, error: bErr } = await supabase
    .from('question_bank')
    .select('*, options: question_bank_options(*)')
    .eq('id', bankId)
    .single()
  if (bErr) throw bErr

  const { data: newQ, error: insErr } = await supabase
    .from('test_questions')
    .insert({
      test_id: testId,
      skill: bq.skill, type: bq.type, question_text: bq.question_text,
      image_url: bq.image_url, audio_url: bq.audio_url,
      points: bq.points, order_index: orderIndex, explanation: bq.explanation,
    })
    .select('id')
    .single()
  if (insErr) throw insErr

  if (bq.options && bq.options.length > 0) {
    await supabase.from('test_question_options').insert(
      bq.options.map((o: any) => ({
        question_id: newQ.id,
        option_text: o.option_text,
        is_correct: o.is_correct,
        order_index: o.order_index,
      }))
    )
  }

  // Bump usage_count
  await supabase
    .from('question_bank')
    .update({ usage_count: (bq.usage_count ?? 0) + 1 })
    .eq('id', bankId)
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

export async function uploadStudentAudio(testId: string, studentId: string, blob: Blob): Promise<string> {
  const BUCKET = 'test-files'
  const path = `audio/${testId}/${studentId}.webm`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true, contentType: 'audio/webm' })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return `${data.publicUrl}?t=${Date.now()}`
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
