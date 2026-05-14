import React, { useState, useEffect } from 'react';
import { Modal, Button, LoadingSpinner, EmptyState, Icon, useToast } from '../../../components';
import { QuestionCard } from './QuestionCard';
import { AddQuestionModal } from './AddQuestionModal';
import { AiSuggestPanel } from './AiSuggestPanel';
import { ImportQuestionModal } from './ImportQuestionModal';
import { PdfUploadTab } from './PdfUploadTab';
import { QuestionBankModal } from './QuestionBankModal';
import { exportTestToPdf } from '../testExport';
import { saveQuestionToBank } from '../../../services/tests';
import { 
  getTestQuestions, 
  createTestQuestion, 
  updateTestQuestion, 
  softDeleteTestQuestion, 
  upsertQuestionOptions 
} from '../../../services/tests';
import type { DbTest, DbTestQuestion, DbQuestionOption } from '../../../types/database';
import type { GeneratedQuestion } from '../questionGenerator';
import type { ParsedQuestion } from '../smartParser';

interface QuestionBuilderModalProps {
  open: boolean;
  onClose: () => void;
  test: DbTest | null;
}

export const QuestionBuilderModal: React.FC<QuestionBuilderModalProps> = ({
  open,
  onClose,
  test
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'questions' | 'pdf'>('questions');
  const [currentTest, setCurrentTest] = useState<DbTest | null>(null);
  const [questions, setQuestions] = useState<DbTestQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<DbTestQuestion | null>(null);
  const [saving, setSaving] = useState(false);
  const [showBank, setShowBank] = useState(false);

  const loadQuestions = async () => {
    if (!test) return;
    setLoading(true);
    try {
      const data = await getTestQuestions(test.id);
      setQuestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && test) {
      setCurrentTest(test);
      loadQuestions();
    }
    if (!open) setActiveTab('questions');
  }, [open, test]);

  const handleSaveQuestion = async (payload: Partial<DbTestQuestion>, options: Partial<DbQuestionOption>[]) => {
    if (!test) return;
    setSaving(true);
    try {
      let q: DbTestQuestion;
      if (editingQuestion) {
        q = await updateTestQuestion(editingQuestion.id, payload);
      } else {
        q = await createTestQuestion({
          ...payload as any,
          test_id: test.id,
          order_index: questions.length
        });
      }

      if (options.length > 0) {
        await upsertQuestionOptions(q.id, options as any);
      }
      
      await loadQuestions();
      setShowAdd(false);
      setEditingQuestion(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      await softDeleteTestQuestion(id);
      await loadQuestions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAiQuestions = async (generated: GeneratedQuestion[]) => {
    if (!test) return;
    setLoading(true);
    try {
      for (const g of generated) {
        const q = await createTestQuestion({
          test_id: test.id,
          skill: g.skill,
          type: g.type,
          question_text: g.question_text,
          points: g.points,
          image_url: g.image_url || null,
          audio_url: null,
          order_index: questions.length,
          explanation: g.explanation || null
        });

        if (g.options && g.options.length > 0) {
          await upsertQuestionOptions(q.id, g.options.map((o, idx) => ({
            option_text: o.text,
            is_correct: o.isCorrect,
            order_index: idx
          })));
        }
      }
      await loadQuestions();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (parsed: ParsedQuestion[]) => {
    if (!test) return;
    setLoading(true);
    try {
      for (const p of parsed) {
        const q = await createTestQuestion({
          test_id: test.id,
          skill: p.skill,
          type: p.type,
          question_text: p.question_text,
          points: p.points,
          image_url: p.image_url || null,
          audio_url: null,
          order_index: questions.length,
          explanation: p.explanation || null
        });

        if (p.options && p.options.length > 0) {
          await upsertQuestionOptions(q.id, p.options.map((o, idx) => ({
            option_text: o.text,
            is_correct: o.isCorrect,
            order_index: idx
          })));
        }
      }
      await loadQuestions();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={test ? `Quản lý câu hỏi: ${test.name}` : "Quản lý câu hỏi"}
      width={1100}
      fullScreen={false}
    >
      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {([
          { id: 'questions', label: 'Xây dựng câu hỏi', icon: 'list' },
          { id: 'pdf',       label: 'File PDF',          icon: 'file-text' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px',
              fontSize: 13, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-3)',
              background: 'transparent',
              marginBottom: -1,
              transition: 'all 0.15s',
            }}
          >
            <Icon name={tab.icon} size={14} />
            {tab.label}
            {tab.id === 'pdf' && currentTest?.pdf_url && (
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--success)', display: 'inline-block',
              }} />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'pdf' && currentTest ? (
        <div style={{ height: '70vh' }}>
          <PdfUploadTab
            test={currentTest}
            onUpdate={url => setCurrentTest(prev => prev ? { ...prev, pdf_url: url } : prev)}
          />
        </div>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, height: '70vh' }}>
        {/* Left: Question List */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16, padding: '0 4px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
                Danh sách câu hỏi ({questions.length})
              </div>
              <div style={{
                fontSize: 12, fontWeight: 600, color: 'var(--primary)',
                background: 'var(--primary-light)', padding: '2px 10px', borderRadius: 20,
              }}>
                {totalPoints} / {test?.total_score || 0} điểm
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                size="sm"
                variant="outline"
                icon="download"
                onClick={() => test && exportTestToPdf({ test, questions: questions as any })}
              >
                In PDF
              </Button>
              <Button size="sm" variant="outline" icon="upload" onClick={() => setShowImport(true)}>
                Import
              </Button>
              <Button size="sm" variant="outline" icon="book" onClick={() => setShowBank(true)}>
                Từ kho
              </Button>
              <Button size="sm" icon="plus" onClick={() => { setEditingQuestion(null); setShowAdd(true); }}>
                Thêm câu hỏi
              </Button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 4px 16px' }}>
            {loading ? (
              <LoadingSpinner />
            ) : questions.length === 0 ? (
              <EmptyState 
                title="Chưa có câu hỏi nào" 
                desc="Hãy bắt đầu bằng cách thêm câu hỏi thủ công hoặc sử dụng gợi ý từ AI."
                icon="help-circle"
              />
            ) : (
              questions.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={i}
                  onEdit={(item) => { setEditingQuestion(item); setShowAdd(true); }}
                  onDelete={handleDeleteQuestion}
                  onSaveToBank={async (id) => {
                    try {
                      await saveQuestionToBank(id)
                      toast.success('Đã lưu vào kho câu hỏi.')
                    } catch (e: any) {
                      toast.error('Lỗi: ' + e.message)
                    }
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: AI Panel */}
        <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 24, overflowY: 'auto' }}>
          <AiSuggestPanel
            level={test?.class?.level || 'A1'}
            onAddSelected={handleAddAiQuestions}
          />
        </div>
      </div>
      )}

      <AddQuestionModal 
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={handleSaveQuestion}
        editingQuestion={editingQuestion}
        saving={saving}
      />

      <ImportQuestionModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
      />

      {test && (
        <QuestionBankModal
          open={showBank}
          onClose={() => setShowBank(false)}
          testId={test.id}
          startOrderIndex={questions.length}
          onAdded={loadQuestions}
        />
      )}
    </Modal>
  );
};
