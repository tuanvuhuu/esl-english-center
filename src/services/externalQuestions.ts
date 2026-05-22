import type { GeneratedQuestion } from '../pages/Tests/questionGenerator'
import type { QuestionSkill } from '../types/database'

interface TriviaRawQuestion {
  category: string
  type: string
  difficulty: string
  question: string
  correct_answer: string
  incorrect_answers: string[]
}

function decodeHtml(html: string): string {
  const txt = document.createElement('textarea')
  txt.innerHTML = html
  return txt.value
}

export async function fetchTriviaQuestions(options: {
  count: number
  difficulty?: 'easy' | 'medium' | 'hard' | 'all'
  skillPoints: Record<string, number>
}): Promise<GeneratedQuestion[]> {
  const amount = options.count || 5
  const diff = options.difficulty && options.difficulty !== 'all' ? options.difficulty : ''
  const diffParam = diff ? `&difficulty=${diff}` : ''
  // Category 9 is General Knowledge
  const url = `https://opentdb.com/api.php?amount=${amount}&category=9${diffParam}&type=multiple`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Không thể kết nối với dịch vụ Open Trivia DB.')
  }
  const data = await res.json()
  if (data.response_code !== 0) {
    throw new Error('Dịch vụ Open Trivia DB không trả về kết quả hợp lệ.')
  }

  const results: TriviaRawQuestion[] = data.results
  return results.map((t) => {
    const correctText = decodeHtml(t.correct_answer)
    const optionsList = [
      { text: correctText, isCorrect: true },
      ...t.incorrect_answers.map((ans) => ({
        text: decodeHtml(ans),
        isCorrect: false,
      })),
    ]

    // Shuffle options list
    for (let i = optionsList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [optionsList[i], optionsList[j]] = [optionsList[j], optionsList[i]]
    }

    return {
      skill: 'general' as QuestionSkill,
      type: 'mcq' as any,
      question_text: decodeHtml(t.question),
      options: optionsList,
      explanation: `Đáp án đúng: ${correctText}. (Chủ đề: ${t.category})`,
      points: options.skillPoints?.general || (t.difficulty === 'easy' ? 1 : t.difficulty === 'medium' ? 2 : 3),
    }
  })
}
