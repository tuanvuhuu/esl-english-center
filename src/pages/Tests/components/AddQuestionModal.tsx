import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button, Icon, useToast } from '../../../components';
import type { DbTestQuestion, DbQuestionOption, QuestionType, QuestionSkill } from '../../../types/database';
import { hasAi } from '../../../lib/ai';
import { generateQuestions, detectPool } from '../questionGenerator';
import { generateSingleQuestionWithAi } from '../aiQuestionGenerator';

interface AddQuestionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (question: Partial<DbTestQuestion>, options: Partial<DbQuestionOption>[]) => Promise<void>;
  editingQuestion?: DbTestQuestion | null;
  saving?: boolean;
  level?: string;
  topic?: string;
}

interface AutofillQuestion {
  question_text: string;
  options: { option_text: string; is_correct: boolean; order_index: number }[];
  explanation: string;
  points: number;
}

const AUTOFILL_POOL: Record<string, AutofillQuestion[]> = {
  'reading_mcq': [
    {
      question_text: "Read the sentence and choose the word that best fits the blank:\n\"The company's new policy was designed to _______ employee productivity and satisfaction.\"",
      options: [
        { option_text: "boost", is_correct: true, order_index: 0 },
        { option_text: "hinder", is_correct: false, order_index: 1 },
        { option_text: "stabilize", is_correct: false, order_index: 2 },
        { option_text: "decline", is_correct: false, order_index: 3 }
      ],
      explanation: "'Boost' means to improve or increase, which fits the positive context of 'productivity and satisfaction'.",
      points: 1
    },
    {
      question_text: "Identify the tone of the author in the following passage:\n\"Despite facing numerous setbacks and a lack of funding, the research team persevered, driven by a deep conviction that their work would eventually save lives.\"",
      options: [
        { option_text: "Indifferent", is_correct: false, order_index: 0 },
        { option_text: "Skeptical", is_correct: false, order_index: 1 },
        { option_text: "Admiring", is_correct: true, order_index: 2 },
        { option_text: "Sarcastic", is_correct: false, order_index: 3 }
      ],
      explanation: "The author uses words like 'persevered' and 'deep conviction to save lives' to express admiration for the team.",
      points: 2
    }
  ],
  'listening_mcq': [
    {
      question_text: "Listen to the speaker's statement and select the best response:\n\"Would you mind helping me move these files to the third floor?\"",
      options: [
        { option_text: "Yes, I would mind that.", is_correct: false, order_index: 0 },
        { option_text: "Not at all, I'd be glad to help.", is_correct: true, order_index: 1 },
        { option_text: "No, I haven't seen them.", is_correct: false, order_index: 2 },
        { option_text: "Yes, they are on the third floor.", is_correct: false, order_index: 3 }
      ],
      explanation: "'Not at all' is a polite way to agree to a request starting with 'Would you mind...'.",
      points: 1
    }
  ],
  'speaking_mcq': [
    {
      question_text: "Which of the following is the most appropriate way to greet a new business partner at a formal meeting?",
      options: [
        { option_text: "Hey! How's it going, buddy?", is_correct: false, order_index: 0 },
        { option_text: "It is a pleasure to meet you, Mr. Smith.", is_correct: true, order_index: 1 },
        { option_text: "What's up? Nice meeting you.", is_correct: false, order_index: 2 },
        { option_text: "Long time no see!", is_correct: false, order_index: 3 }
      ],
      explanation: "'It is a pleasure to meet you, [Name]' is standard and polite for a formal business introduction.",
      points: 1
    }
  ],
  'writing_mcq': [
    {
      question_text: "Choose the sentence that uses correct punctuation:",
      options: [
        { option_text: "Although she was tired; she finished her homework.", is_correct: false, order_index: 0 },
        { option_text: "Although she was tired, she finished her homework.", is_correct: true, order_index: 1 },
        { option_text: "Although she was tired she finished, her homework.", is_correct: false, order_index: 2 },
        { option_text: "Although, she was tired she finished her homework.", is_correct: false, order_index: 3 }
      ],
      explanation: "An introductory dependent clause ('Although she was tired') must be followed by a comma when it precedes an independent clause.",
      points: 1
    }
  ],
  'general_mcq': [
    {
      question_text: "Select the grammatically correct option to complete the sentence:\n\"By the time the train _______ at the station, we _______ for over two hours.\"",
      options: [
        { option_text: "arrived / had been waiting", is_correct: true, order_index: 0 },
        { option_text: "arrives / waited", is_correct: false, order_index: 1 },
        { option_text: "had arrived / were waiting", is_correct: false, order_index: 2 },
        { option_text: "arrived / have waited", is_correct: false, order_index: 3 }
      ],
      explanation: "We use the past perfect continuous ('had been waiting') for an action that was ongoing up to another action in the past ('arrived').",
      points: 1
    }
  ],
  'true_false': [
    {
      question_text: "In formal writing, it is acceptable to use contractions like 'can't', 'won't', and 'shouldn't'.",
      options: [
        { option_text: "True", is_correct: false, order_index: 0 },
        { option_text: "False", is_correct: true, order_index: 1 }
      ],
      explanation: "Formal writing generally avoids contractions and uses full forms ('cannot', 'will not', 'should not').",
      points: 1
    }
  ]
};

const getOfflineAutofillQuestion = (skill: QuestionSkill, type: QuestionType, level: string, topic?: string): AutofillQuestion => {
  // Offline: sử dụng bộ Smart Offline Generator của chúng ta
  // Ưu tiên sử dụng chủ đề được giáo viên cấu hình bên ngoài nếu có
  let selectedTopic = '';
  if (topic?.trim()) {
    const pool = detectPool(topic);
    selectedTopic = pool || topic.trim();
  } else {
    const topics = ['animals', 'colors', 'fruits', 'food', 'family', 'school', 'weather', 'body', 'clothes', 'numbers', 'rooms', 'jobs', 'transport'];
    selectedTopic = topics[Math.floor(Math.random() * topics.length)];
  }
  
  try {
    const offlineQuestions = generateQuestions({
      topic: selectedTopic,
      skill: skill,
      level: level,
      count: 10
    });

    // Tìm câu hỏi có type khớp
    const matchingQ = offlineQuestions.find(q => q.type === type);
    if (matchingQ) {
      return {
        question_text: matchingQ.question_text,
        options: (matchingQ.options || []).map((o, idx) => ({
          option_text: o.text,
          is_correct: o.isCorrect,
          order_index: idx
        })),
        explanation: matchingQ.explanation || '',
        points: matchingQ.points
      };
    }
  } catch (err) {
    console.error('[Offline Autofill] Smart generator failed:', err);
  }

  // Fallback cuối cùng nếu không tìm thấy câu hỏi khớp hoặc lỗi:
  // Lấy ngẫu nhiên từ pool tĩnh nhưng mở rộng thêm một số lựa chọn
  const staticPools: Record<string, AutofillQuestion[]> = {
    ...AUTOFILL_POOL,
    'true_false': [
      {
        question_text: "In the sentence 'She sings beautifully', the word 'beautifully' is an adjective.",
        options: [
          { option_text: "True", is_correct: false, order_index: 0 },
          { option_text: "False", is_correct: true, order_index: 1 }
        ],
        explanation: "'Beautifully' is an adverb because it modifies the verb 'sings'.",
        points: 1
      },
      {
        question_text: "The past simple form of 'go' is 'gone'.",
        options: [
          { option_text: "True", is_correct: false, order_index: 0 },
          { option_text: "False", is_correct: true, order_index: 1 }
        ],
        explanation: "The past simple form of 'go' is 'went'. 'Gone' is the past participle.",
        points: 1
      },
      {
        question_text: "Water boils at 100 degrees Celsius.",
        options: [
          { option_text: "True", is_correct: true, order_index: 0 },
          { option_text: "False", is_correct: false, order_index: 1 }
        ],
        explanation: "Yes, water boils at 100°C under normal atmospheric pressure.",
        points: 1
      }
    ],
    'fill_blank': [
      {
        question_text: "He is interested _______ learning new languages, especially Japanese.",
        options: [],
        explanation: "We use 'interested in' to talk about hobbies or attention.",
        points: 1
      },
      {
        question_text: "She has been working here _______ three years.",
        options: [],
        explanation: "We use 'for' for duration of time ('three years').",
        points: 1
      },
      {
        question_text: "Please turn _______ the light before you leave the classroom.",
        options: [],
        explanation: "We use 'turn off' to switch off electrical devices.",
        points: 1
      }
    ],
    'short_answer': [
      {
        question_text: "What is the past participle form of the irregular verb 'WRITE'?",
        options: [],
        explanation: "The verb forms are: write - wrote - written.",
        points: 1
      },
      {
        question_text: "What is the opposite of the adjective 'generous'?",
        options: [],
        explanation: "The opposite of 'generous' is 'stingy' or 'mean'.",
        points: 1
      },
      {
        question_text: "Write the plural form of the word 'child'.",
        options: [],
        explanation: "The plural of 'child' is 'children'.",
        points: 1
      }
    ],
    'essay': [
      {
        question_text: "Write a short paragraph (80-120 words) describing your last weekend holiday.",
        options: [],
        explanation: "Should describe activities, who you went with, and your feelings using the past simple tense.",
        points: 5
      },
      {
        question_text: "Write a short essay (150-200 words) about the advantages and disadvantages of studying online.",
        options: [],
        explanation: "Should include flexible schedule vs. lack of social interaction.",
        points: 5
      }
    ],
    'speaking_prompt': [
      {
        question_text: "Talk about your favorite hobby. Explain why you enjoy it and when you started it.",
        options: [],
        explanation: "Should speak clearly, using relevant vocabulary for 1-2 minutes.",
        points: 5
      },
      {
        question_text: "Talk about your family. How many people are there and what do they do?",
        options: [],
        explanation: "Introduce family members, their jobs/ages, and a favorite shared activity.",
        points: 5
      }
    ]
  };

  const key = `${skill}_mcq`;
  const staticList = staticPools[type] || staticPools[key] || staticPools['general_mcq'] || [];
  if (staticList.length > 0) {
    const randomIndex = Math.floor(Math.random() * staticList.length);
    return staticList[randomIndex];
  }

  // Safe fallback
  return {
    question_text: "This is a sample question.",
    options: [],
    explanation: "",
    points: 1
  };
};

export const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
  open,
  onClose,
  onSave,
  editingQuestion,
  saving,
  level = 'A1',
  topic = ''
}) => {
  const toast = useToast();
  const [skill, setSkill] = useState<QuestionSkill>('general');
  const [type, setType] = useState<QuestionType>('mcq');
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [points, setPoints] = useState(1);
  const [explanation, setExplanation] = useState('');
  const [options, setOptions] = useState<Partial<DbQuestionOption>[]>([
    { option_text: '', is_correct: false, order_index: 0 },
    { option_text: '', is_correct: false, order_index: 1 },
    { option_text: '', is_correct: false, order_index: 2 },
    { option_text: '', is_correct: false, order_index: 3 },
  ]);

  useEffect(() => {
    if (editingQuestion) {
      setSkill(editingQuestion.skill);
      setType(editingQuestion.type);
      setText(editingQuestion.question_text);
      setImageUrl(editingQuestion.image_url || '');
      setPoints(editingQuestion.points);
      setExplanation(editingQuestion.explanation || '');
      if (editingQuestion.options && editingQuestion.options.length > 0) {
        setOptions(editingQuestion.options.map(o => ({ ...o })));
      }
    } else {
      setSkill('general');
      setType('mcq');
      setText('');
      setImageUrl('');
      setPoints(1);
      setExplanation('');
      setOptions([
        { option_text: '', is_correct: false, order_index: 0 },
        { option_text: '', is_correct: false, order_index: 1 },
        { option_text: '', is_correct: false, order_index: 2 },
        { option_text: '', is_correct: false, order_index: 3 },
      ]);
    }
  }, [editingQuestion, open]);

  const handleSave = () => {
    const payload: Partial<DbTestQuestion> = {
      skill, type,
      question_text: text,
      image_url: imageUrl || null,
      points,
      explanation: explanation || null,
    };
    
    // Filter out empty options for non-MCQ/TF if needed, 
    // but for MCQ/TF they are required.
    const finalOptions = (type === 'mcq' || type === 'true_false') 
      ? options.filter(o => o.option_text?.trim()) 
      : [];

    onSave(payload, finalOptions);
  };

  const updateOption = (idx: number, field: keyof DbQuestionOption, val: any) => {
    const next = [...options];
    // Pad options if index doesn't exist
    while (next.length <= idx) {
      next.push({ option_text: '', is_correct: false, order_index: next.length });
    }
    if (field === 'is_correct' && val === true) {
      // Single choice logic
      next.forEach((o, i) => o.is_correct = i === idx);
    } else {
      (next[idx] as any)[field] = val;
    }
    setOptions(next);
  };

  const handleFormatText = (styleType: 'bold' | 'italic' | 'underline' | 'highlight') => {
    const textarea = document.getElementById('question-text-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = text.substring(start, end);
    
    let replacement = '';
    switch (styleType) {
      case 'bold':
        replacement = `**${selectedText}**`;
        break;
      case 'italic':
        replacement = `*${selectedText}*`;
        break;
      case 'underline':
        replacement = `<u>${selectedText}</u>`;
        break;
      case 'highlight':
        replacement = `<mark>${selectedText}</mark>`;
        break;
      default:
        return;
    }

    const newText = text.substring(0, start) + replacement + text.substring(end);
    setText(newText);

    // Focus and select back the modified text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + replacement.length);
    }, 0);
  };

  const handleAiAutofill = async () => {
    toast.success('AI đang tự động tạo câu hỏi...');
    
    try {
      let autofillData: AutofillQuestion;

      if (hasAi()) {
        try {
          const q = await generateSingleQuestionWithAi({ skill, type, level, topic });
          autofillData = {
            question_text: q.question_text,
            options: (q.options || []).map((o, idx) => ({
              option_text: o.text,
              is_correct: o.isCorrect,
              order_index: idx
            })),
            explanation: q.explanation || '',
            points: q.points
          };
        } catch (err) {
          console.warn('[Autofill AI] Failed online, fallback offline:', err);
          autofillData = getOfflineAutofillQuestion(skill, type, level, topic);
        }
      } else {
        autofillData = getOfflineAutofillQuestion(skill, type, level, topic);
      }

      setText(autofillData.question_text);
      setPoints(autofillData.points);
      setExplanation(autofillData.explanation);
      
      if (type === 'mcq' || type === 'true_false') {
        const baseOptions = autofillData.options;
        const newOptions: Partial<DbQuestionOption>[] = [];
        baseOptions.forEach((bo, i) => {
          newOptions.push({
            option_text: bo.option_text,
            is_correct: bo.is_correct,
            order_index: i
          });
        });
        
        if (type === 'true_false') {
          setOptions(newOptions.slice(0, 2));
        } else {
          setOptions(newOptions.slice(0, 4));
        }
      } else {
        setOptions([]);
      }
      toast.success('Đã điền câu hỏi mẫu thành công!');
    } catch (err: any) {
      console.error('[Autofill error]', err);
      toast.error('Có lỗi xảy ra khi tự động điền câu hỏi.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'var(--primary-light)', color: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Icon name={editingQuestion ? "edit" : "plus-circle"} size={16} />
          </div>
          <span>{editingQuestion ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}</span>
        </div>
      }
      width={600}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Select
            label="Kỹ năng"
            value={skill}
            onChange={v => setSkill(v as QuestionSkill)}
            options={[
              { value: 'general', label: 'Tổng hợp' },
              { value: 'reading', label: 'Reading' },
              { value: 'listening', label: 'Listening' },
              { value: 'speaking', label: 'Speaking' },
              { value: 'writing', label: 'Writing' },
            ]}
          />
          <Select
            label="Loại câu hỏi"
            value={type}
            onChange={v => setType(v as QuestionType)}
            options={[
              { value: 'mcq', label: 'Trắc nghiệm' },
              { value: 'true_false', label: 'Đúng/Sai' },
              { value: 'fill_blank', label: 'Điền từ' },
              { value: 'short_answer', label: 'Trả lời ngắn' },
              { value: 'essay', label: 'Tự luận' },
              { value: 'speaking_prompt', label: 'Nói' },
            ]}
          />
        </div>

        {/* Textarea for question text with premium formatting bar and AI autofill button */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
              Nội dung câu hỏi <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div 
              onClick={handleAiAutofill}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--primary)',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              <Icon name="zap" size={14} />
              Tự động điền bằng AI
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: '#f8fafc',
            border: '1.5px solid var(--border)',
            borderBottom: 'none',
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            padding: '8px 12px',
          }}>
            <button
              type="button"
              onClick={() => handleFormatText('bold')}
              title="Chữ đậm"
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '4px 6px', borderRadius: 4, display: 'flex', alignItems: 'center',
                color: '#475569', fontWeight: 'bold', fontSize: 13
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              B
            </button>
            <button
              type="button"
              onClick={() => handleFormatText('italic')}
              title="Chữ nghiêng"
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '4px 6px', borderRadius: 4, display: 'flex', alignItems: 'center',
                color: '#475569', fontStyle: 'italic', fontSize: 13
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              I
            </button>
            <button
              type="button"
              onClick={() => handleFormatText('underline')}
              title="Gạch chân"
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '4px 6px', borderRadius: 4, display: 'flex', alignItems: 'center',
                color: '#475569', textDecoration: 'underline', fontSize: 13
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              U
            </button>
            <button
              type="button"
              onClick={() => handleFormatText('highlight')}
              title="Làm nổi bật"
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '4px 6px', borderRadius: 4, display: 'flex', alignItems: 'center',
                color: '#475569'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <Icon name="edit" size={13} />
            </button>
          </div>

          <textarea
            id="question-text-textarea"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Nhập nội dung câu hỏi..."
            style={{
              width: '100%',
              minHeight: 120,
              padding: 12,
              border: '1.5px solid var(--border)',
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
              fontSize: 13,
              fontFamily: 'var(--font)',
              lineHeight: 1.6,
              color: 'var(--text-1)',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              background: 'var(--input-bg)',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--primary)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
          />
        </div>

        <Input
          label="URL Hình ảnh (nếu có)"
          value={imageUrl}
          onChange={setImageUrl}
          placeholder="https://..."
          icon="image"
        />

        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 16 }}>
          <Input
            label="Điểm số"
            type="number"
            value={points}
            onChange={v => setPoints(Number(v))}
          />
          <Input
            label="Giải thích (không bắt buộc)"
            value={explanation}
            onChange={setExplanation}
            placeholder="Tại sao đáp án này đúng..."
          />
        </div>

        {/* Custom premium multiple choice options builder */}
        {(type === 'mcq' || type === 'true_false') && (
          <div style={{ marginTop: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, display: 'block' }}>
              Các lựa chọn {type === 'mcq' ? '(Chọn 1 đáp án đúng)' : ''}
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {options.slice(0, type === 'true_false' ? 2 : 4).map((opt, i) => (
                <div key={i} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12,
                  background: '#f8fafc',
                  padding: '8px 12px',
                  borderRadius: 12,
                  border: opt.is_correct ? '1.5px solid var(--primary)' : '1.5px solid #e2e8f0',
                  transition: 'all 0.15s ease'
                }}>
                  {/* Custom radio indicator */}
                  <div 
                    onClick={() => updateOption(i, 'is_correct', true)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: opt.is_correct ? '6px solid var(--primary)' : '2px solid #cbd5e1',
                      background: '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      flexShrink: 0
                    }}
                    title="Chọn làm đáp án đúng"
                  />
                  
                  {/* Circular index letter */}
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: opt.is_correct ? 'var(--primary)' : '#e2e8f0',
                    color: opt.is_correct ? '#fff' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <Input
                      value={opt.option_text || ''}
                      onChange={v => updateOption(i, 'option_text', v)}
                      placeholder={type === 'true_false' ? (i === 0 ? 'True' : 'False') : `Nhập nội dung lựa chọn ${String.fromCharCode(65 + i)}...`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Refactored premium styled buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
          <Button variant="outline" size="lg" onClick={onClose} style={{ minWidth: 100 }}>
            Hủy
          </Button>
          <Button 
            variant="primary"
            size="lg"
            onClick={handleSave} 
            loading={saving}
            disabled={!text.trim() || ((type === 'mcq' || type === 'true_false') && !options.some(o => o.is_correct))}
            style={{ minWidth: 120 }}
          >
            Lưu câu hỏi
          </Button>
        </div>
      </div>
    </Modal>
  );
};
