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
  // ── New pools ──
  greetings:   ['hello', 'goodbye', 'good morning', 'good night', 'thank you', 'please', 'sorry', 'excuse me', 'nice to meet you', 'see you later', 'how are you', 'welcome'],
  days_months: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  prepositions: ['in', 'on', 'at', 'under', 'behind', 'next to', 'between', 'in front of', 'above', 'below', 'near', 'beside'],
  phrasal_verbs: ['turn on', 'turn off', 'pick up', 'put down', 'look for', 'look after', 'give up', 'get up', 'wake up', 'sit down', 'stand up', 'come in', 'go out', 'take off', 'put on'],
  conditionals: ['If it rains, I will stay home.', 'If I had money, I would travel.', 'If she studies, she will pass.', 'If we leave now, we will arrive on time.', 'If I were you, I would apologize.'],
  passive_voice: ['The cake was made by Mom.', 'English is spoken worldwide.', 'The book was written by Mark Twain.', 'The window was broken.', 'The letter was sent yesterday.'],
  collocations: ['make a mistake', 'do homework', 'take a photo', 'have breakfast', 'pay attention', 'make friends', 'do exercise', 'take a shower', 'have fun', 'make progress', 'do the dishes', 'take a break'],
  time_expressions: ['yesterday', 'tomorrow', 'last week', 'next month', 'every day', 'right now', 'already', 'yet', 'since', 'for', 'ago', 'soon'],
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
        // New passages
        { story: 'Lily wakes up at 6 AM. She brushes her teeth and eats rice for breakfast. Then she walks to school with her sister.',
          q: 'How does Lily go to school?', ans: 'She walks', distract: ['By bus', 'By car', 'By bike'] },
        { story: 'It is Sunday. Dad is in the kitchen. He is making pancakes for the family. Mom is reading a newspaper.',
          q: 'What is Dad doing?', ans: 'Making pancakes', distract: ['Reading', 'Sleeping', 'Working'] },
        { story: 'There are 30 students in my class. 15 are boys and 15 are girls. Our teacher is Miss Hoa. She is very kind.',
          q: 'How many students are in the class?', ans: '30', distract: ['15', '20', '25'] },
        { story: 'My dog Max is brown and big. He likes to run in the park. He eats meat and drinks water every day.',
          q: 'What color is Max?', ans: 'Brown', distract: ['Black', 'White', 'Yellow'] },
        { story: 'In summer, the weather is hot and sunny. Children like to swim and eat ice cream. They do not go to school.',
          q: 'What do children like to do in summer?', ans: 'Swim and eat ice cream', distract: ['Go to school', 'Wear jackets', 'Play in the snow'] },
        { story: 'My grandmother lives in the countryside. She has a big garden with many flowers. She grows tomatoes and carrots.',
          q: 'What does grandmother grow?', ans: 'Tomatoes and carrots', distract: ['Apples and oranges', 'Rice and wheat', 'Flowers only'] },
        { story: 'Today is Lan\'s birthday. She is 10 years old. Her friends give her books and dolls. She is very happy.',
          q: 'How old is Lan?', ans: '10', distract: ['8', '9', '12'] },
        { story: 'The library is on the second floor. It has many books about animals, science, and stories. Students can borrow two books each week.',
          q: 'How many books can students borrow?', ans: 'Two', distract: ['One', 'Three', 'Five'] },
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
        // New A2-B1 passages
        {
          text: 'Last summer, our family went on a holiday to Da Nang. We stayed at a hotel near the beach for five days. Every morning, we swam in the sea and built sandcastles. In the afternoon, we visited the Marble Mountains and ate seafood at a local restaurant. It was the best holiday I have ever had.',
          q: 'How long did the family stay in Da Nang?',
          ans: 'Five days', distract: ['Three days', 'One week', 'Two weeks'],
        },
        {
          text: 'The school science fair was held last Friday. Students from all classes prepared interesting projects. Mai made a model of the solar system using fruits. Tuan built a small robot that could move forward and backward. The winner was a girl named Linh who created a water filter from sand and rocks.',
          q: 'What did the winner create?',
          ans: 'A water filter', distract: ['A solar system model', 'A small robot', 'A volcano'],
        },
        {
          text: 'My neighbor, Mr. Thanh, is a retired teacher. He wakes up early every morning to exercise in the park. After that, he waters his garden and reads the newspaper. In the afternoon, he teaches English to children in the neighborhood for free. Everyone loves him.',
          q: 'What does Mr. Thanh do in the afternoon?',
          ans: 'Teaches English to children', distract: ['Exercises in the park', 'Reads the newspaper', 'Waters his garden'],
        },
        {
          text: 'Recycling is important for our planet. Paper, plastic, and glass can all be recycled. When we recycle, we use less energy and create less pollution. Many countries have recycling programs. In Vietnam, people are learning to separate their rubbish into different bins.',
          q: 'What is one benefit of recycling?',
          ans: 'We use less energy', distract: ['We make more money', 'We eat healthier', 'We sleep better'],
        },
        {
          text: 'Anna loves reading books. She goes to the library every Saturday. Last week, she borrowed three books: a mystery novel, a cookbook, and a book about space. She finished the mystery novel in two days because it was so exciting.',
          q: 'How many books did Anna borrow?',
          ans: 'Three', distract: ['Two', 'Four', 'Five'],
        },
        {
          text: 'The Mekong Delta is famous for its floating markets. Every morning, farmers bring their fruits and vegetables to sell from their boats. Tourists can buy fresh produce and try local food while floating on the river. It is a unique experience.',
          q: 'Where do farmers sell their products?',
          ans: 'From their boats', distract: ['In supermarkets', 'At the school', 'In restaurants'],
        },
        {
          text: 'Exercise is good for both the body and the mind. Doctors recommend at least 30 minutes of physical activity every day. Walking, swimming, and cycling are all excellent choices. Regular exercise helps us sleep better and feel happier.',
          q: 'How long should we exercise daily?',
          ans: 'At least 30 minutes', distract: ['10 minutes', '1 hour', '2 hours'],
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

// --- Smart Template Generator Data & Engine ---

const METADATA: Record<keyof typeof POOLS, { singular: string; plural: string; verb?: string }> = {
  animals:   { singular: 'animal',         plural: 'animals' },
  colors:    { singular: 'color',          plural: 'colors' },
  fruits:    { singular: 'fruit',          plural: 'fruits' },
  food:      { singular: 'food item',      plural: 'food items' },
  family:    { singular: 'family member',  plural: 'family members' },
  school:    { singular: 'school object',  plural: 'school objects' },
  weather:   { singular: 'weather type',   plural: 'weather types' },
  body:      { singular: 'body part',      plural: 'body parts' },
  clothes:   { singular: 'clothing item',  plural: 'clothing items' },
  numbers:   { singular: 'number',         plural: 'numbers' },
  rooms:     { singular: 'room',           plural: 'rooms' },
  jobs:      { singular: 'job',            plural: 'jobs' },
  transport: { singular: 'vehicle',        plural: 'vehicles' },
  verbsA1:   { singular: 'action verb',    plural: 'action verbs' },
  greetings:  { singular: 'greeting',       plural: 'greetings' },
  days_months: { singular: 'day or month',  plural: 'days and months' },
  prepositions: { singular: 'preposition',  plural: 'prepositions' },
  phrasal_verbs: { singular: 'phrasal verb', plural: 'phrasal verbs' },
  conditionals: { singular: 'conditional sentence', plural: 'conditional sentences' },
  passive_voice: { singular: 'passive sentence', plural: 'passive sentences' },
  collocations: { singular: 'collocation',  plural: 'collocations' },
  time_expressions: { singular: 'time expression', plural: 'time expressions' },
}

const CONTEXT_TEMPLATES: Record<keyof typeof POOLS, { text: string; correct: string; distractors: string[] }[]> = {
  animals: [
    { text: 'I see a dog and a ___ playing in the garden.', correct: 'cat', distractors: ['red', 'apple', 'pencil'] },
    { text: 'The ___ is the king of the forest and has a loud roar.', correct: 'lion', distractors: ['rabbit', 'fish', 'banana'] },
    { text: 'A small ___ lives in a pond and can jump high.', correct: 'frog', distractors: ['shirt', 'teacher', 'car'] }
  ],
  colors: [
    { text: 'Apples are red, and bananas are ___.', correct: 'yellow', distractors: ['rabbit', 'kitchen', 'bus'] },
    { text: 'The sky is ___ on a sunny day.', correct: 'blue', distractors: ['brown', 'green', 'black'] },
    { text: 'Grass and leaves on trees are usually ___.', correct: 'green', distractors: ['pink', 'purple', 'white'] }
  ],
  fruits: [
    { text: 'A lemon is sour, but a ___ is sweet and yellow.', correct: 'banana', distractors: ['cat', 'blue', 'doctor'] },
    { text: 'An ___ is round, red or green, and grows on a tree.', correct: 'apple', distractors: ['dog', 'pencil', 'sunny'] },
    { text: 'A ___ is green outside, red inside, and has black seeds.', correct: 'watermelon', distractors: ['grape', 'lemon', 'orange'] }
  ],
  food: [
    { text: 'I usually have bread and ___ for breakfast.', correct: 'milk', distractors: ['sunny', 'arm', 'train'] },
    { text: 'Italian ___ with cheese and tomatoes is very popular.', correct: 'pizza', distractors: ['banana', 'book', 'shoes'] },
    { text: 'We eat hot ___ in a bowl with a spoon on a cold day.', correct: 'soup', distractors: ['cake', 'rice', 'eraser'] }
  ],
  family: [
    { text: 'My mother and my ___ are my parents.', correct: 'father', distractors: ['T-shirt', 'ten', 'cook'] },
    { text: 'My father\'s sister is my ___.', correct: 'aunt', distractors: ['uncle', 'brother', 'grandfather'] },
    { text: 'My mother\'s brother is my ___.', correct: 'uncle', distractors: ['aunt', 'sister', 'grandmother'] }
  ],
  school: [
    { text: 'I write in my notebook with a ___.', correct: 'pencil', distractors: ['dog', 'banana', 'sunny'] },
    { text: 'The teacher writes on the big black ___ in the classroom.', correct: 'board', distractors: ['shoes', 'bed', 'train'] },
    { text: 'I keep my books, pens, and rulers in my school ___.', correct: 'bag', distractors: ['chair', 'table', 'kitchen'] }
  ],
  weather: [
    { text: 'It is raining outside, so I need an umbrella on this ___ day.', correct: 'rainy', distractors: ['happy', 'cat', 'bread'] },
    { text: 'The sun is shining bright. It is very ___ today.', correct: 'sunny', distractors: ['cold', 'snowy', 'cloudy'] },
    { text: 'Wear your coat and gloves because it is very ___ outside.', correct: 'cold', distractors: ['hot', 'warm', 'sunny'] }
  ],
  body: [
    { text: 'We use our ___ to see the beautiful flowers.', correct: 'eyes', distractors: ['shoes', 'one', 'teacher'] },
    { text: 'He listens to music with his ___.', correct: 'ears', distractors: ['eyes', 'hands', 'feet'] },
    { text: 'We walk and run with our legs and ___.', correct: 'feet', distractors: ['arms', 'hair', 'fingers'] }
  ],
  clothes: [
    { text: 'When it is cold, I wear a warm ___.', correct: 'jacket', distractors: ['apple', 'desk', 'kitchen'] },
    { text: 'She is wearing a beautiful pink ___ to the party.', correct: 'dress', distractors: ['hat', 'shoes', 'jeans'] },
    { text: 'We wear warm ___ on our feet before putting on shoes.', correct: 'socks', distractors: ['gloves', 'scarf', 'shirts'] }
  ],
  numbers: [
    { text: 'Five plus two is ___.', correct: 'seven', distractors: ['pink', 'rabbit', 'nurse'] },
    { text: 'There are twelve months in ___ year.', correct: 'one', distractors: ['two', 'ten', 'twenty'] },
    { text: 'Two times five is ___.', correct: 'ten', distractors: ['three', 'eleven', 'twelve'] }
  ],
  rooms: [
    { text: 'We cook delicious meals in the ___.', correct: 'kitchen', distractors: ['cat', 'pencil', 'driver'] },
    { text: 'I sleep in my cozy bed in the ___.', correct: 'bedroom', distractors: ['bathroom', 'living room', 'garden'] },
    { text: 'We watch TV and talk with our family in the ___.', correct: 'living room', distractors: ['garage', 'kitchen', 'garden'] }
  ],
  jobs: [
    { text: 'My English ___ helps me learn new words in class.', correct: 'teacher', distractors: ['orange', 'sunny', 'car'] },
    { text: 'The ___ works at the hospital and helps sick people.', correct: 'doctor', distractors: ['singer', 'cook', 'student'] },
    { text: 'A ___ works in the field and grows rice and vegetables.', correct: 'farmer', distractors: ['nurse', 'driver', 'teacher'] }
  ],
  transport: [
    { text: 'We go to school by school ___.', correct: 'bus', distractors: ['mother', 'grape', 'happy'] },
    { text: 'An airplane flies in the air, but a ___ travels on the water.', correct: 'boat', distractors: ['car', 'train', 'bike'] },
    { text: 'My brother rides his ___ to the park.', correct: 'bike', distractors: ['boat', 'plane', 'train'] }
  ],
  verbsA1: [
    { text: 'Birds can fly, and fish can ___.', correct: 'swim', distractors: ['read', 'write', 'draw'] },
    { text: 'I love to ___ songs in the music class.', correct: 'sing', distractors: ['run', 'sleep', 'jump'] },
    { text: 'Every night, I go to bed and ___ for eight hours.', correct: 'sleep', distractors: ['dance', 'cook', 'eat'] }
  ],
  greetings: [
    { text: 'When you meet someone for the first time, you say "___".', correct: 'nice to meet you', distractors: ['goodbye', 'sorry', 'see you later'] },
    { text: 'Before you go to sleep, you say "___" to your parents.', correct: 'good night', distractors: ['good morning', 'hello', 'thank you'] },
    { text: 'When someone helps you, you say "___".', correct: 'thank you', distractors: ['sorry', 'goodbye', 'excuse me'] }
  ],
  days_months: [
    { text: 'The first day of the school week is usually ___.', correct: 'Monday', distractors: ['Sunday', 'Saturday', 'Friday'] },
    { text: 'Christmas is in the month of ___.', correct: 'December', distractors: ['January', 'March', 'October'] },
    { text: 'The weekend days are Saturday and ___.', correct: 'Sunday', distractors: ['Monday', 'Friday', 'Tuesday'] }
  ],
  prepositions: [
    { text: 'The cat is hiding ___ the table.', correct: 'under', distractors: ['above', 'in', 'beside'] },
    { text: 'The picture is ___ the wall.', correct: 'on', distractors: ['in', 'under', 'behind'] },
    { text: 'The school is ___ the park and the hospital.', correct: 'between', distractors: ['under', 'above', 'in'] }
  ],
  phrasal_verbs: [
    { text: 'Please ___ the TV. I want to watch a movie.', correct: 'turn on', distractors: ['turn off', 'pick up', 'put down'] },
    { text: 'I ___ at 7 AM every morning for school.', correct: 'get up', distractors: ['give up', 'sit down', 'go out'] },
    { text: 'Can you ___ your toys from the floor?', correct: 'pick up', distractors: ['put on', 'turn off', 'stand up'] }
  ],
  conditionals: [
    { text: 'If it ___, we will stay inside.', correct: 'rains', distractors: ['rained', 'raining', 'rain'] },
    { text: 'I would travel the world if I ___ rich.', correct: 'were', distractors: ['am', 'is', 'being'] },
    { text: 'If she studies hard, she ___ pass the exam.', correct: 'will', distractors: ['would', 'can', 'should'] }
  ],
  passive_voice: [
    { text: 'The homework ___ by the students every day.', correct: 'is done', distractors: ['does', 'did', 'doing'] },
    { text: 'This song ___ by millions of people.', correct: 'is loved', distractors: ['loves', 'loved', 'loving'] },
    { text: 'The cake ___ by my grandmother yesterday.', correct: 'was made', distractors: ['made', 'makes', 'is making'] }
  ],
  collocations: [
    { text: 'I always ___ homework after school.', correct: 'do', distractors: ['make', 'take', 'have'] },
    { text: 'Let me ___ a photo of this beautiful flower.', correct: 'take', distractors: ['do', 'make', 'have'] },
    { text: 'She ___ a mistake on the test.', correct: 'made', distractors: ['did', 'took', 'had'] }
  ],
  time_expressions: [
    { text: 'I saw him two days ___.', correct: 'ago', distractors: ['since', 'for', 'yet'] },
    { text: 'She has lived here ___ 2020.', correct: 'since', distractors: ['for', 'ago', 'already'] },
    { text: 'I have ___ finished my homework.', correct: 'already', distractors: ['yet', 'ago', 'since'] }
  ]
}

const STORIES: Record<keyof typeof POOLS, { text: string; q: string; correct: string; distractors: string[] }[]> = {
  animals: [
    {
      text: 'My uncle has a big black dog. Its name is Max. Max likes to run in the park and play with children.',
      q: 'What is the name of the dog?',
      correct: 'Max',
      distractors: ['Mimi', 'Toby', 'Leo']
    },
    {
      text: 'A little bird lives in the tree near my window. It is blue and yellow. Every morning, it sings a happy song.',
      q: 'Where does the bird live?',
      correct: 'In the tree',
      distractors: ['In a house', 'In the water', 'In the school']
    }
  ],
  colors: [
    {
      text: 'Mary has a new school bag. It is bright pink with white stars. She wears it to school every day and loves it very much.',
      q: 'What color is Mary\'s school bag?',
      correct: 'Pink',
      distractors: ['Blue', 'Green', 'Yellow']
    },
    {
      text: 'Look at the rainbow in the sky! It has seven colors: red, orange, yellow, green, blue, indigo, and violet. It is beautiful.',
      q: 'How many colors does the rainbow have?',
      correct: 'Seven',
      distractors: ['Three', 'Five', 'Ten']
    }
  ],
  fruits: [
    {
      text: 'Every morning, Tom drinks a glass of fresh orange juice. His sister Anna prefers to eat a sweet red apple.',
      q: 'What does Tom drink in the morning?',
      correct: 'Orange juice',
      distractors: ['Milk', 'Water', 'Apple juice']
    },
    {
      text: 'We went to a big fruit farm last Sunday. We saw many yellow bananas and green grapes. We bought some strawberries.',
      q: 'When did we visit the fruit farm?',
      correct: 'Last Sunday',
      distractors: ['Yesterday', 'Last year', 'Every day']
    }
  ],
  food: [
    {
      text: 'For dinner, my mother cooks rice, chicken, and hot soup. We all sit around the table and enjoy the meal.',
      q: 'What does my mother cook for dinner?',
      correct: 'Rice, chicken, and soup',
      distractors: ['Pizza and noodles', 'Bread and eggs', 'Cake and milk']
    }
  ],
  family: [
    {
      text: 'Hello, my name is John. I live with my parents and my baby sister, Lucy. We love to go to the park on weekends.',
      q: 'Who is Lucy?',
      correct: 'John\'s sister',
      distractors: ['John\'s mother', 'John\'s grandmother', 'John\'s cousin']
    }
  ],
  school: [
    {
      text: 'In my classroom, there are twenty desks and chairs. There is also a big green board where our teacher writes lessons.',
      q: 'How many desks and chairs are there in the classroom?',
      correct: 'Twenty',
      distractors: ['Ten', 'Fifteen', 'Thirty']
    }
  ],
  weather: [
    {
      text: 'It is very cold and snowy in Japan during December. People wear thick jackets, warm hats, and gloves to stay warm outside.',
      q: 'How is the weather in Japan during December?',
      correct: 'Cold and snowy',
      distractors: ['Hot and sunny', 'Rainy and windy', 'Warm and cool']
    }
  ],
  body: [
    {
      text: 'The doctor told me to wash my hands with soap before eating. We should also brush our teeth twice a day to stay healthy.',
      q: 'When should we wash our hands?',
      correct: 'Before eating',
      distractors: ['After sleeping', 'Before playing', 'Twice a day']
    }
  ],
  clothes: [
    {
      text: 'Emma wears a yellow T-shirt and blue jeans to school today. She also wears comfortable white shoes.',
      q: 'What is Emma wearing on her feet?',
      correct: 'White shoes',
      distractors: ['Blue jeans', 'Yellow T-shirt', 'A red hat']
    }
  ],
  numbers: [
    {
      text: 'There are seven days in a week. They are Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, and Sunday.',
      q: 'How many days are there in a week?',
      correct: 'Seven',
      distractors: ['Five', 'Six', 'Eight']
    }
  ],
  rooms: [
    {
      text: 'Our house has a beautiful green garden behind it. My father likes to plant flowers and water them every afternoon.',
      q: 'Where does my father plant flowers?',
      correct: 'In the garden',
      distractors: ['In the kitchen', 'In the bedroom', 'In the garage']
    }
  ],
  jobs: [
    {
      text: 'Mr. Brown is a doctor. He works at a large hospital in the city. He helps sick children get well.',
      q: 'Where does Mr. Brown work?',
      correct: 'At a large hospital',
      distractors: ['At a school', 'On a farm', 'In a restaurant']
    }
  ],
  transport: [
    {
      text: 'Every morning, Mrs. Green goes to work by train. The train station is near her house, and the journey takes twenty minutes.',
      q: 'How does Mrs. Green go to work?',
      correct: 'By train',
      distractors: ['By car', 'By bus', 'By bike']
    }
  ],
  verbsA1: [
    {
      text: 'My friends like to play football on Sundays. I do not play with them because I prefer to sing and dance at home.',
      q: 'What do my friends like to do on Sundays?',
      correct: 'Play football',
      distractors: ['Sing and dance', 'Read books', 'Cook dinner']
    }
  ],
  greetings: [
    {
      text: 'Every morning, Anna says "Good morning" to her teacher. When she leaves school, she says "Goodbye, see you tomorrow!" Her teacher always smiles and waves.',
      q: 'What does Anna say when she leaves school?',
      correct: 'Goodbye, see you tomorrow',
      distractors: ['Good morning', 'Thank you', 'Sorry']
    }
  ],
  days_months: [
    {
      text: 'Tom\'s school has a special day every Wednesday. The students play sports and do art activities. Tom likes Wednesday because he can play basketball with his friends.',
      q: 'What day does the school have special activities?',
      correct: 'Wednesday',
      distractors: ['Monday', 'Friday', 'Saturday']
    }
  ],
  prepositions: [
    {
      text: 'My cat loves to play hide and seek. Sometimes she hides under the bed. Sometimes she sits on top of the bookshelf. Today I found her behind the curtain in the living room.',
      q: 'Where was the cat found today?',
      correct: 'Behind the curtain',
      distractors: ['Under the bed', 'On the bookshelf', 'In the kitchen']
    }
  ],
  phrasal_verbs: [
    {
      text: 'Every morning, Lisa gets up at 6:30. She puts on her school uniform and picks up her bag. Before leaving, her mother reminds her to turn off the lights in her room.',
      q: 'What does Lisa\'s mother remind her to do?',
      correct: 'Turn off the lights',
      distractors: ['Get up early', 'Pick up her bag', 'Put on her uniform']
    }
  ],
  conditionals: [
    {
      text: 'If the weather is nice tomorrow, our class will go on a picnic to the park. If it rains, we will stay at school and watch a movie instead. Everyone hopes for sunshine!',
      q: 'What will happen if it rains?',
      correct: 'They will watch a movie at school',
      distractors: ['They will go to the park', 'They will go home', 'They will play sports']
    }
  ],
  passive_voice: [
    {
      text: 'The school library was built in 2010. It was designed by a famous architect. More than 5,000 books are kept in the library. New books are added every month by the librarian.',
      q: 'When was the library built?',
      correct: '2010',
      distractors: ['2015', '2000', '2020']
    }
  ],
  collocations: [
    {
      text: 'Yesterday, I made a big mistake on my math test. After school, I did my homework carefully. Then I took a shower and had dinner with my family. We had a lot of fun talking together.',
      q: 'What happened on the math test?',
      correct: 'Made a mistake',
      distractors: ['Got a good score', 'Finished early', 'Did not take it']
    }
  ],
  time_expressions: [
    {
      text: 'Sarah moved to Hanoi two years ago. She has lived here since 2024. She has already made many friends. She is going to visit her hometown next month for a holiday.',
      q: 'When did Sarah move to Hanoi?',
      correct: 'Two years ago',
      distractors: ['Last month', 'Yesterday', 'Next week']
    }
  ]
}

const DIALOGUES: Record<keyof typeof POOLS, { text: string; q: string; correct: string; distractors: string[] }[]> = {
  animals: [
    {
      text: 'A: Do you have a pet?\nB: Yes, I have a cute rabbit. It is white and loves carrots.',
      q: 'What pet does B have?',
      correct: 'A rabbit',
      distractors: ['A cat', 'A dog', 'A bird']
    }
  ],
  colors: [
    {
      text: 'A: What is your favorite color?\nB: I like blue, like the sky on a sunny day.',
      q: 'What is B\'s favorite color?',
      correct: 'Blue',
      distractors: ['Red', 'Green', 'Yellow']
    }
  ],
  fruits: [
    {
      text: 'A: Would you like some bananas?\nB: No, thanks. I would like some sweet strawberries.',
      q: 'What fruit does B want?',
      correct: 'Strawberries',
      distractors: ['Bananas', 'Apples', 'Oranges']
    }
  ],
  food: [
    {
      text: 'A: Are you hungry?\nB: Yes, I want to eat pizza for lunch.',
      q: 'What does B want to eat?',
      correct: 'Pizza',
      distractors: ['Soup', 'Rice', 'Bread']
    }
  ],
  family: [
    {
      text: 'A: Is that your brother?\nB: No, that is my cousin. His name is Alex.',
      q: 'Who is the person B is pointing to?',
      correct: 'B\'s cousin',
      distractors: ['B\'s brother', 'B\'s father', 'B\'s friend']
    }
  ],
  school: [
    {
      text: 'A: Can I borrow your eraser, please?\nB: Yes, here it is in my pencil case.',
      q: 'What does A want to borrow?',
      correct: 'An eraser',
      distractors: ['A pencil', 'A ruler', 'A pen']
    }
  ],
  weather: [
    {
      text: 'A: Is it sunny outside?\nB: No, it is very rainy. Don\'t forget your raincoat.',
      q: 'How is the weather outside?',
      correct: 'Rainy',
      distractors: ['Sunny', 'Cloudy', 'Windy']
    }
  ],
  body: [
    {
      text: 'A: What is the matter?\nB: My leg hurts after playing football.',
      q: 'What part of B\'s body hurts?',
      correct: 'Leg',
      distractors: ['Arm', 'Head', 'Hand']
    }
  ],
  clothes: [
    {
      text: 'A: I like your new blue jacket.\nB: Thank you. My mother bought it for me.',
      q: 'What is B wearing that A likes?',
      correct: 'A blue jacket',
      distractors: ['A red hat', 'A yellow shirt', 'White shoes']
    }
  ],
  numbers: [
    {
      text: 'A: How many apples are there?\nB: I count ten apples on the table.',
      q: 'How many apples are on the table?',
      correct: 'Ten',
      distractors: ['Five', 'Eight', 'Twelve']
    }
  ],
  rooms: [
    {
      text: 'A: Where is your mother?\nB: She is cooking in the kitchen.',
      q: 'Where is B\'s mother?',
      correct: 'In the kitchen',
      distractors: ['In the bedroom', 'In the garden', 'In the bathroom']
    }
  ],
  jobs: [
    {
      text: 'A: What does your father do?\nB: He is a farmer. He works in the fields.',
      q: 'What is B\'s father\'s job?',
      correct: 'A farmer',
      distractors: ['A teacher', 'A doctor', 'A driver']
    }
  ],
  transport: [
    {
      text: 'A: How do you go to school?\nB: I ride my bike, but my sister goes by bus.',
      q: 'How does B go to school?',
      correct: 'By bike',
      distractors: ['By bus', 'By car', 'By train']
    }
  ],
  verbsA1: [
    {
      text: 'A: Can you draw a cat?\nB: No, but I can write its name.',
      q: 'What can B do?',
      correct: 'Write the word "cat"',
      distractors: ['Draw a cat', 'Sing a song', 'Run fast']
    }
  ],
  greetings: [
    {
      text: 'A: Good morning, Mrs. Lee!\nB: Good morning, Tom. How are you today?\nA: I am fine, thank you.',
      q: 'How is Tom?',
      correct: 'He is fine',
      distractors: ['He is sick', 'He is sad', 'He is angry']
    }
  ],
  days_months: [
    {
      text: 'A: When is your birthday?\nB: My birthday is on March 15th.\nA: Oh, that is next week!',
      q: 'When is B\'s birthday?',
      correct: 'March 15th',
      distractors: ['March 5th', 'May 15th', 'June 15th']
    }
  ],
  prepositions: [
    {
      text: 'A: Where is my pencil?\nB: It is under your book, next to the eraser.',
      q: 'Where is the pencil?',
      correct: 'Under the book',
      distractors: ['On the desk', 'In the bag', 'Behind the chair']
    }
  ],
  phrasal_verbs: [
    {
      text: 'A: Can you turn off the light, please?\nB: Sure, I will turn it off right now.',
      q: 'What does A ask B to do?',
      correct: 'Turn off the light',
      distractors: ['Turn on the TV', 'Pick up a book', 'Sit down']
    }
  ],
  conditionals: [
    {
      text: 'A: What will you do if it rains tomorrow?\nB: If it rains, I will read books at home.',
      q: 'What will B do if it rains?',
      correct: 'Read books at home',
      distractors: ['Go to the park', 'Play football', 'Go swimming']
    }
  ],
  passive_voice: [
    {
      text: 'A: Who made this cake?\nB: It was made by my sister. She is very good at baking.',
      q: 'Who made the cake?',
      correct: 'B\'s sister',
      distractors: ['B\'s mother', 'B\'s father', 'B']
    }
  ],
  collocations: [
    {
      text: 'A: Did you do your homework?\nB: Yes, and I also did the dishes after dinner.',
      q: 'What did B do after dinner?',
      correct: 'The dishes',
      distractors: ['Homework', 'Exercise', 'A mistake']
    }
  ],
  time_expressions: [
    {
      text: 'A: Have you finished the project?\nB: Not yet. I will finish it tomorrow.',
      q: 'When will B finish the project?',
      correct: 'Tomorrow',
      distractors: ['Yesterday', 'Last week', 'Right now']
    }
  ]
}

const SPEAKING_PROMPTS: Record<keyof typeof POOLS, string[]> = {
  animals: [
    'Tell me about your favorite animal. What does it look like? What does it eat?',
    'Describe your pet (or a pet you want to have). How do you take care of it?',
    'Compare a dog and a tiger. What are the differences?'
  ],
  colors: [
    'What is your favorite color? Tell me three things in this classroom that have that color.',
    'Describe the colors of a rainbow and what they represent to you.',
    'Do you prefer dark colors or bright colors? Why?'
  ],
  fruits: [
    'What is your favorite fruit? Describe its color, size, and how it tastes.',
    'Why is eating fruit good for our health? Name three fruits you eat often.',
    'Tell me how to make a simple fruit salad.'
  ],
  food: [
    'What do you usually eat for breakfast, lunch, and dinner?',
    'What is your favorite food? Can you explain how it is cooked?',
    'Discuss the differences between healthy food and fast food.'
  ],
  family: [
    'Introduce your family. How many people are there and what do they like to do?',
    'Describe one family member you love the most. What is he/she like?',
    'What activities does your family enjoy doing together on weekends?'
  ],
  school: [
    'Tell me about your school. What is your favorite subject and why?',
    'Describe your classroom. What objects can you see around you?',
    'What do you like to do during school breaks or recess?'
  ],
  weather: [
    'What is your favorite season or weather? What activities do you do in that weather?',
    'Describe the weather in your country today. How does it make you feel?',
    'What clothes do you wear when it is very cold or very hot?'
  ],
  body: [
    'Name five parts of your face and explain what you use them for.',
    'Why is it important to wash our hands and brush our teeth? How do we stay healthy?',
    'Describe how you use your hands and feet in daily activities.'
  ],
  clothes: [
    'Describe the clothes you are wearing today. What colors are they?',
    'What clothes do you like to wear when you go to a birthday party?',
    'Do you prefer wearing school uniforms or casual clothes? Why?'
  ],
  numbers: [
    'Count from one to twenty in English. What is your lucky number?',
    'How do you use numbers in math class and in daily life?',
    'How many students are there in your class? Can you describe some of them?'
  ],
  rooms: [
    'Describe your bedroom. What furniture is inside and how is it decorated?',
    'Which room in your house do you spend the most time in? Why?',
    'If you could add a new room to your house, what would it be?'
  ],
  jobs: [
    'What do you want to be when you grow up? Why do you choose that job?',
    'Describe the job of a teacher or a doctor. Why are they important?',
    'What job does your father or mother do? Can you explain their daily work?'
  ],
  transport: [
    'How do you travel to school or to other places? Describe your journey.',
    'Which type of transport do you think is the fastest and safest? Why?',
    'Describe an exciting trip you took using a train, plane, or boat.'
  ],
  verbsA1: [
    'Show and talk about three actions you can do (e.g. running, jumping, drawing).',
    'What activities do you like to do on weekends? Do you play sports or sing?',
    'Describe a busy day. What actions do you perform from morning to night?'
  ],
  greetings: [
    'Practice greeting someone in different situations: at school, at a party, at the doctor.',
    'How do you say hello and goodbye in Vietnamese? Compare with English greetings.',
    'Role-play: You meet a new friend. Introduce yourself and ask about them.'
  ],
  days_months: [
    'Tell me about your favorite day of the week. What do you do on that day?',
    'What is special about your birthday month? Describe what happens.',
    'Describe your weekly schedule. What activities do you have each day?'
  ],
  prepositions: [
    'Look around the classroom and describe where 5 things are using in, on, under, next to.',
    'Describe the layout of your bedroom. Where is the bed? Where is the desk?',
    'Give directions from the school gate to your classroom using prepositions.'
  ],
  phrasal_verbs: [
    'Describe your morning routine using phrasal verbs like get up, put on, turn off.',
    'Tell a story about a day when everything went wrong using phrasal verbs.',
    'Explain 5 phrasal verbs to your partner and give examples.'
  ],
  conditionals: [
    'What will you do if you have a day off from school tomorrow?',
    'If you could visit any country in the world, where would you go and why?',
    'Discuss: What would happen if there were no smartphones for a week?'
  ],
  passive_voice: [
    'Describe how a product is made (e.g. bread, chocolate, or paper).',
    'Talk about famous buildings. When were they built? Who designed them?',
    'Describe your school using passive voice: When was it built? How many students are taught here?'
  ],
  collocations: [
    'Tell me about your daily routine using collocations: have breakfast, take a shower, do homework.',
    'Describe a perfect weekend using at least 5 collocations.',
    'What mistakes do students often make in English? Use "make a mistake", "pay attention".'
  ],
  time_expressions: [
    'Tell me what you did yesterday, what you are doing now, and what you will do tomorrow.',
    'Describe three important events in your life and when they happened.',
    'Talk about your plans for next week using time expressions.'
  ]
}

const WRITING_PROMPTS: Record<keyof typeof POOLS, string[]> = {
  animals: [
    'Write a short paragraph (30-50 words) about your favorite animal.',
    'Write about a wild animal. What does it eat and where does it live?'
  ],
  colors: [
    'Write about your favorite colors and how they make you feel.',
    'Describe the colors of your school uniform and your bedroom.'
  ],
  fruits: [
    'Write about a fruit you like. Describe its taste, color, and texture.',
    'Write a short paragraph about why we should eat more fruits.'
  ],
  food: [
    'Write about your favorite meal. What dishes are included and who cooks it?',
    'Write a short recipe of your favorite snack or drink.'
  ],
  family: [
    'Write a short paragraph describing your family members.',
    'Write a letter to a family member telling them why you love them.'
  ],
  school: [
    'Write about your favorite school day of the week. What subjects do you have?',
    'Write a description of your school bag and the things inside it.'
  ],
  weather: [
    'Write about what you do on a rainy day compared to a sunny day.',
    'Describe the weather during your favorite holiday.'
  ],
  body: [
    'Write a short text about how to keep our body clean and healthy.',
    'Describe your face and hair using adjectives.'
  ],
  clothes: [
    'Write about the clothes you wear in summer vs winter.',
    'Describe your favorite piece of clothing (e.g. jacket, shoes).'
  ],
  numbers: [
    'Write about the number of people, pets, and rooms in your house.',
    'Explain how you use numbers when buying things at a store.'
  ],
  rooms: [
    'Write a description of your living room. What is inside?',
    'Describe the house of your dreams. How many rooms does it have?'
  ],
  jobs: [
    'Write about the job of a person you know (e.g. your parent or teacher).',
    'Write about the career you want to pursue in the future.'
  ],
  transport: [
    'Write about a trip you took by car, train, or airplane.',
    'Explain the advantages of riding a bike instead of driving a car.'
  ],
  verbsA1: [
    'Write about your hobbies. What do you like to do in your free time?',
    'Write 5 sentences describing what you did yesterday using active verbs.'
  ],
  greetings: [
    'Write a dialogue between two friends meeting for the first time.',
    'Write about the different greetings used in Vietnam and English-speaking countries.'
  ],
  days_months: [
    'Write about your favorite day of the week and why you like it.',
    'Describe the seasons and the months they occur in your country.'
  ],
  prepositions: [
    'Describe the position of objects in your classroom using prepositions.',
    'Write about where things are in your bedroom.'
  ],
  phrasal_verbs: [
    'Write about your morning routine using phrasal verbs (get up, put on, etc.).',
    'Write a story using at least 5 phrasal verbs.'
  ],
  conditionals: [
    'Write 5 sentences about what you would do if you won a million dollars.',
    'Write about what will happen if you study English every day.'
  ],
  passive_voice: [
    'Rewrite these sentences in the passive voice: "She wrote the letter. He cooked dinner."',
    'Write about how your favorite food is made using the passive voice.'
  ],
  collocations: [
    'Write sentences using these collocations: make a mistake, do homework, take a photo.',
    'Write a diary entry for today using at least 5 collocations.'
  ],
  time_expressions: [
    'Write about what you did last weekend and what you will do next weekend.',
    'Describe three important events in your life using time expressions.'
  ]
}

export function detectPool(topic: string): keyof typeof POOLS | null {
  const t = topic.toLowerCase().trim()
  if (!t) return null
  
  if (t.includes('animal') || t.includes('con vật') || t.includes('con vat') || t.includes('thú') || t.includes('pet')) return 'animals'
  if (t.includes('color') || t.includes('màu') || t.includes('mau')) return 'colors'
  if (t.includes('fruit') || t.includes('trái cây') || t.includes('trai cay') || t.includes('hoa quả') || t.includes('hoa qua') || t.includes('quả') || t.includes('qua')) return 'fruits'
  if (t.includes('food') || t.includes('đồ ăn') || t.includes('do an') || t.includes('thức ăn') || t.includes('thuc an') || t.includes('uống') || t.includes('uong') || t.includes('drink') || t.includes('ăn') || t.includes('an')) return 'food'
  if (t.includes('family') || t.includes('gia đình') || t.includes('gia dinh') || t.includes('nhà') || t.includes('nha')) return 'family'
  if (t.includes('school') || t.includes('trường') || t.includes('truong') || t.includes('lớp') || t.includes('lop') || t.includes('pen') || t.includes('book') || t.includes('học') || t.includes('hoc')) return 'school'
  if (t.includes('weather') || t.includes('thời tiết') || t.includes('thoi tiet') || t.includes('mưa') || t.includes('nắng') || t.includes('gió') || t.includes('gio') || t.includes('lạnh') || t.includes('lanh') || t.includes('nóng') || t.includes('nong')) return 'weather'
  if (t.includes('body') || t.includes('cơ thể') || t.includes('co the') || t.includes('eye') || t.includes('face') || t.includes('sức khỏe') || t.includes('suc khoe')) return 'body'
  if (t.includes('clothe') || t.includes('quần áo') || t.includes('quan ao') || t.includes('mặc') || t.includes('mac') || t.includes('váy') || t.includes('vay') || t.includes('áo') || t.includes('ao')) return 'clothes'
  if (t.includes('number') || t.includes('số') || t.includes('so') || t.includes('đếm') || t.includes('dem')) return 'numbers'
  if (t.includes('room') || t.includes('phòng') || t.includes('phong') || t.includes('house') || t.includes('nhà ở') || t.includes('nha o')) return 'rooms'
  if (t.includes('job') || t.includes('nghề') || t.includes('nghe') || t.includes('work') || t.includes('làm') || t.includes('lam') || t.includes('nghiệp') || t.includes('nghiep')) return 'jobs'
  if (t.includes('transport') || t.includes('giao thông') || t.includes('giao thong') || t.includes('xe') || t.includes('bay') || t.includes('car') || t.includes('cộ') || t.includes('co')) return 'transport'
  if (t.includes('verb') || t.includes('động từ') || t.includes('dong tu') || t.includes('action') || t.includes('chạy') || t.includes('chay')) return 'verbsA1'
  if (t.includes('greeting') || t.includes('chào') || t.includes('chao') || t.includes('hello') || t.includes('xin chào') || t.includes('xin chao')) return 'greetings'
  if (t.includes('day') || t.includes('month') || t.includes('ngày') || t.includes('ngay') || t.includes('tháng') || t.includes('thang') || t.includes('tuần') || t.includes('tuan') || t.includes('week')) return 'days_months'
  if (t.includes('preposition') || t.includes('giới từ') || t.includes('gioi tu') || t.includes('vị trí') || t.includes('vi tri') || t.includes('location')) return 'prepositions'
  if (t.includes('phrasal') || t.includes('cụm động từ') || t.includes('cum dong tu') || t.includes('turn on') || t.includes('pick up')) return 'phrasal_verbs'
  if (t.includes('conditional') || t.includes('điều kiện') || t.includes('dieu kien') || t.includes('if clause')) return 'conditionals'
  if (t.includes('passive') || t.includes('bị động') || t.includes('bi dong')) return 'passive_voice'
  if (t.includes('collocation') || t.includes('kết hợp từ') || t.includes('ket hop tu') || t.includes('make do take')) return 'collocations'
  if (t.includes('time') || t.includes('thời gian') || t.includes('thoi gian') || t.includes('tense') || t.includes('thì') || t.includes('thi')) return 'time_expressions'

  return null
}

function generatePoolQuestion(pool: keyof typeof POOLS, skill: QuestionSkill): GeneratedQuestion {
  const meta = METADATA[pool]
  
  if (skill === 'general') {
    const r = Math.random()
    if (r < 0.4 && CONTEXT_TEMPLATES[pool]?.length > 0) {
      const temp = pick(CONTEXT_TEMPLATES[pool])
      const opts = [{ text: cap(temp.correct), isCorrect: true }, ...temp.distractors.map(d => ({ text: cap(d), isCorrect: false }))]
        .sort(() => 0.5 - Math.random())
      return {
        skill: 'general',
        type: 'mcq',
        points: 1,
        question_text: temp.text,
        options: opts,
        explanation: `The correct word to complete the sentence is "${temp.correct}".`
      }
    } else if (r < 0.7) {
      const correct = pick(POOLS[pool])
      const otherPoolNames = (Object.keys(POOLS) as (keyof typeof POOLS)[]).filter(p => p !== pool)
      const distractors: string[] = []
      while (distractors.length < 3) {
        const op = pick(otherPoolNames)
        const word = pick(POOLS[op])
        if (!distractors.includes(word) && word !== correct) {
          distractors.push(word)
        }
      }
      
      const opts = [{ text: cap(correct), isCorrect: true }, ...distractors.map(d => ({ text: cap(d), isCorrect: false }))]
        .sort(() => 0.5 - Math.random())
      return {
        skill: 'general',
        type: 'mcq',
        points: 1,
        question_text: `Which one is ${article(meta.singular)}?`,
        options: opts,
        explanation: `${cap(correct)} is ${article(meta.singular)}.`
      }
    } else {
      const correctWord = pick(POOLS[pool])
      const otherPoolNames = (Object.keys(POOLS) as (keyof typeof POOLS)[]).filter(p => p !== pool)
      const wrongWord = pick(POOLS[pick(otherPoolNames)])
      
      const isTrue = Math.random() > 0.5
      if (isTrue) {
        return {
          skill: 'general',
          type: 'true_false',
          points: 1,
          question_text: `"${cap(correctWord)}" is ${article(meta.singular)}.`,
          options: [
            { text: 'True', isCorrect: true },
            { text: 'False', isCorrect: false }
          ],
          explanation: `Yes, ${correctWord} is indeed ${article(meta.singular)}.`
        }
      } else {
        return {
          skill: 'general',
          type: 'true_false',
          points: 1,
          question_text: `"${cap(wrongWord)}" is ${article(meta.singular)}.`,
          options: [
            { text: 'True', isCorrect: false },
            { text: 'False', isCorrect: true }
          ],
          explanation: `No, ${wrongWord} is not ${article(meta.singular)}.`
        }
      }
    }
  }
  
  if (skill === 'reading') {
    if (STORIES[pool] && STORIES[pool].length > 0) {
      const s = pick(STORIES[pool])
      const opts = [{ text: s.correct, isCorrect: true }, ...s.distractors.map(d => ({ text: d, isCorrect: false }))]
        .sort(() => 0.5 - Math.random())
      return {
        skill: 'reading',
        type: 'mcq',
        points: 2,
        question_text: `Read: "${s.text}"\n\nQuestion: ${s.q}`,
        options: opts,
        explanation: `The passage states: "${s.text}". Thus, "${s.correct}" is correct.`
      }
    }
  }
  
  if (skill === 'listening') {
    if (DIALOGUES[pool] && DIALOGUES[pool].length > 0) {
      const d = pick(DIALOGUES[pool])
      const opts = [{ text: d.correct, isCorrect: true }, ...d.distractors.map(x => ({ text: x, isCorrect: false }))]
        .sort(() => 0.5 - Math.random())
      return {
        skill: 'listening',
        type: 'mcq',
        points: 2,
        question_text: `Listen to the dialogue. ${d.q}`,
        explanation: `Dialogue:\n${d.text}`,
        options: opts
      }
    }
  }
  
  if (skill === 'speaking') {
    const list = SPEAKING_PROMPTS[pool] || ['Talk about ' + meta.plural + '.']
    const prompt = pick(list)
    const needsImage = Math.random() > 0.4
    
    let imgSug = undefined
    if (needsImage) {
      if (pool === 'animals') imgSug = 'a cute puppy playing with a ball'
      else if (pool === 'colors') imgSug = 'a beautiful colorful rainbow'
      else if (pool === 'fruits') imgSug = 'a basket of fresh fruits'
      else if (pool === 'food') imgSug = 'a plate of delicious pizza'
      else if (pool === 'family') imgSug = 'a happy family photo'
      else if (pool === 'school') imgSug = 'a cartoon classroom'
      else if (pool === 'weather') imgSug = 'a sunny day at the beach'
      else if (pool === 'body') imgSug = 'a cartoon boy smiling'
      else if (pool === 'clothes') imgSug = 'colorful shirts and hats'
      else if (pool === 'numbers') imgSug = 'cartoon numbers 1 to 10'
      else if (pool === 'rooms') imgSug = 'a cozy living room'
      else if (pool === 'jobs') imgSug = 'a teacher in a school classroom'
      else if (pool === 'transport') imgSug = 'a school bus'
      else if (pool === 'verbsA1') imgSug = 'kids running and playing'
    }
    
    return {
      skill: 'speaking',
      type: 'speaking_prompt',
      points: 5,
      question_text: prompt,
      ...(imgSug ? { hasImageSuggestion: true, imageSuggestion: imgSug } : {})
    }
  }
  
  if (skill === 'writing') {
    const list = WRITING_PROMPTS[pool] || ['Write a paragraph about ' + meta.plural + '.']
    const prompt = pick(list)
    return {
      skill: 'writing',
      type: Math.random() > 0.5 ? 'short_answer' : 'fill_blank',
      points: 5,
      question_text: prompt
    }
  }
  
  return {
    skill: 'general',
    type: 'mcq',
    points: 1,
    question_text: `Which one is related to "${meta.singular}"?`,
    options: [
      { text: cap(pick(POOLS[pool])), isCorrect: true },
      { text: 'Table', isCorrect: false },
      { text: 'Window', isCorrect: false },
      { text: 'Door', isCorrect: false }
    ]
  }
}

function getFallbackQuestion(skill: QuestionSkill, type: QuestionType, topic: string): GeneratedQuestion {
  const displayTopic = topic.trim() ? ` about ${topic.trim()}` : ''
  if (type === 'mcq') {
    return {
      skill,
      type: 'mcq',
      points: 1,
      question_text: `Choose the correct answer${displayTopic}.`,
      options: [
        { text: 'Correct Answer', isCorrect: true },
        { text: 'Wrong Answer 1', isCorrect: false },
        { text: 'Wrong Answer 2', isCorrect: false },
        { text: 'Wrong Answer 3', isCorrect: false }
      ],
      explanation: 'Explanation for the correct answer.'
    }
  } else if (type === 'true_false') {
    return {
      skill,
      type: 'true_false',
      points: 1,
      question_text: `Is this statement${displayTopic} correct?`,
      options: [
        { text: 'True', isCorrect: true },
        { text: 'False', isCorrect: false }
      ],
      explanation: 'Explanation for the statement.'
    }
  } else if (type === 'fill_blank') {
    return {
      skill,
      type: 'fill_blank',
      points: 2,
      question_text: `Complete the sentence${displayTopic}: "This is a [blank]."`,
      explanation: 'The blank should be filled with the correct word.'
    }
  } else if (type === 'short_answer') {
    return {
      skill,
      type: 'short_answer',
      points: 2,
      question_text: `Answer the question${displayTopic} in one or two words.`,
      explanation: 'Provide a brief and clear answer.'
    }
  } else if (type === 'essay') {
    return {
      skill,
      type: 'essay',
      points: 5,
      question_text: `Write a short paragraph${displayTopic} (30-50 words).`,
      explanation: 'Write clearly using correct grammar.'
    }
  } else if (type === 'speaking_prompt') {
    return {
      skill,
      type: 'speaking_prompt',
      points: 5,
      question_text: `Describe the picture or talk${displayTopic} aloud.`,
      explanation: 'Speak clearly and pay attention to pronunciation.'
    }
  }

  return {
    skill,
    type: 'mcq',
    points: 1,
    question_text: `Practice question${displayTopic}.`,
    options: [
      { text: 'Option A', isCorrect: true },
      { text: 'Option B', isCorrect: false },
      { text: 'Option C', isCorrect: false },
      { text: 'Option D', isCorrect: false }
    ]
  }
}

export function generateQuestions(options: {
  topic: string
  skill: QuestionSkill | 'all'
  level: string
  count: number
  type?: QuestionType | 'all'
  skillPoints?: Record<QuestionSkill, number>
}): GeneratedQuestion[] {
  const { topic, skill, level, count, type = 'all', skillPoints } = options

  const poolName = detectPool(topic)

  const skills: QuestionSkill[] = skill === 'all'
    ? ['general', 'reading', 'listening', 'speaking', 'writing']
    : [skill]

  const out: GeneratedQuestion[] = []

  for (let i = 0; i < count; i++) {
    const currentSkill = pick(skills)
    let q: GeneratedQuestion | null = null

    if (type === 'all') {
      if (poolName) {
        q = generatePoolQuestion(poolName, currentSkill)
      } else {
        const gens = getGenerators(currentSkill, level)
        if (gens.length > 0) {
          const gen = pick(gens)
          q = gen()
        } else {
          q = {
            skill: currentSkill,
            type: 'mcq',
            points: 1,
            question_text: `Solve this ${currentSkill} practice question.`,
            options: [
              { text: 'Option A', isCorrect: true },
              { text: 'Option B', isCorrect: false },
              { text: 'Option C', isCorrect: false },
              { text: 'Option D', isCorrect: false }
            ]
          }
        }
      }
    } else {
      let attempts = 0
      while (attempts < 30) {
        let tempQ: GeneratedQuestion
        if (poolName) {
          tempQ = generatePoolQuestion(poolName, currentSkill)
        } else {
          const gens = getGenerators(currentSkill, level)
          if (gens.length > 0) {
            const gen = pick(gens)
            tempQ = gen()
          } else {
            tempQ = getFallbackQuestion(currentSkill, type, topic)
          }
        }
        if (tempQ.type === type) {
          q = tempQ
          break
        }
        attempts++
      }

      if (!q) {
        q = getFallbackQuestion(currentSkill, type, topic)
      }
    }

    if (!poolName && topic.trim() && q.skill !== 'speaking' && q.skill !== 'writing') {
      if (!q.question_text.startsWith(`[${topic.trim()}]`)) {
        q.question_text = `[${topic.trim()}] ${q.question_text}`
      }
    }

    if (q.hasImageSuggestion && q.imageSuggestion) {
      const prompt = buildImagePrompt(q.question_text, q.imageSuggestion)
      q.image_url = generateImageUrl(prompt, { seed: stableSeed(q.question_text + q.imageSuggestion) })
    }

    if (skillPoints && skillPoints[q.skill]) {
      q.points = skillPoints[q.skill]
    }

    out.push(q)
  }

  return out
}

