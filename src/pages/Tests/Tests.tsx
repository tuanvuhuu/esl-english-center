import React, { useState, useCallback, useMemo } from 'react'
import { useToast, Icon, IconName } from '../../components'
import { useQuery, useAnimatedNumber } from '../../hooks'
import { getTests, createTest, getTestQuestions, createTestQuestion, upsertQuestionOptions } from '../../services/tests'
import { notify } from '../../services'
import { getClasses } from '../../services/classes'
import { mapClass } from '../../lib/mappers'
import type { DbTest } from '../../types/database'
import { TestsScheduleTab }  from './components/TestsScheduleTab'
import { TestsResultsTab }   from './components/TestsResultsTab'
import { TestsAnalyticsTab } from './components/TestsAnalyticsTab'
import { CreateTestModal, CreateTestPayload }   from './components/CreateTestModal'
import { QuestionBuilderModal } from './components/QuestionBuilderModal'
import { PdfViewerModal } from './components/PdfViewerModal'
import { OnlineTestModal } from './components/OnlineTestModal'
import { exportTestToPdf } from './testExport'
import { generateQuestionsWithAi } from './aiQuestionGenerator'

interface StatCardProps {
  label: string
  count: number | string
  icon: IconName
  variant: 'warning' | 'success' | 'primary' | 'info' | 'academic'
  badgeText?: string
  aiGlow?: boolean
}

const VARIANT_CONFIGS = {
  warning: {
    color: 'var(--warning-text)',
    bgColor: 'var(--warning-bg)',
    borderColor: 'var(--warning-border)',
    glowColor: 'rgba(245, 158, 11, 0.15)',
    hoverBorder: 'var(--warning-dark)',
    hoverShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.15)',
  },
  success: {
    color: 'var(--success-text)',
    bgColor: 'var(--success-bg)',
    borderColor: 'var(--success-border)',
    glowColor: 'rgba(16, 185, 129, 0.15)',
    hoverBorder: 'var(--success-dark)',
    hoverShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.15)',
  },
  primary: {
    color: 'var(--primary)',
    bgColor: 'var(--primary-15)',
    borderColor: 'rgba(255, 107, 53, 0.25)',
    glowColor: 'rgba(255, 107, 53, 0.2)',
    hoverBorder: 'var(--primary-dark)',
    hoverShadow: '0 10px 25px -5px rgba(255, 107, 53, 0.2)',
  },
  info: {
    color: 'var(--info-text)',
    bgColor: 'var(--info-bg)',
    borderColor: 'var(--info-border)',
    glowColor: 'rgba(59, 130, 246, 0.15)',
    hoverBorder: 'var(--info-dark)',
    hoverShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.15)',
  },
  academic: {
    color: 'var(--academic-dark)',
    bgColor: 'var(--academic-light)',
    borderColor: 'rgba(124, 58, 237, 0.25)',
    glowColor: 'rgba(124, 58, 237, 0.15)',
    hoverBorder: 'var(--academic-dark)',
    hoverShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.15)',
  },
}

const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  count, 
  icon, 
  variant,
  badgeText,
  aiGlow = false
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const config = VARIANT_CONFIGS[variant]
  
  const parsedValue = typeof count === 'string' ? parseFloat(count) : Number(count)
  const [numRef, numVal] = useAnimatedNumber(isNaN(parsedValue) ? 0 : parsedValue, 800)
  const displayVal = isNaN(parsedValue) ? count : Math.round(Number(numVal))

  return (
    <div
      ref={numRef as React.RefObject<HTMLDivElement>}
      className={`stitch-stat-card ${aiGlow ? 'ai-glow-card' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ['--hover-border' as any]: config.hoverBorder,
        ['--hover-shadow' as any]: config.hoverShadow,
        ['--glow-color' as any]: config.glowColor,
        background: isHovered 
          ? `linear-gradient(135deg, var(--card), ${config.bgColor})` 
          : 'var(--card)',
        borderColor: isHovered ? config.hoverBorder : 'var(--border-light)',
        borderRadius: '12px',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Background glow gradient that shows up on hover */}
      <div 
        className="glow-effect"
        style={{
          background: config.glowColor,
          opacity: isHovered ? 0.6 : 0.15,
          transform: isHovered ? 'scale(1.2)' : 'scale(1)',
        }}
      />

      {/* Top row with icon & badge */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div 
          className="icon-container"
          style={{
            background: config.bgColor,
            border: `1px solid ${config.borderColor}`,
            transform: isHovered ? 'scale(1.1) rotate(4deg)' : 'scale(1) rotate(0)',
          }}
        >
          <Icon name={icon} size={16} color={config.color} />
        </div>
        
        {badgeText && (
          <span style={{
            fontSize: '9px',
            fontWeight: 700,
            color: config.color,
            background: config.bgColor,
            padding: '2px 6px',
            borderRadius: '100px',
            border: `1px solid ${config.borderColor}`,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            {badgeText}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h3 style={{
          fontSize: '10px',
          fontWeight: 700,
          color: 'var(--text-3)',
          margin: 0,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          {label}
        </h3>
        <p style={{
          fontSize: '24px',
          fontWeight: 800,
          color: 'var(--text-1)',
          margin: '4px 0 0 0',
          lineHeight: 1.1,
          fontFamily: 'var(--font)',
          letterSpacing: '-0.02em',
        }}>
          {displayVal}
        </p>
      </div>
    </div>
  )
}

export const Tests: React.FC = () => {
  const toast = useToast()
  const [activeTab,    setActiveTab]    = useState('schedule')
  const [selectedTest, setSelectedTest] = useState<DbTest | null>(null)
  const [creating,     setCreating]     = useState(false)

  // Unified modal state manager
  const [modal, setModal] = useState<{
    type: 'create' | 'builder' | 'pdf' | 'online' | null
    test: DbTest | null
  }>({ type: null, test: null })

  const { data: rawTests, loading: testsLoading, refetch: refetchTests } = useQuery(getTests)
  const { data: rawClasses } = useQuery(getClasses)

  const tests = useMemo(() => rawTests ?? [], [rawTests])

  const activeClasses = useMemo(
    () => (rawClasses ?? []).map(mapClass).filter(c => c.status === 'active'),
    [rawClasses],
  )

  const upcomingCount = useMemo(() => tests.filter(t => t.status === 'upcoming').length, [tests])
  const completedCount = useMemo(() => tests.filter(t => t.status === 'completed').length, [tests])



  const statsSummary = useMemo(() => {
    return {
      upcoming: upcomingCount,
      completed: completedCount,
      total: tests.length,
    }
  }, [upcomingCount, completedCount, tests.length])

  const handleCreateTest = async (payload: CreateTestPayload) => {
    setCreating(true)
    try {
      // 1. Tạo bài kiểm tra cơ bản trong database
      const newTest = await createTest(payload.testData)
      
      // 2. Xử lý câu hỏi dựa trên chế độ tạo
      if (payload.creationMode === 'clone' && payload.cloneFromTestId) {
        // Lấy danh sách câu hỏi của bài kiểm tra nguồn
        const sourceQuestions = await getTestQuestions(payload.cloneFromTestId)
        
        // Sao chép từng câu hỏi sang bài kiểm tra mới
        for (const q of sourceQuestions) {
          const newQ = await createTestQuestion({
            test_id: newTest.id,
            skill: q.skill,
            type: q.type,
            question_text: q.question_text,
            image_url: q.image_url,
            audio_url: q.audio_url,
            points: q.points,
            order_index: q.order_index,
            explanation: q.explanation,
            is_deleted: false,
            created_by: null,
            updated_by: null,
          })
          
          if (q.options && q.options.length > 0) {
            await upsertQuestionOptions(
              newQ.id,
              q.options.map(opt => ({
                option_text: opt.option_text,
                is_correct: opt.is_correct,
                order_index: opt.order_index,
              }))
            )
          }
        }
        toast.success(`Sao chép thành công ${sourceQuestions.length} câu hỏi từ bài kiểm tra trước!`)
      } else if (payload.creationMode === 'ai' && payload.aiOptions) {
        // Lấy level của lớp học để sinh câu hỏi phù hợp lứa tuổi
        const targetClass = activeClasses.find(c => String(c.id) === String(newTest.class_id))
        const level = targetClass?.level || 'A1'
        
        // Gọi AI để tự động tạo câu hỏi
        const generated = await generateQuestionsWithAi({
          topic: payload.aiOptions.topic,
          skill: payload.aiOptions.skill,
          level: level,
          count: payload.aiOptions.count,
        })
        
        // Lưu các câu hỏi do AI tạo ra vào database
        let orderIndex = 1
        for (const g of generated) {
          const newQ = await createTestQuestion({
            test_id: newTest.id,
            skill: g.skill,
            type: g.type,
            question_text: g.question_text,
            image_url: g.image_url || null,
            audio_url: null,
            points: g.points,
            order_index: orderIndex++,
            explanation: g.explanation || null,
            is_deleted: false,
            created_by: null,
            updated_by: null,
          })
          
          if (g.options && g.options.length > 0) {
            await upsertQuestionOptions(
              newQ.id,
              g.options.map((opt, optIdx) => ({
                option_text: opt.text,
                is_correct: opt.isCorrect,
                order_index: optIdx + 1,
              }))
            )
          }
        }
        toast.success(`AI đã tự động sinh ${generated.length} câu hỏi theo chủ đề "${payload.aiOptions.topic}"!`)
      }
      
      notify('Tạo bài kiểm tra', `Bài kiểm tra "${payload.testData.name}" đã được tạo`, 'info', { entityType: 'test' })
      await refetchTests()
      // Đóng modal bằng cách set modal state
      setModal({ type: null, test: null })
    } catch (err) {
      console.error('Lỗi khi tạo bài kiểm tra:', err)
      toast.error('Không thể tạo bài kiểm tra. Vui lòng kiểm tra lại cấu hình.')
    } finally {
      setCreating(false)
    }
  }

  const handleExportPdf = async (test: DbTest) => {
    try {
      const questions = await getTestQuestions(test.id);
      await exportTestToPdf({ test, questions: questions as any });
    } catch (err) {
      console.error('Export PDF Error:', err);
      toast.error('Không thể xuất PDF. Hãy kiểm tra lại dữ liệu câu hỏi.');
    }
  };

  const handleSelectTest = useCallback((test: DbTest) => {
    setSelectedTest(test)
    if (activeTab === 'schedule') setActiveTab('results')
  }, [activeTab])



  const renderTab = () => {
    let content = null
    switch (activeTab) {
      case 'schedule':
        content = (
          <TestsScheduleTab
            tests={tests}
            loading={testsLoading}
            onSelectTest={handleSelectTest}
            onBuildQuestions={test => setModal({ type: 'builder', test })}
            onExportPdf={handleExportPdf}
            onViewPdf={test => setModal({ type: 'pdf', test })}
            onTakeOnline={test => setModal({ type: 'online', test })}
            onCreate={() => setModal({ type: 'create', test: null })}
          />
        )
        break
      case 'results':
        content = (
          <TestsResultsTab
            selectedTest={selectedTest}
            tests={tests}
            onSelectTest={setSelectedTest}
          />
        )
        break
      case 'analytics':
        content = (
          <TestsAnalyticsTab
            tests={tests}
            selectedTest={selectedTest}
            onSelectTest={setSelectedTest}
          />
        )
        break
    }
    return (
      <div key={activeTab} style={{ animation: 'slideUp 0.3s ease-out' }}>
        {content}
      </div>
    )
  }

  return (
    <div>
      <style>{`
        .stitch-stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }
        .stitch-stat-card {
          position: relative;
          padding: 14px;
          border-radius: 12px;
          background: var(--card);
          border: 1px solid var(--border-light);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          cursor: default;
          box-shadow: var(--shadow-sm);
        }
        .stitch-stat-card:hover {
          transform: translateY(-2px);
          border-color: var(--hover-border);
          box-shadow: var(--hover-shadow), var(--shadow-md);
        }
        .stitch-stat-card .glow-effect {
          position: absolute;
          top: -30px;
          right: -30px;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          filter: blur(20px);
          transition: all 0.35s ease;
          pointer-events: none;
        }
        .stitch-stat-card .icon-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .ai-glow-card {
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.05), var(--shadow-sm);
        }
        .ai-glow-card:hover {
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.2), var(--shadow-md);
        }
      `}</style>
      {/* Premium Header Control Panel */}
      <div style={{
        background: 'linear-gradient(135deg, var(--card) 0%, var(--hover-bg) 100%)',
        border: '1px solid var(--border-light)',
        borderRadius: '16px',
        padding: '16px 24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative background glow */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-20%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--primary-light) 0%, transparent 70%)',
          opacity: 0.4,
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'var(--primary-15)',
              border: '1px solid rgba(255, 107, 53, 0.25)',
              color: 'var(--primary)',
            }}>
              <Icon name="award" size={20} />
            </div>
            <div>
              <h1 style={{ 
                fontSize: 22, 
                fontWeight: 800, 
                color: 'var(--text-1)', 
                margin: 0, 
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
              }}>
                Kiểm tra & Thi
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
                <Icon name="calendar" size={13} style={{ opacity: 0.7 }} />
                <span>{upcomingCount} sắp tới</span>
                <span style={{ color: 'var(--border)' }}>|</span>
                <Icon name="check" size={13} style={{ opacity: 0.7 }} />
                <span>{completedCount} hoàn thành</span>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Tabs inside actions */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'flex',
            gap: 4,
            background: 'var(--card)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid var(--border-light)',
          }}>
            {[
              { id: 'schedule', label: 'Lịch kiểm tra', count: upcomingCount, icon: 'calendar' },
              { id: 'results', label: 'Kết quả', count: completedCount, icon: 'file-text' },
              { id: 'analytics', label: 'Phân tích', icon: 'trending-up' },
            ].map(t => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: 'var(--font)',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    background: isActive ? 'var(--primary)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--text-3)',
                    boxShadow: isActive ? '0 4px 12px rgba(255, 107, 53, 0.25)' : 'none',
                  }}
                >
                  <Icon name={t.icon as any} size={14} color={isActive ? '#fff' : 'var(--text-3)'} />
                  <span>{t.label}</span>
                  {t.count !== undefined && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '100px',
                      background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'var(--hover-bg)',
                      color: isActive ? '#fff' : 'var(--text-2)',
                      marginLeft: 2,
                    }}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sleek Premium Stats Summary Grid (Stitch Dashboard Inspired) */}
      <div className="stitch-stat-grid">
        <StatCard
          label="Sắp tới"
          count={statsSummary.upcoming}
          icon="calendar"
          variant="warning"
          badgeText="Sắp diễn ra"
        />
        <StatCard
          label="Đã hoàn thành"
          count={statsSummary.completed}
          icon="check"
          variant="success"
          badgeText="Hoàn tất"
        />
        <StatCard
          label="Tổng số bài test"
          count={statsSummary.total}
          icon="file-text"
          variant="primary"
          badgeText="Tổng quan"
          aiGlow={true}
        />
        <StatCard
          label="Lớp học hoạt động"
          count={activeClasses.length}
          icon="award"
          variant="academic"
          badgeText="Đang giảng dạy"
        />
      </div>

      {renderTab()}

      <CreateTestModal
        open={modal.type === 'create'}
        onClose={() => setModal({ type: null, test: null })}
        onSave={handleCreateTest}
        classes={activeClasses}
        saving={creating}
      />

      <QuestionBuilderModal
        open={modal.type === 'builder'}
        onClose={() => setModal({ type: null, test: null })}
        test={modal.test}
      />

      <PdfViewerModal
        open={modal.type === 'pdf'}
        onClose={() => setModal({ type: null, test: null })}
        test={modal.test}
      />

      <OnlineTestModal
        open={modal.type === 'online'}
        onClose={() => { setModal({ type: null, test: null }); refetchTests() }}
        test={modal.test}
      />
    </div>
  )
}
