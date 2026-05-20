import React from 'react';
import { Icon, IconName } from '../../../components/common/Icon';
import { Button } from '../../../components/common/Button';
import type { DbTestQuestion } from '../../../types/database';

interface QuestionCardProps {
  question: DbTestQuestion;
  index: number;
  onEdit?: (q: DbTestQuestion) => void;
  onDelete?: (id: string) => void;
  onSaveToBank?: (id: string) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  onEdit,
  onDelete,
  onSaveToBank,
}) => {
  const getSkillIcon = (skill: string): IconName => {
    switch (skill) {
      case 'reading': return 'book';
      case 'listening': return 'bell';
      case 'speaking': return 'message';
      case 'writing': return 'edit';
      default: return 'alert-circle';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'mcq': return 'Trắc nghiệm';
      case 'true_false': return 'Đúng/Sai';
      case 'fill_blank': return 'Điền từ';
      case 'short_answer': return 'Trả lời ngắn';
      case 'essay': return 'Tự luận';
      case 'speaking_prompt': return 'Nói';
      default: return type;
    }
  };

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      transition: 'all 0.2s',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'var(--primary-light)', color: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700
          }}>
            {index + 1}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 4,
            background: 'var(--hover-bg)', fontSize: 11, fontWeight: 600, color: 'var(--text-3)'
          }}>
            <Icon name={getSkillIcon(question.skill)} size={12} />
            <span style={{ textTransform: 'capitalize' }}>{question.skill}</span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-4)' }}>•</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>{getTypeText(question.type)}</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {onSaveToBank && (
            <Button variant="ghost" size="sm" icon="book" title="Lưu vào kho câu hỏi" onClick={() => onSaveToBank(question.id)} children="" />
          )}
          <Button variant="ghost" size="sm" icon="edit" onClick={() => onEdit?.(question)} children="" />
          <Button variant="ghost" size="sm" icon="trash" style={{ color: '#ef4444' }} onClick={() => onDelete?.(question.id)} children="" />
        </div>
      </div>

      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 12, lineHeight: 1.5 }}>
        {question.question_text}
      </div>

      {question.image_url && (
        <div style={{ 
          marginBottom: 12, borderRadius: 8, overflow: 'hidden', 
          border: '1px solid var(--border)', background: '#fff',
          display: 'flex', justifyContent: 'center'
        }}>
          <img 
            src={question.image_url} 
            alt="Question Illustration" 
            style={{ width: '100%', maxHeight: 200, objectFit: 'contain', display: 'block' }} 
          />
        </div>
      )}

      {question.options && question.options.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {question.options.map((opt, i) => (
            <div key={opt.id} style={{
              padding: '8px 12px', borderRadius: 8,
              border: `1px solid ${opt.is_correct ? 'var(--primary)' : 'var(--border)'}`,
              background: opt.is_correct ? 'var(--primary-light)' : 'transparent',
              fontSize: 13, color: opt.is_correct ? 'var(--primary)' : 'var(--text-2)',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <span style={{ fontWeight: 700, fontSize: 11 }}>{String.fromCharCode(65 + i)}.</span>
              {opt.option_text}
              {opt.is_correct && <Icon name="check" size={12} style={{ marginLeft: 'auto' }} />}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, paddingTop: 12, borderTop: '1px dotted var(--border)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-4)' }}>
          {question.points} điểm
        </div>
      </div>
    </div>
  );
};
