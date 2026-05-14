import React, { useState, useCallback, useMemo } from 'react'
import { PageHeader, Tabs } from '../../components'
import { useQuery } from '../../hooks/useSupabase'
import { getTests, createTest, getTestQuestions } from '../../services/tests'
import { getClasses } from '../../services/classes'
import { mapClass } from '../../lib/mappers'
import type { DbTest } from '../../types/database'
import { TestsScheduleTab }  from './components/TestsScheduleTab'
import { TestsResultsTab }   from './components/TestsResultsTab'
import { TestsAnalyticsTab } from './components/TestsAnalyticsTab'
import { CreateTestModal }   from './components/CreateTestModal'
import { QuestionBuilderModal } from './components/QuestionBuilderModal'
import { PdfViewerModal } from './components/PdfViewerModal'
import { exportTestToPdf } from './testExport'

const TABS = [
  { id: 'schedule',  label: 'Lịch kiểm tra' },
  { id: 'results',   label: 'Kết quả' },
  { id: 'analytics', label: 'Phân tích' },
]

export const Tests: React.FC = () => {
  const [activeTab,    setActiveTab]    = useState('schedule')
  const [selectedTest, setSelectedTest] = useState<DbTest | null>(null)
  const [showCreate,   setShowCreate]   = useState(false)
  const [creating,     setCreating]     = useState(false)
  const [questionBuilderTest, setQuestionBuilderTest] = useState<DbTest | null>(null)
  const [pdfViewTest, setPdfViewTest] = useState<DbTest | null>(null)

  const { data: rawTests, loading: testsLoading, refetch: refetchTests } = useQuery(getTests)
  const { data: rawClasses } = useQuery(getClasses)

  const tests = useMemo(() => rawTests ?? [], [rawTests])

  const activeClasses = useMemo(
    () => (rawClasses ?? []).map(mapClass).filter(c => c.status === 'active'),
    [rawClasses],
  )

  const handleCreateTest = async (payload: Partial<DbTest>) => {
    setCreating(true)
    try {
      await createTest(payload)
      await refetchTests()
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
      alert('Không thể xuất PDF. Hãy kiểm tra lại dữ liệu câu hỏi.');
    }
  };

  const handleSelectTest = useCallback((test: DbTest) => {
    setSelectedTest(test)
    if (activeTab === 'schedule') setActiveTab('results')
  }, [activeTab])

  const subtitle = testsLoading
    ? 'Đang tải...'
    : `${tests.filter(t => t.status === 'upcoming').length} sắp tới · ${tests.filter(t => t.status === 'completed').length} đã hoàn thành`

  const renderTab = () => {
    switch (activeTab) {
      case 'schedule':
        return (
          <TestsScheduleTab
            tests={tests}
            loading={testsLoading}
            onSelectTest={handleSelectTest}
            onBuildQuestions={setQuestionBuilderTest}
            onExportPdf={handleExportPdf}
            onViewPdf={setPdfViewTest}
            onCreate={() => setShowCreate(true)}
          />
        )
      case 'results':
        return (
          <TestsResultsTab
            selectedTest={selectedTest}
            tests={tests}
            onSelectTest={setSelectedTest}
          />
        )
      case 'analytics':
        return (
          <TestsAnalyticsTab
            tests={tests}
            selectedTest={selectedTest}
            onSelectTest={setSelectedTest}
          />
        )
      default:
        return null
    }
  }

  return (
    <div>
      <PageHeader
        title="Kiểm tra & Thi"
        subtitle={subtitle}
        actions={
          <Tabs 
            tabs={TABS} 
            active={activeTab} 
            onChange={setActiveTab} 
          />
        }
      />

      {renderTab()}

      <CreateTestModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreateTest}
        classes={activeClasses}
        loading={creating}
      />

      <QuestionBuilderModal
        open={!!questionBuilderTest}
        onClose={() => setQuestionBuilderTest(null)}
        test={questionBuilderTest}
      />

      <PdfViewerModal
        open={!!pdfViewTest}
        onClose={() => setPdfViewTest(null)}
        test={pdfViewTest}
      />
    </div>
  )
}
