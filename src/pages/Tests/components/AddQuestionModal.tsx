import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button } from '../../../components';
import type { DbTestQuestion, DbQuestionOption, QuestionType, QuestionSkill } from '../../../types/database';

interface AddQuestionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (question: Partial<DbTestQuestion>, options: Partial<DbQuestionOption>[]) => Promise<void>;
  editingQuestion?: DbTestQuestion | null;
  saving?: boolean;
}

export const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
  open,
  onClose,
  onSave,
  editingQuestion,
  saving
}) => {
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
    if (field === 'is_correct' && val === true) {
      // Single choice logic
      next.forEach((o, i) => o.is_correct = i === idx);
    } else {
      (next[idx] as any)[field] = val;
    }
    setOptions(next);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingQuestion ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}
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

        <Input
          label="Nội dung câu hỏi"
          value={text}
          onChange={setText}
          placeholder="Nhập nội dung câu hỏi..."
          required
        />

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

        {(type === 'mcq' || type === 'true_false') && (
          <div style={{ marginTop: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, display: 'block' }}>
              Các lựa chọn {type === 'mcq' ? '(Chọn 1 đáp án đúng)' : ''}
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {options.slice(0, type === 'true_false' ? 2 : 4).map((opt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input
                    type="radio"
                    name="correct-option"
                    checked={opt.is_correct}
                    onChange={() => updateOption(i, 'is_correct', true)}
                    style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <Input
                      value={opt.option_text || ''}
                      onChange={v => updateOption(i, 'option_text', v)}
                      placeholder={type === 'true_false' ? (i === 0 ? 'True' : 'False') : `Lựa chọn ${i + 1}...`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button 
            onClick={handleSave} 
            loading={saving}
            disabled={!text.trim() || ((type === 'mcq' || type === 'true_false') && !options.some(o => o.is_correct))}
          >
            Lưu câu hỏi
          </Button>
        </div>
      </div>
    </Modal>
  );
};
