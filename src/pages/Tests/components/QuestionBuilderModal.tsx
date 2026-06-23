import React, { useState, useEffect } from 'react';
import { Modal, Button, LoadingSpinner, EmptyState, Icon, useToast, useConfirm } from '../../../components';
import { QuestionCard } from './QuestionCard';
import { AddQuestionModal } from './AddQuestionModal';
import { AiSuggestPanel } from './AiSuggestPanel';
import { ImportQuestionModal } from './ImportQuestionModal';
import { PdfUploadTab } from './PdfUploadTab';
import { QuestionBankModal } from './QuestionBankModal';
import { ManageVocabularyModal } from './ManageVocabularyModal';
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
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<'questions' | 'pdf'>('questions');
  const [currentTest, setCurrentTest] = useState<DbTest | null>(null);
  const [questions, setQuestions] = useState<DbTestQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<DbTestQuestion | null>(null);
  const [saving, setSaving] = useState(false);
  const [showBank, setShowBank] = useState(false);
  const [showManageVocab, setShowManageVocab] = useState(false);
  const [globalTopic, setGlobalTopic] = useState('');
  const [globalLevel, setGlobalLevel] = useState('A1');

  // States for selection and batch operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchActionLoading, setBatchActionLoading] = useState(false);

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
      setSelectedIds([]);
      setGlobalTopic(test.name || '');
      setGlobalLevel(test.class?.level || 'A1');
    }
    if (!open) {
      setActiveTab('questions');
      setSelectedIds([]);
    }
  }, [open, test]);

  const handleSaveQuestion = async (payload: Partial<DbTestQuestion>, options: Partial<DbQuestionOption>[]) => {
    if (!test) return;
    setSaving(true);
    try {
      let q: DbTestQuestion;
      if (editingQuestion) {
        q = await updateTestQuestion(editingQuestion.id, payload);
      } else {
        const nextOrder = questions.length > 0 ? Math.max(...questions.map(q => q.order_index ?? 0)) + 1 : 0;
        q = await createTestQuestion({
          ...payload as any,
          test_id: test.id,
          order_index: nextOrder
        });
      }

      // Always call upsertQuestionOptions if there are options, or if we are editing an existing question (to clean up old options if type changed)
      if (options.length > 0 || editingQuestion) {
        await upsertQuestionOptions(q.id, options as any);
      }
      
      await loadQuestions();
      setShowAdd(false);
      setEditingQuestion(null);
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi lưu câu hỏi: ' + err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    const ok = await confirm({
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa câu hỏi này không?',
      confirmLabel: 'Xóa',
      cancelLabel: 'Hủy',
      variant: 'danger'
    });
    if (!ok) return;

    try {
      await softDeleteTestQuestion(id);
      setSelectedIds(prev => prev.filter(x => x !== id));
      await loadQuestions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAiQuestions = async (generated: GeneratedQuestion[]) => {
    if (!test) return;
    setLoading(true);
    try {
      let startIdx = questions.length > 0 ? Math.max(...questions.map(q => q.order_index ?? 0)) + 1 : 0;
      for (const g of generated) {
        const q = await createTestQuestion({
          test_id: test.id,
          skill: g.skill,
          type: g.type,
          question_text: g.question_text,
          points: g.points,
          image_url: g.image_url || null,
          audio_url: null,
          order_index: startIdx++,
          explanation: g.explanation || null
        } as any);

        if (g.options && g.options.length > 0) {
          await upsertQuestionOptions(q.id, g.options.map((o, idx) => ({
            option_text: o.text,
            is_correct: o.isCorrect,
            order_index: idx
          })));
        }
      }
      await loadQuestions();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi thêm câu hỏi AI: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (parsed: ParsedQuestion[]) => {
    if (!test) return;
    setLoading(true);
    try {
      let startIdx = questions.length > 0 ? Math.max(...questions.map(q => q.order_index ?? 0)) + 1 : 0;
      for (const p of parsed) {
        const q = await createTestQuestion({
          test_id: test.id,
          skill: p.skill,
          type: p.type,
          question_text: p.question_text,
          points: p.points,
          image_url: p.image_url || null,
          audio_url: null,
          order_index: startIdx++,
          explanation: p.explanation || null
        } as any);

        if (p.options && p.options.length > 0) {
          await upsertQuestionOptions(q.id, p.options.map((o, idx) => ({
            option_text: o.text,
            is_correct: o.isCorrect,
            order_index: idx
          })));
        }
      }
      await loadQuestions();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi import câu hỏi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reorder logic with optimistic update
  const handleReorderQuestion = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const updatedQuestions = [...questions];
    const currentQ = { ...updatedQuestions[index] };
    const targetQ = { ...updatedQuestions[targetIndex] };

    // Swap indexes
    currentQ.order_index = targetIndex;
    targetQ.order_index = index;

    updatedQuestions[index] = targetQ;
    updatedQuestions[targetIndex] = currentQ;

    setQuestions(updatedQuestions);

    try {
      await Promise.all([
        updateTestQuestion(currentQ.id, { order_index: currentQ.order_index }),
        updateTestQuestion(targetQ.id, { order_index: targetQ.order_index })
      ]);
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi cập nhật thứ tự câu hỏi: ' + err.message);
      await loadQuestions(); // rollback
    }
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === questions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(questions.map(q => q.id));
    }
  };

  // Batch actions
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    const ok = await confirm({
      title: 'Xác nhận xóa hàng loạt',
      message: `Bạn có chắc chắn muốn xóa ${selectedIds.length} câu hỏi đã chọn không? Hành động này không thể hoàn tác.`,
      confirmLabel: 'Xóa',
      cancelLabel: 'Hủy',
      variant: 'danger'
    });
    if (!ok) return;

    setBatchActionLoading(true);
    try {
      await Promise.all(selectedIds.map(id => softDeleteTestQuestion(id)));
      toast.success(`Đã xóa ${selectedIds.length} câu hỏi thành công.`);
      setSelectedIds([]);
      await loadQuestions();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi xóa hàng loạt: ' + err.message);
    } finally {
      setBatchActionLoading(false);
    }
  };

  const handleBatchSaveToBank = async () => {
    if (selectedIds.length === 0) return;
    setBatchActionLoading(true);
    try {
      await Promise.all(selectedIds.map(id => saveQuestionToBank(id)));
      toast.success(`Đã lưu ${selectedIds.length} câu hỏi vào kho thành công.`);
      setSelectedIds([]);
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi lưu vào kho hàng loạt: ' + err.message);
    } finally {
      setBatchActionLoading(false);
    }
  };

  const handleBatchUpdatePoints = async (points: number) => {
    if (selectedIds.length === 0) return;
    setBatchActionLoading(true);
    try {
      await Promise.all(selectedIds.map(id => updateTestQuestion(id, { points })));
      toast.success(`Đã cập nhật ${selectedIds.length} câu hỏi thành ${points} điểm.`);
      setSelectedIds([]);
      await loadQuestions();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi cập nhật điểm hàng loạt: ' + err.message);
    } finally {
      setBatchActionLoading(false);
    }
  };

  // Phân bổ đều điểm cho tất cả câu hỏi
  const handleAutoDistribute = async () => {
    if (!test || questions.length === 0) return;
    const pointsPerQ = Math.floor(test.total_score / questions.length);
    const remainder = test.total_score - (pointsPerQ * questions.length);
    
    setBatchActionLoading(true);
    try {
      await Promise.all(
        questions.map((q, i) => 
          updateTestQuestion(q.id, { 
            points: pointsPerQ + (i < remainder ? 1 : 0) // Phân bổ phần dư cho các câu đầu
          })
        )
      );
      toast.success(`Đã phân bổ đều ${test.total_score} điểm cho ${questions.length} câu hỏi.`);
      await loadQuestions();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi phân bổ điểm: ' + err.message);
    } finally {
      setBatchActionLoading(false);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  // Phân tích theo kỹ năng
  const skillBreakdown = questions.reduce((acc, q) => {
    const skill = q.skill || 'general';
    if (!acc[skill]) acc[skill] = { count: 0, points: 0 };
    acc[skill].count++;
    acc[skill].points += q.points;
    return acc;
  }, {} as Record<string, { count: number; points: number }>);

  const SKILL_LABELS: Record<string, string> = {
    reading: 'Đọc', listening: 'Nghe', speaking: 'Nói', writing: 'Viết', general: 'Tổng hợp'
  };
  const SKILL_COLORS: Record<string, string> = {
    reading: '#2563eb', listening: '#7c3aed', speaking: '#ea580c', writing: '#059669', general: '#64748b'
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Icon name="chevron-left" size={20} />
          </button>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>
            {test ? `Quản lý câu hỏi: ${test.name}` : "Quản lý câu hỏi"}
          </span>
        </div>
      }
      width={1100}
    >
      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {([
          { id: 'questions', label: 'Xây dựng câu hỏi', icon: 'clipboard' },
          { id: 'pdf',       label: 'File PDF',          icon: 'file-text' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 12px',
              fontSize: 13, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-3)',
              background: 'transparent',
              marginBottom: -1,
              transition: 'all 0.15s',
            }}
          >
            <Icon name={tab.icon} size={14} style={{ color: activeTab === tab.id ? 'var(--primary)' : 'inherit' }} />
            {tab.label}
            {tab.id === 'pdf' && currentTest?.pdf_url && (
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--success)', display: 'inline-block',
                marginLeft: 4
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
          
          {/* Points Allocation Progress Bar */}
          {test && (
            <div style={{
              background: 'var(--hover-bg)',
              borderRadius: 12,
              padding: '8px 12px',
              marginBottom: 12,
              border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {totalPoints === test.total_score ? (
                    <>
                      <Icon name="check" size={16} style={{ color: 'var(--success)' }} />
                      <span style={{ color: 'var(--success)' }}>Đã phân bổ đủ điểm bài thi</span>
                    </>
                  ) : totalPoints < test.total_score ? (
                    <>
                      <Icon name="info" size={16} style={{ color: 'var(--warning)' }} />
                      <span style={{ color: 'var(--warning)' }}>Đang thiếu điểm (Cần thêm {test.total_score - totalPoints} điểm)</span>
                    </>
                  ) : (
                    <>
                      <Icon name="alert-circle" size={16} style={{ color: '#ef4444' }} />
                      <span style={{ color: '#ef4444' }}>Vượt quá điểm tối đa bài thi (Thừa {totalPoints - test.total_score} điểm)</span>
                    </>
                  )}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {questions.length > 0 && totalPoints !== test.total_score && (
                    <button
                      onClick={handleAutoDistribute}
                      disabled={batchActionLoading}
                      style={{
                        fontSize: 11, fontWeight: 600,
                        padding: '3px 10px', borderRadius: 6,
                        border: '1px solid var(--primary)',
                        background: 'var(--primary-light)', color: 'var(--primary)',
                        cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >
                      ⚡ Phân bổ đều
                    </button>
                  )}
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>
                    {totalPoints} / {test.total_score} điểm
                  </span>
                </div>
              </div>
              <div style={{ width: '100%', height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min((totalPoints / test.total_score) * 100, 100)}%`,
                  height: '100%',
                  background: totalPoints === test.total_score 
                    ? 'var(--success)' 
                    : totalPoints < test.total_score 
                    ? 'var(--warning)' 
                    : '#ef4444',
                  borderRadius: 4,
                  transition: 'width 0.3s ease, background-color 0.3s ease',
                }} />
              </div>
              {/* Skill breakdown chips */}
              {Object.keys(skillBreakdown).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {Object.entries(skillBreakdown).map(([skill, data]) => (
                    <span key={skill} style={{
                      fontSize: 11, fontWeight: 600,
                      padding: '2px 8px', borderRadius: 6,
                      background: `${SKILL_COLORS[skill] || '#64748b'}15`,
                      color: SKILL_COLORS[skill] || '#64748b',
                      border: `1px solid ${SKILL_COLORS[skill] || '#64748b'}30`,
                    }}>
                      {SKILL_LABELS[skill] || skill}: {data.count} câu · {data.points}đ
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedIds.length > 0 ? (
            /* Batch Action Bar */
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 16, padding: '8px 12px',
              background: 'var(--primary-light)',
              borderRadius: 12,
              border: '1px solid var(--primary)',
              animation: 'fadeIn 0.2s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="checkbox"
                  checked={selectedIds.length === questions.length}
                  onChange={handleSelectAll}
                  style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
                  Đã chọn {selectedIds.length} / {questions.length} câu hỏi
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  disabled={batchActionLoading}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBatchUpdatePoints(Number(e.target.value));
                      e.target.value = ''; // Reset select
                    }
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 8,
                    border: '1px solid var(--primary)',
                    background: '#fff',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="">Đặt điểm nhanh...</option>
                  <option value="1">1 điểm</option>
                  <option value="2">2 điểm</option>
                  <option value="5">5 điểm</option>
                  <option value="10">10 điểm</option>
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  icon="book"
                  loading={batchActionLoading}
                  onClick={handleBatchSaveToBank}
                  children=""
                />
                <Button
                  size="sm"
                  variant="danger"
                  icon="trash"
                  loading={batchActionLoading}
                  onClick={handleBatchDelete}
                  children=""
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds([])}
                  style={{ padding: '0 8px', minWidth: 'auto' }}
                  children="Hủy"
                />
              </div>
            </div>
          ) : (
            /* Regular List Header */
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 12, padding: '0 4px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>
                  Danh sách câu hỏi ({questions.length})
                </div>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: 'var(--primary)',
                  background: 'var(--primary-light)', padding: '4px 12px', borderRadius: 20,
                }}>
                  {totalPoints.toFixed(1)} / {test?.total_score || 0} điểm
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  size="sm"
                  variant="outline"
                  icon="download"
                  style={{ borderColor: 'var(--primary-light)', color: 'var(--primary)', background: '#fff' }}
                  onClick={() => test && exportTestToPdf({ test, questions: questions as any })}
                >
                  In PDF
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  icon="upload" 
                  style={{ borderColor: 'var(--primary-light)', color: 'var(--primary)', background: '#fff' }}
                  onClick={() => setShowImport(true)}
                >
                  Import
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  icon="book" 
                  style={{ borderColor: 'var(--primary-light)', color: 'var(--primary)', background: '#fff' }}
                  onClick={() => setShowBank(true)}
                >
                  Từ kho
                </Button>
                <Button 
                  size="sm" 
                  icon="plus" 
                  style={{ background: 'var(--primary)', color: '#fff', border: 'none' }}
                  onClick={() => { setEditingQuestion(null); setShowAdd(true); }}
                >
                  Thêm câu hỏi
                </Button>
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 4px 16px' }}>
            {loading ? (
              <LoadingSpinner />
            ) : questions.length === 0 ? (
              <EmptyState 
                title="Chưa có câu hỏi nào" 
                desc="Hãy bắt đầu bằng cách thêm câu hỏi thủ công hoặc sử dụng gợi ý từ AI."
                icon="alert-circle"
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
                  isSelected={selectedIds.includes(q.id)}
                  onToggleSelect={handleToggleSelect}
                  onMoveUp={() => handleReorderQuestion(i, 'up')}
                  onMoveDown={() => handleReorderQuestion(i, 'down')}
                  isFirst={i === 0}
                  isLast={i === questions.length - 1}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: AI Panel */}
        <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 24, overflowY: 'auto' }}>
          <AiSuggestPanel
            topic={globalTopic}
            onTopicChange={setGlobalTopic}
            level={globalLevel}
            onLevelChange={setGlobalLevel}
            onAddSelected={handleAddAiQuestions}
            onOpenManageVocab={() => setShowManageVocab(true)}
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
        level={globalLevel}
        topic={globalTopic}
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

      <ManageVocabularyModal
        open={showManageVocab}
        onClose={() => setShowManageVocab(false)}
      />
    </Modal>
  );
};
