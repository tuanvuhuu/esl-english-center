import jsPDF from 'jspdf'
import type { DbTest, DbTestResult } from '../../types/database'

interface ReportData {
  test: DbTest
  studentName: string
  level: string | null
  result: DbTestResult
  classAvg: number | null
  feedback: string
}

const SKILLS = [
  { key: 'score_reading',   label: 'Doc',  color: [59, 130, 246] as [number, number, number] },
  { key: 'score_listening', label: 'Nghe', color: [16, 185, 129] as [number, number, number] },
  { key: 'score_speaking',  label: 'Noi',  color: [245, 158, 11] as [number, number, number] },
  { key: 'score_writing',   label: 'Viet', color: [239, 68, 68]  as [number, number, number] },
] as const

const stripVi = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')

export const generateParentReport = (data: ReportData): { blobUrl: string; fileName: string } => {
  const { test, studentName, level, result, classAvg, feedback } = data

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  // --- HEADER BANNER (gradient look via filled rect) ---
  doc.setFillColor(99, 102, 241) // indigo
  doc.rect(0, 0, pageW, 38, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.text('ESL ENGLISH CENTER', pageW / 2, 16, { align: 'center' })
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(stripVi('BÁO CÁO HỌC TẬP'), pageW / 2, 24, { align: 'center' })
  doc.setFontSize(10)
  doc.text(stripVi(test.name), pageW / 2, 32, { align: 'center' })

  let y = 50

  // --- STUDENT INFO BOX ---
  doc.setDrawColor(229, 231, 235)
  doc.setFillColor(249, 250, 251)
  doc.roundedRect(15, y, pageW - 30, 22, 3, 3, 'FD')

  doc.setTextColor(75, 85, 99)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(stripVi('HỌC VIÊN'), 20, y + 7)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(17, 24, 39)
  doc.text(stripVi(studentName), 20, y + 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(107, 114, 128)
  if (level) doc.text(stripVi(`Trình độ: ${level}`), 20, y + 19)

  // Date right side
  doc.setFontSize(9)
  doc.setTextColor(75, 85, 99)
  doc.text(stripVi('NGÀY KIỂM TRA'), pageW - 20, y + 7, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(17, 24, 39)
  doc.text(new Date(test.test_date).toLocaleDateString('vi-VN'), pageW - 20, y + 14, { align: 'right' })

  y += 30

  // --- TOTAL SCORE CIRCLE ---
  const cx = pageW / 2
  const cy = y + 22
  const total = result.total_score ?? 0
  const isPassed = result.is_passed ?? total >= test.pass_threshold

  // Outer ring
  doc.setLineWidth(2)
  doc.setDrawColor(229, 231, 235)
  doc.circle(cx, cy, 18, 'S')

  // Fill circle
  if (isPassed) doc.setFillColor(34, 197, 94)
  else doc.setFillColor(239, 68, 68)
  doc.circle(cx, cy, 16, 'F')

  // Score text
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text(String(total), cx, cy + 2, { align: 'center' })
  doc.setFontSize(8)
  doc.text('/ 100', cx, cy + 8, { align: 'center' })

  // Status badge below
  doc.setFillColor(isPassed ? 34 : 239, isPassed ? 197 : 68, isPassed ? 94 : 68)
  doc.roundedRect(cx - 18, cy + 22, 36, 8, 4, 4, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(stripVi(isPassed ? 'DAT' : 'CHUA DAT'), cx, cy + 27.5, { align: 'center' })

  y += 56

  // --- CLASS AVG comparison ---
  if (classAvg != null) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(75, 85, 99)
    const diff = total - classAvg
    const diffText = diff > 0
      ? `cao hon trung binh lop +${diff.toFixed(1)}`
      : diff < 0
        ? `thap hon trung binh lop ${diff.toFixed(1)}`
        : 'bang trung binh lop'
    doc.text(`(${diffText} - TB lop: ${classAvg.toFixed(1)})`, cx, y, { align: 'center' })
    y += 8
  }

  // --- SKILL BAR CHART ---
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(17, 24, 39)
  doc.text(stripVi('Điểm theo kỹ năng'), 15, y)
  y += 4

  const chartX = 20
  const chartW = pageW - 40
  const barH = 6
  const gap = 9

  SKILLS.forEach((s, i) => {
    const score = result[s.key] as number | null
    const by = y + 6 + i * gap

    // Label
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(75, 85, 99)
    doc.text(stripVi(s.label), chartX, by + 4)

    // Bar bg
    doc.setFillColor(243, 244, 246)
    doc.roundedRect(chartX + 20, by, chartW - 35, barH, 2, 2, 'F')

    // Bar fill
    if (score != null) {
      const w = ((chartW - 35) * score) / 100
      doc.setFillColor(...s.color)
      doc.roundedRect(chartX + 20, by, Math.max(w, 2), barH, 2, 2, 'F')

      // Score value
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(17, 24, 39)
      doc.text(`${score}`, pageW - 18, by + 4.5, { align: 'right' })
    } else {
      doc.setFontSize(9)
      doc.setTextColor(156, 163, 175)
      doc.text('—', pageW - 18, by + 4.5, { align: 'right' })
    }
  })

  y += 4 + SKILLS.length * gap + 8

  // --- TEACHER COMMENT BOX ---
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(17, 24, 39)
  doc.text(stripVi('Nhận xét của giáo viên'), 15, y)
  y += 5

  const cleanFb = stripVi(feedback.replace(/\*\*(.+?)\*\*/g, '$1').replace(/[🌟⭐💪🎉🏆📊📈⚠️✅💡🔔]/g, ''))
  const fbLines = doc.splitTextToSize(cleanFb, pageW - 40)
  const fbBoxH = fbLines.length * 5 + 10

  doc.setFillColor(254, 249, 195)
  doc.setDrawColor(250, 204, 21)
  doc.roundedRect(15, y, pageW - 30, fbBoxH, 3, 3, 'FD')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(120, 53, 15)
  doc.text(fbLines, 20, y + 7)

  y += fbBoxH + 8

  // --- FOOTER ---
  doc.setDrawColor(229, 231, 235)
  doc.line(15, pageH - 22, pageW - 15, pageH - 22)
  doc.setFontSize(8)
  doc.setTextColor(156, 163, 175)
  doc.setFont('helvetica', 'italic')
  doc.text(stripVi('Cảm ơn quý phụ huynh đã đồng hành cùng con tại ESL English Center'), pageW / 2, pageH - 14, { align: 'center' })
  doc.text(`Generated: ${new Date().toLocaleString('vi-VN')}`, pageW / 2, pageH - 8, { align: 'center' })

  const blob = doc.output('blob')
  return {
    blobUrl: URL.createObjectURL(blob),
    fileName: `BaoCao_${stripVi(studentName).replace(/\s+/g, '_')}_${stripVi(test.name).replace(/\s+/g, '_')}.pdf`,
  }
}
