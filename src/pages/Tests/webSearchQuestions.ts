import { getGeminiKey } from '../../lib/gemini'
import type { GeneratedQuestion } from './questionGenerator'
import type { QuestionSkill, QuestionType } from '../../types/database'

const GEMINI_MODEL = 'gemini-flash-latest'

export interface WebSearchedQuestion extends GeneratedQuestion {
  source_url?: string
  source_title?: string
}

const buildSearchPrompt = (opts: {
  topic: string
  skill: QuestionSkill | 'all'
  level: string
  count: number
  type?: QuestionType | 'all'
}): string => {
  const { topic, skill, level, count, type = 'all' } = opts
  const topicVi = topic.trim() || 'tổng hợp'
  const levelMap: Record<string, string> = {
    'STARTER': 'mầm non / lớp 1',
    'STARTERS': 'mầm non / lớp 1',
    'MOVERS': 'lớp 2-3',
    'A1': 'lớp 2-3',
    'FLYERS': 'lớp 4-5',
    'A2': 'lớp 4-5',
    'B1': 'THCS lớp 6-8',
  }
  const levelVi = levelMap[level.toUpperCase()] || level

  const typeMap: Record<string, string> = {
    'mcq': 'trắc nghiệm (multiple choice)',
    'true_false': 'đúng/sai (true/false)',
    'fill_blank': 'điền vào chỗ trống (fill in the blank)',
    'short_answer': 'trả lời ngắn (short answer)',
    'essay': 'tự luận/viết đoạn văn (essay)',
    'speaking_prompt': 'nói/đọc to (speaking prompt)',
  }
  const typeVi = type !== 'all' ? (typeMap[type] || type) : null

  return `
Hãy SEARCH GOOGLE tìm các đề thi/bài tập tiếng Anh cho **${levelVi}** với chủ đề "${topicVi}" trên các trang giáo dục Việt Nam như:
ila.edu.vn, vietjack.com, hoctot.com, vndoc.com, hoc24.vn, e4.com.vn, vuihoc.vn, monkey.edu.vn, thi.tienganh123.com, ...

Yêu cầu:
1. Tìm và đọc ÍT NHẤT 3 trang web khác nhau.
2. Trích xuất CHÍNH XÁC ${count} câu hỏi từ các đề thi đó.
3. Mỗi câu phải GHI RÕ source URL gốc.
4. Đa dạng nguồn (không lấy hết từ 1 trang).
5. Câu hỏi phải ĐÚNG NGUYÊN VĂN tiếng Anh từ đề thi gốc, không tự bịa.

${skill !== 'all' ? `Kỹ năng: ${skill}` : 'Mix các kỹ năng'}
${typeVi ? `Định dạng câu hỏi: CHỈ tìm và trích xuất các câu hỏi loại: ${typeVi}` : 'Mix các loại câu hỏi'}

**TRẢ VỀ JSON HỢP LỆ (không markdown fence)**, theo schema:
{
  "questions": [
    {
      "skill": "reading|listening|speaking|writing|general",
      "type": "mcq|true_false|fill_blank|short_answer|essay|speaking_prompt",
      "question_text": "string (English)",
      "options": [{ "text": "string", "isCorrect": boolean }],
      "explanation": "string (có thể tiếng Việt)",
      "points": number,
      "source_url": "string (URL gốc)",
      "source_title": "string (tên trang/bài)"
    }
  ]
}

Trả về JSON OBJECT có key "questions" là mảng. Không thêm text giải thích bên ngoài JSON.
  `.trim()
}

export async function searchQuestionsOnline(opts: {
  topic: string
  skill: QuestionSkill | 'all'
  level: string
  count: number
  type?: QuestionType | 'all'
  skillPoints?: Record<QuestionSkill, number>
}): Promise<WebSearchedQuestion[]> {
  const apiKey = getGeminiKey()
  if (!apiKey) throw new Error('Chưa cấu hình Gemini API key')

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

  const body = {
    contents: [{ role: 'user', parts: [{ text: buildSearchPrompt(opts) }] }],
    tools: [{ google_search: {} }],   // Gemini Search Grounding
    generationConfig: {
      temperature: 0.7,
    },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini search error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  // Strip markdown fence nếu có
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  // Lấy JSON ra (có thể có text bên ngoài)
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error('[searchQuestionsOnline] No JSON found in response:', text)
    throw new Error('Gemini không trả về JSON hợp lệ. Thử lại.')
  }

  const parsed = JSON.parse(jsonMatch[0])
  const questions = (parsed.questions ?? []) as any[]

  // Lấy thêm grounding metadata (URL trích dẫn) nếu có
  const grounding = data?.candidates?.[0]?.groundingMetadata
  const groundingChunks = grounding?.groundingChunks ?? []
  const citedUrls = groundingChunks.map((c: any) => c?.web?.uri).filter(Boolean)

  console.log('[searchQuestionsOnline] Found', questions.length, 'questions from', citedUrls.length, 'sources')
  console.log('[searchQuestionsOnline] Sources:', citedUrls)

  return questions.map(q => ({
    skill: q.skill as QuestionSkill,
    type: q.type,
    question_text: q.question_text,
    options: q.options,
    explanation: q.explanation,
    points: opts.skillPoints?.[q.skill as QuestionSkill] ?? (q.points ?? 1),
    source_url: q.source_url,
    source_title: q.source_title,
    image_url: undefined,
  }))
}
