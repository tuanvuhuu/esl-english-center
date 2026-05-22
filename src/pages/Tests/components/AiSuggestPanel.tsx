import React, { useState } from 'react';
import { Card, Input, Select, Button, Icon, Badge } from '../../../components';
import { generateQuestions, GeneratedQuestion } from '../questionGenerator';
import { generateQuestionsWithAi } from '../aiQuestionGenerator';
import { searchQuestionsOnline } from '../webSearchQuestions';
import { hasAi } from '../../../lib/ai';
import { hasGeminiKey } from '../../../lib/gemini';
import { QuestionSkill, QuestionType } from '../../../types/database';
import { getVocabulary, fetchTriviaQuestions } from '../../../services';
import { generateQuestionsFromVocab } from '../vocabGenerator';

interface AiSuggestPanelProps {
  topic: string;
  onTopicChange: (topic: string) => void;
  level: string;
  onLevelChange: (level: string) => void;
  onAddSelected: (questions: GeneratedQuestion[]) => void;
  onOpenManageVocab?: () => void;
}

export const AiSuggestPanel: React.FC<AiSuggestPanelProps> = ({
  topic,
  onTopicChange,
  level,
  onLevelChange,
  onAddSelected,
  onOpenManageVocab,
}) => {
  const [skill, setSkill] = useState<QuestionSkill | 'all'>('all');
  const [type, setType] = useState<QuestionType | 'all'>('all');
  const [count, setCount] = useState(5);
  const [skillPoints, setSkillPoints] = useState<Record<QuestionSkill, number>>({
    general: 1,
    reading: 1,
    listening: 1,
    speaking: 5,
    writing: 5,
  });
  const [showPointsConfig, setShowPointsConfig] = useState(false);
  const [suggestions, setSuggestions] = useState<(GeneratedQuestion & { source_url?: string; source_title?: string })[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'generate' | 'search' | 'vocab' | 'trivia'>('generate');
  const [vocabType, setVocabType] = useState<'all' | 'mcq' | 'true_false' | 'fill_blank' | 'spelling'>('all');
  const [triviaDifficulty, setTriviaDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      let results: (GeneratedQuestion & { source_url?: string; source_title?: string })[]

      if (mode === 'search') {
        // Tìm từ internet bằng Gemini Search Grounding
        if (!hasGeminiKey()) {
          setError('Chế độ tìm internet chưa được cấu hình API key hệ thống.')
          setGenerating(false)
          return
        }
        try {
          results = await searchQuestionsOnline({ topic, skill, level, count, type, skillPoints })
        } catch (e: any) {
          console.error('[Web Search]', e)
          setError(`Lỗi tìm kiếm: ${e?.message ?? 'Không thể kết nối Internet.'}`)
          setGenerating(false)
          return
        }
      } else if (mode === 'vocab') {
        try {
          const allWords = await getVocabulary();
          const selectedWords = allWords.filter(
            w => w.cefr_level.toUpperCase() === level.toUpperCase()
          );

          if (selectedWords.length === 0) {
            setError(`Không có từ vựng nào thuộc cấp độ ${level} trong cơ sở dữ liệu. Nhấp 'Quản lý từ vựng' để nạp dữ liệu mẫu.`);
            setGenerating(false);
            return;
          }

          results = generateQuestionsFromVocab(selectedWords, allWords, count, vocabType, skillPoints);
        } catch (e: any) {
          console.error('[Vocab Generate]', e);
          setError(`Lỗi tạo câu hỏi từ vựng: ${e?.message ?? 'Không thể sinh câu hỏi.'}`);
          setGenerating(false);
          return;
        }
      } else if (mode === 'trivia') {
        try {
          results = await fetchTriviaQuestions({ count, difficulty: triviaDifficulty, skillPoints });
        } catch (e: any) {
          console.error('[Trivia DB]', e);
          setError(`Lỗi lấy câu hỏi Trivia: ${e?.message ?? 'Không thể kết nối dịch vụ.'}`);
          setGenerating(false);
          return;
        }
      } else if (hasAi()) {
        try {
          results = await generateQuestionsWithAi({ topic, skill, level, count, type, skillPoints });
        } catch (e: any) {
          console.warn('[AI] failed, fallback procedural:', e?.message)
          // Tự động chuyển đổi sang bộ sinh offline mà không hiển thị lỗi đỏ gây hoang mang
          results = generateQuestions({ topic, skill, level, count, type, skillPoints });
        }
      } else {
        results = generateQuestions({ topic, skill, level, count, type, skillPoints });
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
      <Card style={{ padding: 16, background: '#ffffff', border: '1px solid var(--border)', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            flexShrink: 0
          }}>
            <Icon name="zap" size={16} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>AI Suggestion</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#22c55e' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              AI IS READY
            </div>
          </div>
        </div>

        {/* Mode toggle: Generate vs Search internet vs Vocab vs Trivia */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 12, padding: 4, borderRadius: 10, background: '#f1f5f9' }}>
          {([
            { id: 'generate', label: 'AI tạo mới', icon: 'zap',   desc: 'AI tự sinh câu hỏi' },
            { id: 'search',   label: 'Tìm internet', icon: 'search', desc: 'Lấy từ đề thi online' },
            { id: 'vocab',    label: 'Từ CEFR', icon: 'book',  desc: 'Sinh từ kho từ vựng' },
            { id: 'trivia',   label: 'Open Trivia', icon: 'info', desc: 'Lấy quiz Trivia bên ngoài' },
          ] as const).map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                padding: '6px 8px',
                border: 'none', cursor: 'pointer',
                borderRadius: 8,
                background: mode === m.id ? '#ffffff' : 'transparent',
                color: mode === m.id ? '#0f172a' : '#64748b',
                fontWeight: mode === m.id ? 700 : 600,
                fontSize: 12, transition: 'all 0.15s',
                boxShadow: mode === m.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
              title={m.desc}
            >
              <Icon name={m.icon as any} size={13} style={{ color: mode === m.id ? '#0f172a' : '#64748b' }} />
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Inputs for Generate / Search modes */}
          {(mode === 'generate' || mode === 'search') && (
            <>
              <Input
                label={mode === 'search' ? 'Chủ đề cần tìm' : 'Chủ đề bài kiểm tra'}
                value={topic}
                onChange={onTopicChange}
                placeholder={mode === 'search'
                  ? 'Vd: con vật, gia đình, màu sắc...'
                  : 'Vd: English Grammar Essentials'}
                icon="tag"
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Select
                  label="Trình độ"
                  value={level}
                  onChange={onLevelChange}
                  options={[
                    { value: 'Starter', label: 'Starter' },
                    { value: 'Mover', label: 'Mover' },
                    { value: 'Flyer', label: 'Flyer' },
                    { value: 'A1', label: 'A1' },
                    { value: 'A2', label: 'A2' },
                    { value: 'B1', label: 'B1' },
                    { value: 'B2', label: 'B2' },
                  ]}
                />
                <Select
                  label="Kỹ năng"
                  value={skill}
                  onChange={v => setSkill(v as QuestionSkill | 'all')}
                  options={[
                    { value: 'all', label: 'Tất cả' },
                    { value: 'general', label: 'Grammar' },
                    { value: 'reading', label: 'Reading' },
                    { value: 'listening', label: 'Listening' },
                    { value: 'speaking', label: 'Speaking' },
                    { value: 'writing', label: 'Writing' },
                  ]}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Select
                  label="Loại đáp án"
                  value={type}
                  onChange={v => setType(v as QuestionType | 'all')}
                  options={[
                    { value: 'all', label: 'Tất cả' },
                    { value: 'mcq', label: 'Trắc nghiệm' },
                    { value: 'true_false', label: 'Đúng/Sai' },
                    { value: 'fill_blank', label: 'Điền từ' },
                    { value: 'short_answer', label: 'Trả lời ngắn' },
                    { value: 'essay', label: 'Tự luận' },
                    { value: 'speaking_prompt', label: 'Nói' },
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
            </>
          )}

          {/* Inputs for Vocab mode */}
          {mode === 'vocab' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Select
                  label="Trình độ"
                  value={level}
                  onChange={onLevelChange}
                  options={[
                    { value: 'A1', label: 'A1' },
                    { value: 'A2', label: 'A2' },
                    { value: 'B1', label: 'B1' },
                    { value: 'B2', label: 'B2' },
                    { value: 'C1', label: 'C1' },
                    { value: 'C2', label: 'C2' },
                  ]}
                />
                <Select
                  label="Loại câu hỏi"
                  value={vocabType}
                  onChange={v => setVocabType(v as any)}
                  options={[
                    { value: 'all', label: 'Tất cả' },
                    { value: 'mcq', label: 'Trắc nghiệm chọn nghĩa' },
                    { value: 'true_false', label: 'Đúng/Sai định nghĩa' },
                    { value: 'fill_blank', label: 'Điền từ vào ví dụ' },
                    { value: 'spelling', label: 'Sắp xếp chữ cái' },
                  ]}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'end' }}>
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
                {onOpenManageVocab && (
                  <Button
                    variant="outline"
                    icon="settings"
                    onClick={onOpenManageVocab}
                    style={{
                      height: 38,
                      borderColor: 'var(--primary)',
                      color: 'var(--primary)',
                      background: '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    Quản lý từ vựng
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Inputs for Trivia mode */}
          {mode === 'trivia' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Select
                label="Độ khó"
                value={triviaDifficulty}
                onChange={v => setTriviaDifficulty(v as any)}
                options={[
                  { value: 'all', label: 'Tất cả' },
                  { value: 'easy', label: 'Dễ (Easy)' },
                  { value: 'medium', label: 'Trung bình (Medium)' },
                  { value: 'hard', label: 'Khó (Hard)' },
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
          )}

          {/* Points config button */}
          {(mode === 'generate' || mode === 'search') && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -4 }}>
              <button
                type="button"
                onClick={() => setShowPointsConfig(!showPointsConfig)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, color: 'var(--primary)', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 4, padding: 0
                }}
              >
                <Icon name="settings" size={11} style={{ color: 'var(--primary)' }} />
                {showPointsConfig ? 'Ẩn cài đặt điểm số' : 'Cấu hình điểm số kỹ năng'}
              </button>
            </div>
          )}

          {showPointsConfig && (mode === 'generate' || mode === 'search') && (
            <div style={{
              padding: 12, background: '#f8fafc', borderRadius: 8,
              border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 8,
              animation: 'fadeIn 0.2s ease'
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                Cài đặt điểm số mặc định cho từng kỹ năng:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Select
                  label="Reading"
                  value={skillPoints.reading}
                  onChange={v => setSkillPoints(prev => ({ ...prev, reading: Number(v) }))}
                  options={[
                    { value: 1, label: '1 điểm' },
                    { value: 2, label: '2 điểm' },
                    { value: 5, label: '5 điểm' },
                    { value: 10, label: '10 điểm' },
                  ]}
                />
                <Select
                  label="Listening"
                  value={skillPoints.listening}
                  onChange={v => setSkillPoints(prev => ({ ...prev, listening: Number(v) }))}
                  options={[
                    { value: 1, label: '1 điểm' },
                    { value: 2, label: '2 điểm' },
                    { value: 5, label: '5 điểm' },
                    { value: 10, label: '10 điểm' },
                  ]}
                />
                <Select
                  label="Speaking"
                  value={skillPoints.speaking}
                  onChange={v => setSkillPoints(prev => ({ ...prev, speaking: Number(v) }))}
                  options={[
                    { value: 1, label: '1 điểm' },
                    { value: 2, label: '2 điểm' },
                    { value: 5, label: '5 điểm' },
                    { value: 10, label: '10 điểm' },
                  ]}
                />
                <Select
                  label="Writing"
                  value={skillPoints.writing}
                  onChange={v => setSkillPoints(prev => ({ ...prev, writing: Number(v) }))}
                  options={[
                    { value: 1, label: '1 điểm' },
                    { value: 2, label: '2 điểm' },
                    { value: 5, label: '5 điểm' },
                    { value: 10, label: '10 điểm' },
                  ]}
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            loading={generating}
            style={{
              marginTop: 8,
              width: '100%',
              height: 40,
              background: 'var(--primary)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2,
              borderRadius: 10,
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            }}
          >
            {generating ? (
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                {mode === 'search'
                  ? 'Đang tìm kiếm...'
                  : mode === 'vocab'
                  ? 'Đang tạo câu hỏi từ vựng...'
                  : mode === 'trivia'
                  ? 'Đang tải câu hỏi Trivia...'
                  : 'Đang xử lý...'}
              </span>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
                  <Icon name="zap" size={14} />
                  Tạo câu hỏi gợi ý
                </div>
                <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: '1.5px', opacity: 0.7 }}>
                  AI MAGIC PROCESSING
                </div>
              </>
            )}
          </Button>

          {/* Tip callout */}
          <div style={{
            marginTop: 4,
            padding: '8px 12px',
            background: 'var(--primary-light)',
            border: '1px solid var(--border)',
            borderLeft: '4px solid var(--primary)',
            borderRadius: '4px 8px 8px 4px',
            fontSize: 11,
            color: 'var(--primary)',
            lineHeight: 1.5,
            fontWeight: 500
          }}>
            Gợi ý: Hãy nhập thêm chủ đề chi tiết để AI tạo câu hỏi sát hơn với đề cương của bạn.
          </div>

          {error && (
            <div style={{
              fontSize: 11, color: 'var(--warning-dark)',
              padding: '6px 10px', borderRadius: 6,
              background: 'var(--warning-light)',
              display: 'flex', alignItems: 'center', gap: 6,
              marginTop: 4
            }}>
              <Icon name="alert-circle" size={11} /> {error}
            </div>
          )}
        </div>
      </Card>

      {/* Library Banner at bottom */}
      <div style={{
        position: 'relative',
        height: 90,
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-end',
        background: 'url(/library_banner.png) center/cover no-repeat',
        border: '1px solid #e2e8f0',
        cursor: 'pointer',
        transition: 'transform 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(0deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.5) 60%, rgba(15, 23, 42, 0.1) 100%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, padding: 12, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Icon name="book" size={14} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>Thư viện 10,000+ câu hỏi</span>
          </div>
          <div style={{ fontSize: 10, opacity: 0.9, lineHeight: 1.4 }}>
            Đã lọc sẵn theo chuẩn chương trình học mới nhất.
          </div>
        </div>
      </div>

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
                  <Badge variant="info" style={{ fontSize: 10, padding: '2px 6px' }}>{(q.skill || 'general').toUpperCase()}</Badge>
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
