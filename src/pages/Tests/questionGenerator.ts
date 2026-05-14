import { QuestionSkill, QuestionType } from '../../types/database'
import { generateImageUrl, stableSeed, buildImagePrompt } from '../../lib/imageGen'

export interface GeneratedQuestion {
  skill: QuestionSkill
  type: QuestionType
  question_text: string
  options?: { text: string; isCorrect: boolean }[]
  explanation?: string
  points: number
  hasImageSuggestion?: boolean
  imageSuggestion?: string
  image_url?: string
}

// ── Word pools ──────────────────────────────────────────────────
const POOLS = {
  animals:    ['cat', 'dog', 'bird', 'fish', 'rabbit', 'horse', 'cow', 'pig', 'duck', 'sheep', 'mouse', 'elephant', 'tiger', 'lion', 'monkey', 'bear', 'frog'],
  colors:     ['red', 'blue', 'yellow', 'green', 'orange', 'pink', 'purple', 'black', 'white', 'brown', 'gray'],
  fruits:     ['apple', 'banana', 'orange', 'grape', 'mango', 'pineapple', 'strawberry', 'watermelon', 'lemon', 'peach', 'pear', 'kiwi'],
  food:       ['rice', 'bread', 'milk', 'cheese', 'egg', 'chicken', 'fish', 'soup', 'pizza', 'noodles', 'sandwich', 'cake'],
  family:     ['mother', 'father', 'sister', 'brother', 'grandmother', 'grandfather', 'aunt', 'uncle', 'cousin', 'baby'],
  school:     ['pen', 'pencil', 'book', 'ruler', 'eraser', 'bag', 'desk', 'chair', 'board', 'notebook', 'scissors'],
  weather:    ['sunny', 'rainy', 'cloudy', 'windy', 'snowy', 'hot', 'cold', 'warm', 'cool'],
  body:       ['head', 'eye', 'nose', 'mouth', 'ear', 'hair', 'hand', 'foot', 'arm', 'leg', 'finger'],
  clothes:    ['shirt', 'T-shirt', 'jacket', 'jeans', 'dress', 'skirt', 'hat', 'shoes', 'socks', 'gloves', 'scarf'],
  numbers:    ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'twenty'],
  rooms:      ['kitchen', 'bedroom', 'bathroom', 'living room', 'garden', 'garage'],
  jobs:       ['teacher', 'doctor', 'nurse', 'farmer', 'cook', 'driver', 'singer', 'student'],
  transport:  ['car', 'bus', 'bike', 'plane', 'train', 'boat', 'motorbike', 'taxi'],
  verbsA1:    ['run', 'jump', 'swim', 'eat', 'drink', 'read', 'write', 'sing', 'dance', 'play', 'sleep', 'walk', 'cook', 'draw'],
}

const OPPOSITES = [
  ['hot', 'cold'], ['big', 'small'], ['fast', 'slow'], ['happy', 'sad'],
  ['tall', 'short'], ['old', 'young'], ['new', 'old'], ['easy', 'hard'],
  ['clean', 'dirty'], ['full', 'empty'], ['heavy', 'light'], ['rich', 'poor'],
  ['open', 'closed'], ['up', 'down'], ['in', 'out'], ['day', 'night'],
  ['black', 'white'], ['good', 'bad'], ['high', 'low'], ['long', 'short'],
  ['quiet', 'loud'], ['wet', 'dry'], ['hard', 'soft'], ['strong', 'weak'],
]

const PLURALS_IRR = [
  ['child', 'children'], ['man', 'men'], ['woman', 'women'],
  ['foot', 'feet'], ['tooth', 'teeth'], ['mouse', 'mice'],
  ['person', 'people'], ['fish', 'fish'], ['sheep', 'sheep'],
]

const SUBJECT_PRONOUN = [
  { subj: 'I',    verb: 'am'  },
  { subj: 'He',   verb: 'is'  },
  { subj: 'She',  verb: 'is'  },
  { subj: 'It',   verb: 'is'  },
  { subj: 'We',   verb: 'are' },
  { subj: 'They', verb: 'are' },
  { subj: 'You',  verb: 'are' },
]

// ── Helpers ─────────────────────────────────────────────────────
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const pickN = <T>(arr: T[], n: number, exclude: T[] = []): T[] => {
  const pool = arr.filter(x => !exclude.includes(x))
  const shuffled = [...pool].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, n)
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const article = (w: string) => /^[aeiou]/i.test(w) ? `an ${w}` : `a ${w}`

// ── Pattern generators ──────────────────────────────────────────
type Generator = () => GeneratedQuestion

const A1_GENS: Record<QuestionSkill, Generator[]> = {
  general: [
    // Opposites
    () => {
      const [a, b] = pick(OPPOSITES)
      const distractors = pickN(OPPOSITES.flat().filter(w => w !== a && w !== b), 3)
      const opts = [{ text: cap(b), isCorrect: true }, ...distractors.map(d => ({ text: cap(d), isCorrect: false }))]
        .sort(() => 0.5 - Math.random())
      return {
        skill: 'general', type: 'mcq', points: 1,
        question_text: `What is the opposite of "${a}"?`,
        options: opts,
      }
    },
    // Word categorization
    () => {
      const cats: { name: string; words: string[]; label: string }[] = [
        { name: 'animals',  words: POOLS.animals, label: 'an animal' },
        { name: 'fruits',   words: POOLS.fruits,  label: 'a fruit' },
        { name: 'colors',   words: POOLS.colors,  label: 'a color' },
        { name: 'clothes',  words: POOLS.clothes, label: 'clothes' },
      ]
      const cat = pick(cats)
      const correct = pick(cat.words)
      const others = cats.filter(c => c.name !== cat.name)
      const distractors = others.map(c => pick(c.words)).slice(0, 3)
      const opts = [{ text: cap(correct), isCorrect: true }, ...distractors.map(d => ({ text: cap(d), isCorrect: false }))]
        .sort(() => 0.5 - Math.random())
      return {
        skill: 'general', type: 'mcq', points: 1,
        question_text: `Which one is ${cat.label}?`,
        options: opts,
      }
    },
    // Plural
    () => {
      const [sing, plur] = pick(PLURALS_IRR)
      const distractors = pickN(['mans', 'childs', 'foots', 'mouses', 'tooths', 'persons'].filter(d => d !== `${sing}s`), 3)
      const opts = [{ text: plur, isCorrect: true }, ...distractors.map(d => ({ text: d, isCorrect: false }))]
        .sort(() => 0.5 - Math.random())
      return {
        skill: 'general', type: 'mcq', points: 1,
        question_text: `What is the plural form of "${sing}"?`,
        options: opts,
      }
    },
    // Be verb
    () => {
      const { subj, verb } = pick(SUBJECT_PRONOUN)
      const wrongs = ['am', 'is', 'are'].filter(v => v !== verb)
      const opts = [{ text: verb, isCorrect: true }, ...wrongs.map(w => ({ text: w, isCorrect: false }))]
        .sort(() => 0.5 - Math.random())
      return {
        skill: 'general', type: 'mcq', points: 1,
        question_text: `${subj} ___ happy today.`,
        options: opts,
      }
    },
    // True/false animal facts
    () => {
      const facts = [
        { text: 'A cat is an animal.',     correct: true  },
        { text: 'Apples are vegetables.',  correct: false },
        { text: 'The sun is hot.',         correct: true  },
        { text: 'Fish can fly.',           correct: false },
        { text: 'Birds have wings.',       correct: true  },
        { text: 'Dogs have feathers.',     correct: false },
        { text: 'Ice is cold.',            correct: true  },
        { text: 'A snake has legs.',       correct: false },
        { text: 'We use eyes to see.',     correct: true  },
        { text: 'A car can swim.',         correct: false },
      ]
      const f = pick(facts)
      return {
        skill: 'general', type: 'true_false', points: 1,
        question_text: f.text,
        options: [
          { text: 'True',  isCorrect: f.correct === true },
          { text: 'False', isCorrect: f.correct === false },
        ],
      }
    },
    // Color question
    () => {
      const items = [
        { item: 'banana',     color: 'yellow' },
        { item: 'tomato',     color: 'red'    },
        { item: 'grass',      color: 'green'  },
        { item: 'sky',        color: 'blue'   },
        { item: 'snow',       color: 'white'  },
        { item: 'orange',     color: 'orange' },
        { item: 'chocolate',  color: 'brown'  },
      ]
      const item = pick(items)
      const distractors = pickN(POOLS.colors.filter(c => c !== item.color), 3)
      const opts = [{ text: cap(item.color), isCorrect: true }, ...distractors.map(d => ({ text: cap(d), isCorrect: false }))]
        .sort(() => 0.5 - Math.random())
      return {
        skill: 'general', type: 'mcq', points: 1,
        question_text: `What color is ${article(item.item)}?`,
        options: opts,
      }
    },
  ],
  reading: [
    () => {
      const signs = [
        { sign: 'No Smoking',         meaning: 'You cannot smoke here.' },
        { sign: 'Push',               meaning: 'Push the door to open.' },
        { sign: 'Pull',               meaning: 'Pull the door to open.' },
        { sign: 'No Entry',           meaning: 'Do not go in.' },
        { sign: 'Exit',               meaning: 'Go out this way.' },
        { sign: 'Toilet',             meaning: 'The bathroom is here.' },
        { sign: 'For Sale',           meaning: 'You can buy this.' },
        { sign: 'Open',               meaning: 'The shop is open now.' },
        { sign: 'Closed',             meaning: 'The shop is not open.' },
      ]
      const s = pick(signs)
      const distractors = pickN(signs.filter(x => x.meaning !== s.meaning).map(x => x.meaning), 3)
      const opts = [{ text: s.meaning, isCorrect: true }, ...distractors.map(d => ({ text: d, isCorrect: false }))]
        .sort(() => 0.5 - Math.random())
      return {
        skill: 'reading', type: 'mcq', points: 1,
        question_text: `Read the sign: "${s.sign}". What does it mean?`,
        options: opts,
      }
    },
    () => {
      const stories = [
        { story: 'Tom has a red ball. He plays with his dog.',                   q: 'What color is the ball?',     ans: 'Red',     distract: ['Blue', 'Green', 'Yellow'] },
        { story: 'Mary likes apples and milk for breakfast.',                    q: 'What does Mary like?',         ans: 'Apples and milk', distract: ['Bread and eggs', 'Tea and cake', 'Chicken and rice'] },
        { story: 'It is cold today. Sam wears his jacket.',                      q: 'What does Sam wear?',          ans: 'A jacket', distract: ['A T-shirt', 'A hat', 'Shorts'] },
        { story: 'Lisa has two cats. They are black and white.',                 q: 'How many cats does Lisa have?', ans: 'Two',     distract: ['One', 'Three', 'Four'] },
        { story: "Ben's brother is a teacher. He works at a big school.",        q: "What is Ben's brother's job?", ans: 'Teacher',  distract: ['Doctor', 'Farmer', 'Driver'] },
      ]
      const s = pick(stories)
      const opts = [{ text: s.ans, isCorrect: true }, ...s.distract.map(d => ({ text: d, isCorrect: false }))]
        .sort(() => 0.5 - Math.random())
      return {
        skill: 'reading', type: 'mcq', points: 2,
        question_text: `Read: "${s.story}"  ${s.q}`,
        options: opts,
      }
    },
  ],
  listening: [
    () => {
      const dialogs = [
        { text: "Excuse me, what time does the train leave?\n— It leaves at 8:30.",            q: 'What time does the train leave?', ans: '8:30',     distract: ['7:30', '9:00', '8:00'] },
        { text: 'Hi, my name is Anna. I am 8 years old.',                                       q: 'How old is Anna?',                 ans: '8',        distract: ['6', '10', '12'] },
        { text: "It's cold today, isn't it?\n— Yes, very cold!",                                q: 'How is the weather?',              ans: 'Cold',     distract: ['Hot', 'Sunny', 'Rainy'] },
        { text: "Where do you live, Tom?\n— I live in London.",                                 q: 'Where does Tom live?',             ans: 'London',   distract: ['Paris', 'Tokyo', 'Hanoi'] },
        { text: "Mum, can I have an apple?\n— Yes, of course.",                                 q: 'What does the child want?',        ans: 'An apple', distract: ['A banana', 'A cookie', 'Milk'] },
      ]
      const d = pick(dialogs)
      const opts = [{ text: d.ans, isCorrect: true }, ...d.distract.map(x => ({ text: x, isCorrect: false }))]
        .sort(() => 0.5 - Math.random())
      return {
        skill: 'listening', type: 'mcq', points: 1,
        question_text: `Listen to the dialogue. ${d.q}`,
        explanation: `Dialogue: ${d.text}`,
        options: opts,
      }
    },
  ],
  speaking: [
    () => {
      const prompts = [
        'Tell me about your family. How many people are in your family?',
        'What is your favorite food? Why do you like it?',
        'Describe your best friend. What does he/she look like?',
        'What do you do on Sundays?',
        'Tell me about your school. How do you go to school?',
        'What is your favorite animal? Why?',
        'Describe your bedroom.',
        'What sports do you like? Why?',
      ]
      return {
        skill: 'speaking', type: 'speaking_prompt', points: 5,
        question_text: pick(prompts),
      }
    },
    () => {
      const topics = ['a park', 'a kitchen', 'a classroom', 'a zoo', 'a beach', 'a birthday party', 'a family picnic']
      const topic = pick(topics)
      return {
        skill: 'speaking', type: 'speaking_prompt', points: 5,
        question_text: `Look at the picture and describe what you see. Use at least 3 sentences.`,
        hasImageSuggestion: true,
        imageSuggestion: topic,
      }
    },
  ],
  writing: [
    () => {
      const topics = ['your favorite hobby', 'your best friend', 'your family', 'your favorite food', 'your last weekend', 'your school', 'your daily routine', 'your favorite animal']
      return {
        skill: 'writing', type: 'short_answer', points: 5,
        question_text: `Write a short paragraph (30–50 words) about ${pick(topics)}.`,
      }
    },
    () => {
      const verb = pick(POOLS.verbsA1)
      return {
        skill: 'writing', type: 'fill_blank', points: 1,
        question_text: `Complete: "I like to ___ on Sundays." (Hint: use a verb like "${verb}")`,
      }
    },
  ],
}

const A2_B1_GENS: Record<QuestionSkill, Generator[]> = {
  general: [
    // Past tense
    () => {
      const verbs = [
        { base: 'go',   past: 'went'    }, { base: 'eat',  past: 'ate'    },
        { base: 'see',  past: 'saw'     }, { base: 'come', past: 'came'   },
        { base: 'have', past: 'had'     }, { base: 'do',   past: 'did'    },
        { base: 'make', past: 'made'    }, { base: 'take', past: 'took'   },
        { base: 'give', past: 'gave'    }, { base: 'buy',  past: 'bought' },
        { base: 'find', past: 'found'   }, { base: 'know', past: 'knew'   },
      ]
      const v = pick(verbs)
      const distractors = pickN(verbs.filter(x => x.past !== v.past).map(x => x.past), 3)
      const opts = [{ text: v.past, isCorrect: true }, ...distractors.map(d => ({ text: d, isCorrect: false }))]
        .sort(() => 0.5 - Math.random())
      return {
        skill: 'general', type: 'mcq', points: 1,
        question_text: `What is the past tense of "${v.base}"?`,
        options: opts,
      }
    },
    // Comparative
    () => {
      const adjs = [
        { base: 'big',         comp: 'bigger'      },
        { base: 'happy',       comp: 'happier'     },
        { base: 'good',        comp: 'better'      },
        { base: 'bad',         comp: 'worse'       },
        { base: 'beautiful',   comp: 'more beautiful' },
        { base: 'fast',        comp: 'faster'      },
        { base: 'expensive',   comp: 'more expensive' },
      ]
      const a = pick(adjs)
      const distractors = pickN(adjs.filter(x => x.comp !== a.comp).map(x => x.comp), 3)
      const opts = [{ text: a.comp, isCorrect: true }, ...distractors.map(d => ({ text: d, isCorrect: false }))]
        .sort(() => 0.5 - Math.random())
      return {
        skill: 'general', type: 'mcq', points: 1,
        question_text: `What is the comparative of "${a.base}"?`,
        options: opts,
      }
    },
    // Vocabulary - synonyms
    () => {
      const syns = [
        { word: 'big',     synonym: 'large'    },
        { word: 'happy',   synonym: 'glad'     },
        { word: 'fast',    synonym: 'quick'    },
        { word: 'smart',   synonym: 'clever'   },
        { word: 'tired',   synonym: 'sleepy'   },
        { word: 'pretty',  synonym: 'lovely'   },
      ]
      const s = pick(syns)
      const distractors = pickN(['angry', 'sad', 'tall', 'late', 'rich', 'busy'].filter(d => d !== s.synonym), 3)
      const opts = [{ text: s.synonym, isCorrect: true }, ...distractors.map(d => ({ text: d, isCorrect: false }))]
        .sort(() => 0.5 - Math.random())
      return {
        skill: 'general', type: 'mcq', points: 2,
        question_text: `Which word means the same as "${s.word}"?`,
        options: opts,
      }
    },
  ],
  reading: [
    () => {
      const passages = [
        {
          text: 'Last weekend, Mike visited his grandmother in the countryside. They picked apples in the garden and made apple pie together. Mike enjoyed every moment of his visit.',
          q: 'What did Mike and his grandmother make?',
          ans: 'Apple pie', distract: ['Banana cake', 'Orange juice', 'Strawberry jam'],
        },
        {
          text: 'Sarah wakes up at 6 AM every day. She brushes her teeth and has cereal for breakfast. Then she walks to school with her brother.',
          q: 'How does Sarah go to school?',
          ans: 'On foot', distract: ['By bus', 'By car', 'By bike'],
        },
        {
          text: "John's hobby is collecting stamps. He has over 200 stamps from 30 different countries. His favorite stamps are from Japan and Brazil.",
          q: "How many countries are John's stamps from?",
          ans: '30', distract: ['20', '200', '100'],
        },
      ]
      const p = pick(passages)
      const opts = [{ text: p.ans, isCorrect: true }, ...p.distract.map(d => ({ text: d, isCorrect: false }))]
        .sort(() => 0.5 - Math.random())
      return {
        skill: 'reading', type: 'mcq', points: 2,
        question_text: `Read: "${p.text}"\n\n${p.q}`,
        options: opts,
      }
    },
  ],
  listening: [
    () => {
      const dialogs = [
        { text: "I went to the cinema yesterday. I watched a funny movie.",        q: 'Where did he go?',        ans: 'Cinema',  distract: ['Park', 'School', 'Library'] },
        { text: "I bought a new bike. It cost 200 dollars.",                       q: 'How much was the bike?',  ans: '$200',   distract: ['$100', '$300', '$500'] },
        { text: "She is going to visit her uncle in Hanoi next week.",             q: 'Who will she visit?',     ans: 'Her uncle', distract: ['Her aunt', 'Her grandma', 'Her teacher'] },
      ]
      const d = pick(dialogs)
      const opts = [{ text: d.ans, isCorrect: true }, ...d.distract.map(x => ({ text: x, isCorrect: false }))]
        .sort(() => 0.5 - Math.random())
      return {
        skill: 'listening', type: 'mcq', points: 2,
        question_text: `Listen to the audio. ${d.q}`,
        explanation: d.text,
        options: opts,
      }
    },
  ],
  speaking: [
    () => {
      const topics = [
        'Talk about a memorable trip you took. Where did you go and what did you do?',
        'Describe a person you admire and explain why.',
        'Talk about your favorite season and the activities you enjoy in it.',
        'Describe your hometown. What is special about it?',
        'Talk about a hobby you would like to try in the future.',
        'Describe a typical weekend in your family.',
      ]
      return {
        skill: 'speaking', type: 'speaking_prompt', points: 10,
        question_text: pick(topics),
      }
    },
  ],
  writing: [
    () => {
      const topics = [
        'an unforgettable experience you had',
        'a person who has influenced your life',
        'a place you would like to visit',
        'your goals for next year',
        'an event you recently attended',
      ]
      return {
        skill: 'writing', type: 'short_answer', points: 10,
        question_text: `Write a paragraph (80–120 words) about ${pick(topics)}.`,
      }
    },
  ],
}

const B2_GENS: Record<QuestionSkill, Generator[]> = {
  general: [
    () => {
      const idioms = [
        { idiom: 'break the ice',         meaning: 'to start a conversation' },
        { idiom: 'hit the books',         meaning: 'to study hard' },
        { idiom: 'piece of cake',         meaning: 'very easy' },
        { idiom: 'under the weather',     meaning: 'feeling sick' },
        { idiom: 'cost an arm and a leg', meaning: 'very expensive' },
      ]
      const i = pick(idioms)
      const distractors = pickN(idioms.filter(x => x.meaning !== i.meaning).map(x => x.meaning), 3)
      const opts = [{ text: i.meaning, isCorrect: true }, ...distractors.map(d => ({ text: d, isCorrect: false }))]
        .sort(() => 0.5 - Math.random())
      return {
        skill: 'general', type: 'mcq', points: 2,
        question_text: `What does the idiom "${i.idiom}" mean?`,
        options: opts,
      }
    },
  ],
  reading:    A2_B1_GENS.reading,
  listening:  A2_B1_GENS.listening,
  speaking: [
    () => {
      const topics = [
        'Discuss the advantages and disadvantages of online learning compared to traditional classrooms.',
        'Some people think technology has made our lives easier. Others disagree. What is your opinion?',
        'Talk about the importance of learning foreign languages in the modern world.',
        'Should children have homework? Why or why not?',
        'Discuss the impact of social media on young people.',
      ]
      return {
        skill: 'speaking', type: 'speaking_prompt', points: 10,
        question_text: pick(topics),
      }
    },
  ],
  writing: [
    () => {
      const topics = [
        'environmental protection in your country',
        'the role of technology in education',
        'whether children should be allowed to use smartphones',
        'the importance of physical exercise',
        'the influence of social media on society',
      ]
      return {
        skill: 'writing', type: 'essay', points: 15,
        question_text: `Write an essay (150–200 words) expressing your opinion on ${pick(topics)}.`,
      }
    },
  ],
}

// Map level → generator pool
function getGenerators(skill: QuestionSkill, level: string): Generator[] {
  const lvl = level.toUpperCase()
  if (lvl === 'A1' || lvl === 'STARTER' || lvl === 'MOVER') return A1_GENS[skill] ?? []
  if (lvl === 'B2' || lvl === 'C1') return B2_GENS[skill] ?? A2_B1_GENS[skill] ?? []
  return A2_B1_GENS[skill] ?? A1_GENS[skill] ?? []
}

export function generateQuestions(options: {
  topic: string
  skill: QuestionSkill | 'all'
  level: string
  count: number
}): GeneratedQuestion[] {
  const { topic, skill, level, count } = options

  const skills: QuestionSkill[] = skill === 'all'
    ? ['general', 'reading', 'listening', 'speaking', 'writing']
    : [skill]

  // Pool of generator functions
  const gens: Generator[] = []
  skills.forEach(s => gens.push(...getGenerators(s, level)))

  if (gens.length === 0) return []

  // Shuffle generators and run them; if we need more than the pool, re-shuffle and continue (each run produces different output)
  const out: GeneratedQuestion[] = []
  let pool = [...gens].sort(() => 0.5 - Math.random())
  for (let i = 0; i < count; i++) {
    if (pool.length === 0) pool = [...gens].sort(() => 0.5 - Math.random())
    const gen = pool.shift()!
    const q = gen()

    // Apply topic prefix if user provided
    if (topic.trim() && q.skill !== 'speaking' && q.skill !== 'writing') {
      q.question_text = `[${topic.trim()}] ${q.question_text}`
    }

    // Generate ảnh AI từ imageSuggestion (Pollinations.ai)
    if (q.hasImageSuggestion && q.imageSuggestion) {
      const prompt = buildImagePrompt(q.question_text, q.imageSuggestion)
      q.image_url = generateImageUrl(prompt, { seed: stableSeed(q.question_text + q.imageSuggestion) })
    }

    out.push(q)
  }
  return out
}
