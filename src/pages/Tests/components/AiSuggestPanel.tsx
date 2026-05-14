import React, { useState } from 'react';
import { Card, Input, Select, Button, Icon, Badge } from '../../../components';
import { generateQuestions, GeneratedQuestion } from '../questionGenerator';
import { QuestionSkill } from '../../../types/database';

interface AiSuggestPanelProps {
  level: string;
  onAddSelected: (questions: GeneratedQuestion[]) => void;
}

export const AiSuggestPanel: React.FC<AiSuggestPanelProps> = ({ level, onAddSelected }) => {
  const [topic, setTopic] = useState('');
  const [skill, setSkill] = useState<QuestionSkill | 'all'>('all');
  const [count, setCount] = useState(5);
  const [suggestions, setSuggestions] = useState<GeneratedQuestion[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    // Simulate AI thinking time
    setTimeout(() => {
      const results = generateQuestions({ topic, skill, level, count });
      setSuggestions(results);
      setSelectedIndices(results.map((_, i) => i)); // select all by default
      setGenerating(false);
    }, 800);
  };

  const toggleSelection = (idx: number) => {
    setSelectedIndices(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card style={{ padding: 16, background: 'var(--activity-warm)', border: '1px solid var(--primary-15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--primary), #FF9F1C)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
          }}>
            <Icon name="zap" size={18} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>Gợi ý bởi AI</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Tự động tạo câu hỏi theo chủ đề</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            label="Chủ đề bài kiểm tra"
            value={topic}
            onChange={setTopic}
            placeholder="Ví dụ: Family, Environment, Hobbies..."
            icon="tag"
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select
              label="Kỹ năng"
              value={skill}
              onChange={v => setSkill(v as QuestionSkill | 'all')}
              options={[
                { value: 'all', label: 'Tất cả' },
                { value: 'reading', label: 'Reading' },
                { value: 'listening', label: 'Listening' },
                { value: 'speaking', label: 'Speaking' },
                { value: 'writing', label: 'Writing' },
              ]}
            />
            <Select
              label="Số lượng"
              value={count}
              onChange={v => setCount(Number(v))}
              options={[
                { value: 3, label: '3 câu' },
                { value: 5, label: '5 câu' },
                { value: 10, label: '10 câu' },
              ]}
            />
          </div>
          <Button 
            onClick={handleGenerate} 
            loading={generating} 
            style={{ marginTop: 4, width: '100%', background: 'linear-gradient(135deg, var(--primary), #FF9F1C)' }}
          >
            Tạo câu hỏi gợi ý
          </Button>
        </div>
      </Card>

      {suggestions.length > 0 && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Kết quả gợi ý ({suggestions.length})</div>
            <Button 
              size="sm" 
              disabled={selectedIndices.length === 0}
              onClick={() => {
                onAddSelected(suggestions.filter((_, i) => selectedIndices.includes(i)));
                setSuggestions([]);
                setSelectedIndices([]);
              }}
            >
              Thêm {selectedIndices.length} câu đã chọn
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {suggestions.map((q, i) => (
              <div 
                key={i} 
                onClick={() => toggleSelection(i)}
                style={{
                  padding: 12, borderRadius: 10, border: '1px solid var(--border)',
                  background: selectedIndices.includes(i) ? 'var(--primary-light)' : 'var(--card)',
                  cursor: 'pointer', transition: 'all 0.15s',
                  position: 'relative'
                }}
              >
                <div style={{ position: 'absolute', top: 10, right: 10 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 5, 
                    border: `2px solid ${selectedIndices.includes(i) ? 'var(--primary)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: selectedIndices.includes(i) ? 'var(--primary)' : 'transparent'
                  }}>
                    {selectedIndices.includes(i) && <Icon name="check" size={12} color="#fff" />}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <Badge variant="outline" size="sm">{(q.skill || 'general').toUpperCase()}</Badge>
                  <span style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 600 }}>{(q.type || 'mcq').toUpperCase()}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', paddingRight: 24, lineHeight: 1.4 }}>
                  {q.question_text}
                </div>
                {q.image_url && (
                  <div style={{ marginTop: 8, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={q.image_url} alt="Preview" style={{ width: '100%', height: 100, objectFit: 'cover' }} />
                  </div>
                )}
                {q.hasImageSuggestion && !q.image_url && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, color: 'var(--primary)', fontSize: 10, fontWeight: 700 }}>
                    <Icon name="image" size={10} />
                    Gợi ý: Cần thêm hình ảnh
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
