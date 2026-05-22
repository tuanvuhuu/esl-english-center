import type { DbVocabularyEntry } from '../../types/database'
import type { GeneratedQuestion } from './questionGenerator'

// Helper to shuffle an array
function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Helper to scramble letters of a word
function scrambleWord(word: string): string {
  const letters = word.split('')
  let scrambled = shuffle(letters).join('-')
  // Try to avoid generating the original word
  let attempts = 0
  while (scrambled.replace(/-/g, '') === word && attempts < 10) {
    scrambled = shuffle(letters).join('-')
    attempts++
  }
  return scrambled
}

export function generateQuestionsFromVocab(
  selectedWords: DbVocabularyEntry[],
  allWords: DbVocabularyEntry[],
  count: number,
  typeFilter: 'all' | 'mcq' | 'true_false' | 'fill_blank' | 'spelling',
  skillPoints: Record<string, number>
): GeneratedQuestion[] {
  if (selectedWords.length === 0) return []

  const questions: GeneratedQuestion[] = []
  
  // If we don't have enough selected words, duplicate them to meet the count
  let wordsToUse = [...selectedWords]
  while (wordsToUse.length < count) {
    wordsToUse = [...wordsToUse, ...shuffle(selectedWords)]
  }
  // Trim to exact count and shuffle
  wordsToUse = shuffle(wordsToUse).slice(0, count)

  wordsToUse.forEach((word) => {
    // Determine which question types are allowed
    const allowedTypes: ('mcq' | 'true_false' | 'fill_blank' | 'spelling')[] = []
    if (typeFilter === 'all') {
      allowedTypes.push('mcq', 'true_false')
      if (word.example_sentence) allowedTypes.push('fill_blank')
      if (word.word.length > 3) allowedTypes.push('spelling')
    } else {
      if (typeFilter === 'fill_blank' && !word.example_sentence) {
        allowedTypes.push('mcq') // fallback
      } else {
        allowedTypes.push(typeFilter)
      }
    }

    const chosenType = allowedTypes[Math.floor(Math.random() * allowedTypes.length)]
    
    // Fallback if allWords is too small to find distractors
    const pool = allWords.length >= 5 ? allWords : [
      word, 
      { id: '1', word: 'apple', meaning_vi: 'táo', meaning_en: 'a round red fruit', cefr_level: 'A1' } as any,
      { id: '2', word: 'school', meaning_vi: 'trường học', meaning_en: 'place of education', cefr_level: 'A1' } as any,
      { id: '3', word: 'study', meaning_vi: 'học', meaning_en: 'gain knowledge', cefr_level: 'A1' } as any,
      { id: '4', word: 'happy', meaning_vi: 'vui vẻ', meaning_en: 'feeling pleasure', cefr_level: 'A1' } as any,
    ]

    const otherWords = pool.filter((w) => w.word.toLowerCase() !== word.word.toLowerCase())

    if (chosenType === 'mcq') {
      // 50% English definition MCQ, 50% Vietnamese meaning MCQ
      const isEnglish = Math.random() > 0.5 && !!word.meaning_en

      if (isEnglish && word.meaning_en) {
        const correctText = word.meaning_en
        const distractors = shuffle(otherWords)
          .map((w) => w.meaning_en || w.meaning_vi || '')
          .filter((t) => t && t !== correctText)
          .slice(0, 3)

        const options = shuffle([
          { text: correctText, isCorrect: true },
          ...distractors.map((text) => ({ text, isCorrect: false })),
        ])

        questions.push({
          skill: 'reading',
          type: 'mcq',
          question_text: `What is the correct definition of the word "${word.word}" (${word.part_of_speech || ''})?`,
          options,
          explanation: `"${word.word}" means: ${word.meaning_vi} (${word.meaning_en}).`,
          points: skillPoints.reading || 1,
        })
      } else {
        const correctText = word.meaning_vi || word.meaning_en || ''
        const distractors = shuffle(otherWords)
          .map((w) => w.meaning_vi || w.meaning_en || '')
          .filter((t) => t && t !== correctText)
          .slice(0, 3)

        const options = shuffle([
          { text: correctText, isCorrect: true },
          ...distractors.map((text) => ({ text, isCorrect: false })),
        ])

        questions.push({
          skill: 'reading',
          type: 'mcq',
          question_text: `Từ "${word.word}" (${word.part_of_speech || ''}) trong tiếng Việt có nghĩa là gì?`,
          options,
          explanation: `"${word.word}" có nghĩa là: ${word.meaning_vi || word.meaning_en}.`,
          points: skillPoints.reading || 1,
        })
      }
    } 
    
    else if (chosenType === 'fill_blank') {
      const sentence = word.example_sentence || ''
      const wordRegex = new RegExp(`\\b${word.word}\\b`, 'gi')
      const blankedSentence = sentence.replace(wordRegex, '______')
      
      const correctText = word.word
      const distractors = shuffle(otherWords)
        .map((w) => w.word)
        .filter((w) => w.toLowerCase() !== correctText.toLowerCase())
        .slice(0, 3)

      const options = shuffle([
        { text: correctText, isCorrect: true },
        ...distractors.map((text) => ({ text, isCorrect: false })),
      ])

      questions.push({
        skill: 'writing',
        type: 'mcq', // MCQ for auto-grading
        question_text: `Choose the correct word to complete the sentence:\n"${blankedSentence}"\n(Hint: ${word.meaning_vi || word.meaning_en})`,
        options,
        explanation: `Example: "${sentence}" (${word.example_vi || ''})`,
        points: skillPoints.writing || 1,
      })
    } 
    
    else if (chosenType === 'true_false') {
      const isTrue = Math.random() > 0.5
      let definitionText = ''
      let explanation = ''

      if (isTrue) {
        definitionText = word.meaning_vi || word.meaning_en || ''
        explanation = `Correct! "${word.word}" means "${definitionText}".`
      } else {
        const wrongWord = otherWords[Math.floor(Math.random() * otherWords.length)]
        definitionText = wrongWord.meaning_vi || wrongWord.meaning_en || ''
        explanation = `Incorrect. "${word.word}" actually means "${word.meaning_vi || word.meaning_en}", not "${definitionText}".`
      }

      const options = [
        { text: 'True', isCorrect: isTrue },
        { text: 'False', isCorrect: !isTrue },
      ]

      questions.push({
        skill: 'general',
        type: 'true_false',
        question_text: `True or False: The word "${word.word}" means "${definitionText}".`,
        options,
        explanation,
        points: skillPoints.general || 1,
      })
    } 
    
    else if (chosenType === 'spelling') {
      const scrambled = scrambleWord(word.word)
      const correctText = word.word
      
      // Make spelling distractors by making small typos or other words
      const distractors = [
        correctText.replace(/a/g, 'e').replace(/o/g, 'u'), // simple vowels swap
        shuffle(correctText.split('')).join(''), // another scramble
        otherWords[0]?.word || 'wrongword'
      ].filter((w) => w.toLowerCase() !== correctText.toLowerCase()).slice(0, 3)

      const options = shuffle([
        { text: correctText, isCorrect: true },
        ...distractors.map((text) => ({ text, isCorrect: false })),
      ])

      questions.push({
        skill: 'writing',
        type: 'mcq', // MCQ for auto-grading
        question_text: `Rearrange the letters "${scrambled}" to spell the correct word meaning "${word.meaning_vi || word.meaning_en}":`,
        options,
        explanation: `The correct word is "${word.word}".`,
        points: skillPoints.writing || 1,
      })
    }
  })

  return questions
}
