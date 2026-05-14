import { QuestionSkill, QuestionType } from '../../types/database';

export interface GeneratedQuestion {
  skill: QuestionSkill;
  type: QuestionType;
  question_text: string;
  options?: { text: string; isCorrect: boolean }[];
  explanation?: string;
  points: number;
  hasImageSuggestion?: boolean;
  imageSuggestion?: string;
}

const TEMPLATES: Record<QuestionSkill, Record<string, any[]>> = {
  general: {
    A1: [
      {
        type: 'mcq',
        question_text: "What is the opposite of 'hot'?",
        options: [
          { text: "Cold", isCorrect: true },
          { text: "Big", isCorrect: false },
          { text: "Small", isCorrect: false },
          { text: "Fast", isCorrect: false }
        ],
        points: 1
      },
      {
        type: 'true_false',
        question_text: "A cat is a type of bird.",
        options: [
          { text: "True", isCorrect: false },
          { text: "False", isCorrect: true }
        ],
        points: 1
      }
    ],
    B1: [
      {
        type: 'mcq',
        question_text: "Which word best describes someone who is always on time?",
        options: [
          { text: "Punctual", isCorrect: true },
          { text: "Patient", isCorrect: false },
          { text: "Polite", isCorrect: false },
          { text: "Prompt", isCorrect: false }
        ],
        points: 2
      }
    ]
  },
  reading: {
    A1: [
      {
        type: 'mcq',
        question_text: "Read the sign: 'No Smoking'. What does it mean?",
        options: [
          { text: "You can smoke here", isCorrect: false },
          { text: "You cannot smoke here", isCorrect: true },
          { text: "Smoking is expensive", isCorrect: false }
        ],
        points: 1
      }
    ],
    A2: [
      {
        type: 'mcq',
        question_text: "Look at the picture of the supermarket. Where are the apples?",
        hasImageSuggestion: true,
        imageSuggestion: "A photo of a supermarket fruit section with apples clearly visible.",
        options: [
          { text: "Next to the bread", isCorrect: false },
          { text: "In the fruit section", isCorrect: true },
          { text: "Under the table", isCorrect: false }
        ],
        points: 2
      }
    ]
  },
  listening: {
    A1: [
      {
        type: 'mcq',
        question_text: "Listen to the dialogue. What time does the train leave?",
        explanation: "Dialogue: 'Excuse me, what time is the train to London?' - 'It leaves at 8:30 AM.'",
        options: [
          { text: "8:00", isCorrect: false },
          { text: "8:30", isCorrect: true },
          { text: "9:00", isCorrect: false }
        ],
        points: 1
      }
    ]
  },
  speaking: {
    A1: [
      {
        type: 'speaking_prompt',
        question_text: "Look at the picture and describe what you see. Use at least 3 sentences.",
        hasImageSuggestion: true,
        imageSuggestion: "A happy family having a picnic in a park on a sunny day.",
        points: 5
      },
      {
        type: 'speaking_prompt',
        question_text: "Introduce yourself. Tell me your name, age, and where you live.",
        points: 5
      }
    ],
    B2: [
      {
        type: 'speaking_prompt',
        question_text: "Discuss the advantages and disadvantages of online learning compared to traditional classrooms.",
        points: 10
      }
    ]
  },
  writing: {
    A1: [
      {
        type: 'short_answer',
        question_text: "Write a short paragraph (30-50 words) about your favorite hobby.",
        points: 5
      }
    ],
    B2: [
      {
        type: 'essay',
        question_text: "Write an essay (150-200 words) expressing your opinion on environmental protection.",
        points: 15
      }
    ]
  }
};

export function generateQuestions(options: {
  topic: string;
  skill: QuestionSkill | 'all';
  level: string;
  count: number;
}): GeneratedQuestion[] {
  const { topic, skill, level, count } = options;
  const results: GeneratedQuestion[] = [];
  
  // Flatten templates based on skill and level
  let availableTemplates: GeneratedQuestion[] = [];
  
  const skillsToSearch: QuestionSkill[] = skill === 'all' 
    ? ['general', 'reading', 'listening', 'speaking', 'writing'] 
    : [skill];
    
  // Simple CEFR mapping
  const targetLevel = level.toUpperCase(); // e.g., 'A1'
  
  skillsToSearch.forEach(s => {
    const levelTemplates = (TEMPLATES[s]?.[targetLevel] || []).map(t => ({ ...t, skill: s }));
    availableTemplates = [...availableTemplates, ...levelTemplates];
    
    // If no templates for specific level, fallback to nearest or general
    if (levelTemplates.length === 0) {
      const generalTemplates = (TEMPLATES[s]?.['A1'] || []).map(t => ({ ...t, skill: s }));
      availableTemplates = [...availableTemplates, ...generalTemplates];
    }
  });

  // Shuffle and pick
  const shuffled = [...availableTemplates].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.max(1, count));

  // Personalize with topic
  return selected.map(q => {
    let text = q.question_text;
    if (topic && topic.trim().length > 0) {
      // Very simple replacement or prefixing for "AI" feel
      if (text.includes("hobby") || text.includes("hobby")) {
        text = text.replace("hobby", topic);
      } else if (text.includes("picture") || text.includes("picture")) {
        // keep picture as is
      } else {
        text = `${topic}: ${text}`;
      }
    }
    
    return {
      ...q,
      question_text: text,
      image_url: q.hasImageSuggestion && q.imageSuggestion 
        ? `https://loremflickr.com/640/480/${encodeURIComponent(q.imageSuggestion.split(' ').slice(-2).join(','))},exam/all`
        : undefined
    };
  });
}
