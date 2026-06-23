import { aiJson } from '../../lib/ai'
import { generateImageUrl, stableSeed, buildImagePrompt } from '../../lib/imageGen'
import type { GeneratedQuestion } from './questionGenerator'
import type { QuestionSkill, QuestionType } from '../../types/database'

interface GeminiQuestion {
  skill: 'reading' | 'listening' | 'speaking' | 'writing' | 'general'
  type: 'mcq' | 'true_false' | 'fill_blank' | 'short_answer' | 'essay' | 'speaking_prompt'
  question_text: string
  options?: { text: string; isCorrect: boolean }[]
  explanation?: string
  points: number
  needsImage?: boolean
  imagePrompt?: string  // English prompt chi tiết để generate ảnh
}

const QUESTION_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          skill: { type: 'string', enum: ['reading', 'listening', 'speaking', 'writing', 'general'] },
          type:  { type: 'string', enum: ['mcq', 'true_false', 'fill_blank', 'short_answer', 'essay', 'speaking_prompt'] },
          question_text: { type: 'string' },
          options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text:      { type: 'string'  },
                isCorrect: { type: 'boolean' },
              },
              required: ['text', 'isCorrect'],
            },
          },
          explanation: { type: 'string' },
          points: { type: 'number' },
          needsImage: { type: 'boolean' },
          imagePrompt: { type: 'string' },
        },
        required: ['skill', 'type', 'question_text', 'points'],
      },
    },
  },
  required: ['questions'],
}

// Map level → cấp độ đơn giản cho trẻ em VN
const examFormatFor = (level: string): { exam: string; ageRange: string; guidelines: string } => {
  const lvl = level.toUpperCase()

  // Mầm non / Pre-A1 / Starters
  if (lvl === 'STARTER' || lvl === 'STARTERS' || lvl === 'PRE-A1' || lvl === 'MẦM NON') {
    return {
      exam: 'Tiếng Anh Mầm Non',
      ageRange: '3-5 tuổi (mầm non)',
      guidelines: `
- Câu hỏi CỰC KỲ đơn giản, ngắn 3-7 từ, có nhiều ảnh minh họa.
- Topics: màu sắc (red, blue, yellow, green), con vật (cat, dog, bird, fish), đồ ăn (apple, banana, milk), gia đình (mum, dad, baby), số đếm (1-10), bộ phận cơ thể (eye, nose, mouth).
- Câu hỏi mẫu: "What color is this?", "What's this?", "Is it a cat?", "How many apples?"
- Từ vựng: chỉ dùng ~150 từ cơ bản nhất, đơn âm tiết ưu tiên.
- Grammar: CHỈ dùng "This is a...", "It is...", "I have...", "I like...", Yes/No questions.
- TUYỆT ĐỐI KHÔNG dùng: past tense, plural irregular, modal verbs.`,
    }
  }

  // Tiểu học lớp 1-2 / A1 / Movers
  if (lvl === 'MOVER' || lvl === 'MOVERS' || lvl === 'A1' || lvl === 'LEVEL 1' || lvl === 'LEVEL 2') {
    return {
      exam: 'Tiếng Anh Tiểu Học (Lớp 1-2)',
      ageRange: '6-8 tuổi',
      guidelines: `
- Câu hỏi đơn giản, vui tươi, nhiều picture-based.
- Topics: trường học (pencil, book, teacher), hoạt động (run, jump, play), quần áo (shirt, hat), thời tiết (sunny, rainy), nhà cửa (room, bed, chair).
- Câu hỏi: short reading 1-2 câu, MCQ với 3 đáp án, true/false với picture, đơn giản fill blank.
- Từ vựng: ~400 từ thông dụng cho trẻ.
- Grammar: present simple ("I play"), present continuous ("She is running"), can/can't, have/has, like + ing.
- TRÁNH: past tense phức tạp, conditional, passive voice.`,
    }
  }

  // Tiểu học lớp 3-5 / A2 / Flyers
  if (lvl === 'FLYER' || lvl === 'FLYERS' || lvl === 'A2' || lvl === 'LEVEL 3' || lvl === 'LEVEL 4' || lvl === 'LEVEL 5') {
    return {
      exam: 'Tiếng Anh Tiểu Học (Lớp 3-5)',
      ageRange: '8-11 tuổi',
      guidelines: `
- Câu hỏi vui, đa dạng, có cả đoạn văn ngắn.
- Topics: hobbies (drawing, reading, swimming), du lịch (beach, mountain, zoo), sức khỏe (doctor, healthy), kỹ thuật cơ bản (computer, phone), cảm xúc (happy, sad, excited).
- Câu hỏi: short reading 30-60 từ + MCQ, picture sequencing, complete dialog, story-based questions.
- Từ vựng: ~800 từ.
- Grammar: present simple/continuous, past simple (regular + common irregular: went, saw, had, did, ate), going to, comparative (-er, more), some/any.
- TRÁNH: present perfect, conditionals phức tạp, passive voice, modal trừ can/must.`,
    }
  }

  // Trung học cơ sở / B1
  if (lvl === 'B1' || lvl === 'LEVEL 6' || lvl === 'LEVEL 7' || lvl === 'LEVEL 8') {
    return {
      exam: 'Tiếng Anh Trung Học Cơ Sở',
      ageRange: '11-15 tuổi',
      guidelines: `
- Câu hỏi đầy đủ kỹ năng, đoạn văn dài hơn.
- Topics: học đường, môi trường, sở thích, công nghệ phù hợp tuổi teen, tình bạn, gia đình mở rộng.
- Reading: 80-150 từ. Listening: 2-3 nhân vật.
- Grammar: tất cả các thì cơ bản, present perfect intro, conditional 0/1, passive voice cơ bản.`,
    }
  }

  return {
    exam: 'Tiếng Anh ' + lvl,
    ageRange: 'phù hợp tuổi học sinh',
    guidelines: 'Phù hợp lứa tuổi học sinh tiểu học. Đơn giản, dễ hiểu, có ảnh minh họa khi cần.',
  }
}

const buildPrompt = (opts: {
  topic: string
  skill: QuestionSkill | 'all'
  level: string
  count: number
  type?: string
  vocabularyWords?: string[]
}): string => {
  const { topic, skill, level, count, type = 'all', vocabularyWords } = opts
  const format = examFormatFor(level)

  const skillInstr = skill === 'all'
    ? 'Mix các kỹ năng: reading, listening, speaking, writing, general (vocabulary/grammar).'
    : `Tất cả câu hỏi thuộc kỹ năng: ${skill}.`

  const typeInstr = type === 'all'
    ? 'Mix các loại câu hỏi: mcq (trắc nghiệm), true_false (đúng/sai), fill_blank (điền từ vào chỗ trống), short_answer (trả lời ngắn), essay (tự luận viết đoạn văn), speaking_prompt (nói).'
    : `Tất cả câu hỏi PHẢI thuộc loại câu hỏi: ${type}.`

  const topicInstr = topic.trim()
    ? `Chủ đề: "${topic.trim()}". Tất cả câu hỏi xoay quanh chủ đề này.`
    : 'Chủ đề tự do, phù hợp lứa tuổi học sinh.'

  const vocabInstr = vocabularyWords && vocabularyWords.length > 0
    ? `\n**Từ vựng bắt buộc sử dụng trong câu hỏi/đáp án**: ${vocabularyWords.slice(0, 10).join(', ')}. Hãy lồng ghép các từ vựng này vào câu hỏi hoặc đáp án một cách tự nhiên nhất.`
    : ''

  return `
Bạn là cô giáo dạy tiếng Anh cho trẻ em tại trung tâm ESL Việt Nam. Bạn soạn đề kiểm tra cho **${format.exam}** — học sinh **${format.ageRange}**.

Hãy tạo ${count} câu hỏi tiếng Anh:

**Đặc điểm độ tuổi/level:**${format.guidelines}

**Kỹ năng:** ${skillInstr}
**Loại câu hỏi:** ${typeInstr}
**Chủ đề:** ${topicInstr}${vocabInstr}

**Quy tắc:**
1. Câu hỏi ĐƠN GIẢN, vui, phù hợp tuổi học sinh. KHÔNG dùng từ/cấu trúc cao hơn level.
2. Mỗi câu hỏi MCQ (trắc nghiệm) bắt buộc phải có đúng 4 options, trong đó có duy nhất 1 đáp án đúng (isCorrect: true).
3. Mỗi câu hỏi True/False (true_false) bắt buộc phải có đúng 2 options: "True" và "False" (hoặc "Đúng" và "Sai") và đánh dấu đúng/sai tương ứng.
4. Câu hỏi bằng tiếng Anh.
5. Điểm: MCQ/True-False = 1-2 điểm, speaking/essay = 5-15 điểm.
6. Reading: passage ngắn + câu hỏi (format: "Read: '...' Question: <câu hỏi>").
7. Listening: nội dung audio trong \`explanation\`, câu hỏi ngắn ở \`question_text\`.
8. Mỗi câu KHÁC NHAU rõ rệt — không trùng nội dung, từ vựng, cấu trúc.

**ẢNH MINH HỌA — CHỈ KHI THẬT SỰ CẦN:**
10. **MẶC ĐỊNH \`needsImage = false\`.** Đa số câu hỏi KHÔNG cần ảnh.
11. CHỈ đặt \`needsImage = true\` khi câu hỏi BUỘC phải có ảnh để hiểu được, ví dụ:
    - "Look at the picture. What is this?" — phải có ảnh thì học sinh mới trả lời được
    - "Look at the picture and describe…" — speaking prompt yêu cầu mô tả tranh
    - "Match the picture with the word" — yêu cầu match hình với từ
    - Câu hỏi mà đáp án PHỤ THUỘC vào ảnh (không có ảnh thì không trả lời được)
12. KHÔNG thêm ảnh cho:
    - Câu vocabulary thuần (opposites, synonyms, plural, past tense, gap-fill grammar)
    - Reading comprehension (passage đã chứa đủ thông tin)
    - Listening (đã có audio)
    - Speaking/Essay về chủ đề trừu tượng
    - True/False kiểu "A cat is an animal." — không cần ảnh vì học sinh đã hiểu bằng từ ngữ
    - Bất kỳ câu nào KHÔNG bắt buộc phải có ảnh
13. Khi \`needsImage = true\`, tạo \`imagePrompt\` (15-30 từ tiếng Anh) mô tả CHÍNH XÁC ảnh cần:
    - Format: "{main subject in detail}, {action/setting if any}, cartoon illustration for children, colorful, friendly, clean white background"
    - Ví dụ "Look at the picture. What is this animal?" + đáp án "cat":
      → "a cute orange cat sitting and smiling, cartoon illustration for children, colorful, clean white background"
14. **Tỉ lệ đề xuất:** Trong 10 câu, chỉ khoảng 2-4 câu cần ảnh, còn lại không.

Trả về JSON đúng schema.
`.trim()
}

export const generateQuestionsWithAi = async (opts: {
  topic: string
  skill: QuestionSkill | 'all'
  level: string
  count: number
  type?: string
  skillPoints?: Record<QuestionSkill, number>
  vocabularyWords?: string[]
}): Promise<GeneratedQuestion[]> => {
  const prompt = buildPrompt(opts)
  const result = await aiJson<{ questions: GeminiQuestion[] }>(
    prompt,
    QUESTION_SCHEMA,
    { temperature: 1.0 }
  )

  console.log('[AI Questions] Generated:', result.questions.map(q => ({
    text: q.question_text.slice(0, 50),
    needsImage: q.needsImage,
    imagePrompt: q.imagePrompt,
  })))

  return result.questions.map(q => {
    // Chỉ generate ảnh khi AI explicit yêu cầu needsImage=true VÀ có imagePrompt
    const shouldHaveImage = q.needsImage === true && !!q.imagePrompt
    const imagePrompt = shouldHaveImage
      ? buildImagePrompt(q.question_text, q.imagePrompt!)
      : null
    return {
      skill: q.skill as QuestionSkill,
      type: q.type as any,
      question_text: q.question_text,
      options: q.options,
      explanation: q.explanation,
      points: opts.skillPoints?.[q.skill as QuestionSkill] ?? q.points,
      hasImageSuggestion: shouldHaveImage,
      imageSuggestion: q.imagePrompt,
      image_url: imagePrompt
        ? generateImageUrl(imagePrompt, { seed: stableSeed(q.question_text + (q.imagePrompt ?? '')) })
        : undefined,
    }
  })
}

const SINGLE_QUESTION_SCHEMA = {
  type: 'object',
  properties: {
    skill: { type: 'string', enum: ['reading', 'listening', 'speaking', 'writing', 'general'] },
    type:  { type: 'string', enum: ['mcq', 'true_false', 'fill_blank', 'short_answer', 'essay', 'speaking_prompt'] },
    question_text: { type: 'string' },
    options: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text:      { type: 'string'  },
          isCorrect: { type: 'boolean' },
        },
        required: ['text', 'isCorrect'],
      },
    },
    explanation: { type: 'string' },
    points: { type: 'number' },
    needsImage: { type: 'boolean' },
    imagePrompt: { type: 'string' },
  },
  required: ['skill', 'type', 'question_text', 'points'],
}

export const generateSingleQuestionWithAi = async (opts: {
  skill: QuestionSkill
  type: QuestionType
  level: string
  topic?: string
}): Promise<GeneratedQuestion> => {
  const format = examFormatFor(opts.level)
  const topicInstr = opts.topic?.trim()
    ? `Chủ đề: "${opts.topic.trim()}". Câu hỏi phải xoay quanh chủ đề này.`
    : 'Chủ đề tự do, phù hợp lứa tuổi học sinh.'

  const prompt = `
Bạn là cô giáo dạy tiếng Anh cho trẻ em tại trung tâm ESL Việt Nam. Bạn soạn đề kiểm tra cho **${format.exam}** — học sinh **${format.ageRange}**.

Hãy tạo đúng 1 câu hỏi tiếng Anh với yêu cầu sau:
- Kỹ năng: ${opts.skill}
- Loại câu hỏi: ${opts.type} (mcq - trắc nghiệm, true_false - đúng/sai, fill_blank - điền từ vào chỗ trống, short_answer - trả lời ngắn, essay - tự luận viết đoạn văn, speaking_prompt - gợi ý nói).
- **Chủ đề**: ${topicInstr}

**Đặc điểm độ tuổi/level:**${format.guidelines}

**Quy tắc bắt buộc cho loại câu hỏi "${opts.type}":**
1. Nếu loại câu hỏi là "mcq" (Trắc nghiệm): Phải cung cấp đúng 4 đáp án (options), trong đó chỉ có duy nhất 1 đáp án có "isCorrect": true, các đáp án còn lại có "isCorrect": false.
2. Nếu loại câu hỏi là "true_false" (Đúng/Sai): Phải cung cấp đúng 2 đáp án (options) là "True" và "False" và đánh dấu đúng/sai tương ứng.
3. Nếu loại câu hỏi là "fill_blank", "short_answer", "essay" hoặc "speaking_prompt": Trường "options" phải để trống hoặc là mảng rỗng (không cần tạo đáp án lựa chọn).
4. Nội dung câu hỏi phải hoàn toàn ngẫu nhiên và tự nhiên, không được trùng lặp với các ví dụ mẫu.
5. Điểm số: mcq/true_false = 1-2 điểm, speaking/essay = 5-10 điểm, short_answer/fill_blank = 1-3 điểm.
6. Reading: passage ngắn + câu hỏi.
7. Listening: nội dung hội thoại/audio ghi ở 'explanation', câu hỏi ghi ở 'question_text'.

Trả về JSON khớp đúng schema.
`

  const result = await aiJson<GeminiQuestion>(
    prompt,
    SINGLE_QUESTION_SCHEMA,
    { temperature: 1.0 }
  )

  const shouldHaveImage = result.needsImage === true && !!result.imagePrompt
  const imagePrompt = shouldHaveImage
    ? buildImagePrompt(result.question_text, result.imagePrompt!)
    : null

  return {
    skill: result.skill as QuestionSkill,
    type: result.type as any,
    question_text: result.question_text,
    options: result.options,
    explanation: result.explanation,
    points: result.points,
    hasImageSuggestion: shouldHaveImage,
    imageSuggestion: result.imagePrompt,
    image_url: imagePrompt
      ? generateImageUrl(imagePrompt, { seed: stableSeed(result.question_text + (result.imagePrompt ?? '')) })
      : undefined,
  }
}
