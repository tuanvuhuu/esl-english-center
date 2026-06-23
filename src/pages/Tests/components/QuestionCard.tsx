import React from 'react';
import { Icon } from '../../../components/common/Icon';
import { Button } from '../../../components/common/Button';
import type { DbTestQuestion } from '../../../types/database';

interface QuestionCardProps {
  question: DbTestQuestion;
  index: number;
  onEdit?: (q: DbTestQuestion) => void;
  onDelete?: (id: string) => void;
  onSaveToBank?: (id: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  onEdit,
  onDelete,
  onSaveToBank,
  isSelected = false,
  onToggleSelect,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
}) => {
  const getSkillBadgeInfo = (skill: string) => {
    const v = (skill || 'general').toLowerCase();
    switch (v) {
      case 'reading':
        return { text: 'READING', background: '#dbeafe', color: '#1e40af' };
      case 'listening':
        return { text: 'LISTENING', background: '#f3e8ff', color: '#6b21a8' };
      case 'speaking':
        return { text: 'SPEAKING', background: '#fef2f2', color: '#991b1b' };
      case 'writing':
        return { text: 'WRITING', background: '#d1fae5', color: '#065f46' };
      case 'grammar':
        return { text: 'GRAMMAR', background: '#ffedd5', color: '#9a3412' };
      case 'vocabulary':
        return { text: 'VOCABULARY', background: '#fef9c3', color: '#854d0e' };
      case 'general':
      default:
        return { text: 'TỔNG HỢP', background: '#f1f5f9', color: '#334155' };
    }
  };

  const getTypeBadgeInfo = (type: string) => {
    switch (type) {
      case 'mcq': return { text: 'TRẮC NGHIỆM', background: '#e0f2fe', color: '#0284c7' };
      case 'true_false': return { text: 'ĐÚNG/SAI', background: '#e0f2fe', color: '#0284c7' };
      case 'fill_blank': return { text: 'ĐIỀN TỪ', background: '#e0f2fe', color: '#0284c7' };
      case 'short_answer': return { text: 'ĐÁP ÁN NGẮN', background: '#e0f2fe', color: '#0284c7' };
      case 'essay': return { text: 'TỰ LUẬN', background: '#e0f2fe', color: '#0284c7' };
      case 'speaking_prompt': return { text: 'NÓI', background: '#e0f2fe', color: '#0284c7' };
      default: return { text: type.toUpperCase(), background: '#e0f2fe', color: '#0284c7' };
    }
  };

  const skillBadgeInfo = getSkillBadgeInfo(question.skill);
  const typeBadgeInfo = getTypeBadgeInfo(question.type);

  return (
    <div style={{
      background: 'var(--card)',
      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
      boxShadow: isSelected ? '0 0 0 1px var(--primary)' : '0 2px 8px rgba(0,0,0,0.01)',
      borderRadius: 16,
      padding: 24,
      marginBottom: 16,
      transition: 'all 0.2s',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(question.id)}
              style={{
                width: 16,
                height: 16,
                cursor: 'pointer',
                accentColor: 'var(--primary)',
                marginRight: 4
              }}
            />
          )}
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: '#e0f2fe', color: '#0284c7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700
          }}>
            {index + 1}
          </div>
          <div style={{
            padding: '3px 8px', borderRadius: 6,
            background: typeBadgeInfo.background, color: typeBadgeInfo.color,
            fontSize: 11, fontWeight: 700
          }}>
            {typeBadgeInfo.text}
          </div>
          <div style={{
            padding: '3px 8px', borderRadius: 6,
            background: skillBadgeInfo.background, color: skillBadgeInfo.color,
            fontSize: 11, fontWeight: 700
          }}>
            {skillBadgeInfo.text}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            padding: '4px 8px', borderRadius: 6,
            background: '#f1f5f9', color: '#475569',
            fontSize: 11, fontWeight: 600
          }}>
            {question.points.toFixed(1)} điểm
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {!isFirst && onMoveUp && (
              <Button
                variant="ghost"
                size="sm"
                icon="chevron-up"
                title="Di chuyển lên"
                onClick={() => onMoveUp(index)}
                style={{ padding: '4px', minWidth: 'auto', height: 28, width: 28, color: '#64748b' }}
                children=""
              />
            )}
            {!isLast && onMoveDown && (
              <Button
                variant="ghost"
                size="sm"
                icon="chevron-down"
                title="Di chuyển xuống"
                onClick={() => onMoveDown(index)}
                style={{ padding: '4px', minWidth: 'auto', height: 28, width: 28, color: '#64748b' }}
                children=""
              />
            )}
            {onSaveToBank && (
              <Button 
                variant="ghost" 
                size="sm" 
                icon="book" 
                title="Lưu vào kho câu hỏi" 
                onClick={() => onSaveToBank(question.id)} 
                style={{ padding: '4px', minWidth: 'auto', height: 28, width: 28, color: '#64748b' }}
                children="" 
              />
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              icon="edit" 
              onClick={() => onEdit?.(question)} 
              style={{ padding: '4px', minWidth: 'auto', height: 28, width: 28, color: '#475569' }}
              children="" 
            />
            <Button 
              variant="ghost" 
              size="sm" 
              icon="trash" 
              style={{ padding: '4px', minWidth: 'auto', height: 28, width: 28, color: '#475569' }} 
              onClick={() => onDelete?.(question.id)} 
              children="" 
            />
          </div>
        </div>
      </div>

      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 16, lineHeight: 1.6 }}>
        {question.question_text}
      </div>

      {question.image_url && (
        <div style={{ 
          marginBottom: 16, borderRadius: 12, overflow: 'hidden', 
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {question.options.map((opt, i) => (
            <div key={opt.id} style={{
              padding: '12px 16px', borderRadius: 12,
              border: opt.is_correct ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
              background: opt.is_correct ? 'var(--primary-light)' : '#ffffff',
              fontSize: 13, color: opt.is_correct ? 'var(--primary)' : 'var(--text-2)',
              fontWeight: opt.is_correct ? 600 : 500,
              display: 'flex', alignItems: 'center', transition: 'all 0.15s',
              minHeight: 46
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: opt.is_correct ? 'var(--primary)' : '#f1f5f9',
                color: opt.is_correct ? '#fff' : '#475569',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, marginRight: 12, flexShrink: 0
              }}>
                {String.fromCharCode(65 + i)}
              </div>
              <span style={{ flex: 1, lineHeight: 1.4 }}>{opt.option_text}</span>
              {opt.is_correct && (
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: '1.5px solid var(--primary)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginLeft: 8, flexShrink: 0
                }}>
                  <Icon name="check" size={11} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
