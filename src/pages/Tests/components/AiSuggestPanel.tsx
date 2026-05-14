import React, { useState } from 'react';
import { Card, Input, Select, Button, Icon, Badge } from '../../../components';
import { generateQuestions, GeneratedQuestion } from '../questionGenerator';
import { generateQuestionsWithAi } from '../aiQuestionGenerator';
import { searchQuestionsOnline, WebSearchedQuestion } from '../webSearchQuestions';
import { getActiveProvider, hasAi } from '../../../lib/ai';
import { hasGeminiKey } from '../../../lib/gemini';
import { QuestionSkill } from '../../../types/database';

interface AiSuggestPanelProps {
  level: string;
  onAddSelected: (questions: GeneratedQuestion[]) => void;
}

export const AiSuggestPanel: React.FC<AiSuggestPanelProps> = ({ level, onAddSelected }) => {
  const [topic, setTopic] = useState('');
  const [skill, setSkill] = useState<QuestionSkill | 'all'>('all');
  const [count, setCount] = useState(5);
  const [suggestions, setSuggestions] = useState<(GeneratedQuestion & { source_url?: string; source_title?: string })[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingAi, setUsingAi] = useState<boolean>(false);
  const [mode, setMode] = useState<'generate' | 'search'>('generate');

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      let results: (GeneratedQuestion & { source_url?: string; source_title?: string })[]

      if (mode === 'search') {
        // Tìm từ internet bằng Gemini Search Grounding
        if (!hasGeminiKey()) {
          setError('Chế độ tìm internet cần Gemini API key.')
          setGenerating(false)
          return
        }
        try {
          results = await searchQuestionsOnline({ topic, skill, level, count })
          setUsingAi(true)
        } catch (e: any) {
          console.error('[Web Search]', e)
          setError(`Lỗi tìm kiếm: ${e?.message ?? 'unknown'}`)
          setGenerating(false)
          return
        }
      } else if (hasAi()) {
        try {
          results = await generateQuestionsWithAi({ topic, skill, level, count });
          setUsingAi(true)
        } catch (e: any) {
          console.warn('[AI] failed, fallback procedural:', e?.message)
          setError(`AI lỗi (${e?.message ?? 'unknown'}). Dùng generator nội bộ.`)
          results = generateQuestions({ topic, skill, level, count });
          setUsingAi(false)
        }
      } else {
        results = generateQuestions({ topic, skill, level, count });
        setUsingAi(false)
      }
      setSuggestions(results);
      setSelectedIndices(results.map((_, i) => i));
    } finally {
      setGenerating(false);
    }
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
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>Gợi ý bởi AI</div>
              {hasAi() && (
                <Badge variant="success" style={{ fontSize: 9 }}>
                  {getActiveProvider() === 'claude' ? 'Claude' : 'Gemini'} {usingAi && suggestions.length > 0 ? 'ON' : ''}
                </Badge>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {hasAi()
                ? `${getActiveProvider() === 'claude' ? 'Claude' : 'Gemini'} tạo câu hỏi cho mầm non & tiểu học`
                : 'Generator nội bộ — cấu hình API key để dùng AI thật'}
            </div>
          </div>
        </div>

        {/* Mode toggle: Generate vs Search internet */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 12, padding: 3, borderRadius: 10, background: 'var(--hover-bg)' }}>
          {([
            { id: 'generate', label: '🤖 AI tạo mới',    desc: 'AI tự sinh câu hỏi' },
            { id: 'search',   label: '🌐 Tìm internet', desc: 'Lấy từ đề thi online' },
          ] as const).map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                flex: 1, padding: '8px 10px',
                border: 'none', cursor: 'pointer',
                borderRadius: 8,
                background: mode === m.id ? 'var(--card)' : 'transparent',
                color: mode === m.id ? 'var(--primary)' : 'var(--text-3)',
                fontWeight: mode === m.id ? 700 : 500,
                fontSize: 12, transition: 'all 0.15s',
                boxShadow: mode === m.id ? 'var(--shadow-sm)' : 'none',
              }}
              title={m.desc}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            label={mode === 'search' ? 'Chủ đề cần tìm' : 'Chủ đề bài kiểm tra'}
            value={topic}
            onChange={setTopic}
            placeholder={mode === 'search'
              ? 'Vd: con vật, gia đình, màu sắc...'
              : 'Vd: Family, Environment, Hobbies...'}
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
            {generating
              ? (mode === 'search' ? '🔍 Đang tìm trên internet...' : `Đang gọi ${getActiveProvider() === 'claude' ? 'Claude' : 'Gemini'}...`)
              : (mode === 'search' ? '🌐 Tìm câu hỏi từ internet' : '🤖 Tạo câu hỏi gợi ý')}
          </Button>
          {error && (
            <div style={{
              fontSize: 11, color: 'var(--warning-dark)',
              padding: '6px 10px', borderRadius: 6,
              background: 'var(--warning-light)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Icon name="alert-circle" size={11} /> {error}
            </div>
          )}
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
                {(q as any).source_url && (
                  <a
                    href={(q as any).source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      marginTop: 6, fontSize: 10, color: 'var(--text-4)',
                      textDecoration: 'none',
                    }}
                  >
                    <Icon name="eye" size={10} />
                    Nguồn: {(q as any).source_title || new URL((q as any).source_url).hostname}
                  </a>
                )}
                {q.image_url && (
                  <div style={{
                    marginTop: 8, borderRadius: 6, overflow: 'hidden',
                    border: '1px solid var(--border)',
                    position: 'relative', minHeight: 100,
                    background: 'var(--hover-bg)',
                  }}>
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-4)', fontSize: 11,
                    }}>
                      Đang tạo ảnh AI...
                    </div>
                    <img
                      src={q.image_url}
                      alt="Preview"
                      loading="lazy"
                      style={{ width: '100%', height: 120, objectFit: 'cover', position: 'relative', zIndex: 1 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                )}
                {q.hasImageSuggestion && q.imageSuggestion && !q.image_url && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, marginTop: 6,
                    padding: '4px 8px', borderRadius: 6,
                    background: 'var(--primary-light)',
                    color: 'var(--primary)', fontSize: 10, fontWeight: 600,
                  }}>
                    <Icon name="image" size={11} />
                    <span>Gợi ý ảnh: <strong>{q.imageSuggestion}</strong></span>
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
