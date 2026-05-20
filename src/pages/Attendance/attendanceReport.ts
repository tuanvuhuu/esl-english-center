import jsPDF from 'jspdf'

interface ReportRow {
  studentName: string
  level: string | null
  present: number
  absent: number
  late: number
  excused: number
  rate: number
}

interface ReportData {
  className: string
  fromDate: string
  toDate: string
  rows: ReportRow[]
  totalSessions: number
}

const stripVi = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')

export const exportAttendanceReport = (data: ReportData) => {
  const { className, fromDate, toDate, rows, totalSessions } = data
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  // Banner
  doc.setFillColor(99, 102, 241)
  doc.rect(0, 0, pageW, 32, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.text('ESL ENGLISH CENTER', pageW / 2, 14, { align: 'center' })
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(stripVi('BAO CAO DIEM DANH'), pageW / 2, 22, { align: 'center' })
  doc.setFontSize(9)
  doc.text(stripVi(`Lop: ${className}`), pageW / 2, 28, { align: 'center' })

  let y = 42

  // Period
  doc.setTextColor(75, 85, 99)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(stripVi(`Tu ngay: ${fromDate}  -  Den ngay: ${toDate}`), 15, y)
  doc.text(stripVi(`Tong so buoi: ${totalSessions}`), pageW - 15, y, { align: 'right' })

  y += 8
  doc.setDrawColor(229, 231, 235)
  doc.line(15, y, pageW - 15, y)
  y += 6

  // Table header
  doc.setFillColor(243, 244, 246)
  doc.rect(15, y, pageW - 30, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(75, 85, 99)
  const cols = [
    { x: 17,  w: 8,  text: 'STT'  },
    { x: 27,  w: 60, text: 'Hoc vien' },
    { x: 90,  w: 15, text: 'Co mat' },
    { x: 110, w: 15, text: 'Muon' },
    { x: 130, w: 18, text: 'Vang phep' },
    { x: 152, w: 15, text: 'Vang' },
    { x: 175, w: 15, text: 'Ti le' },
  ]
  cols.forEach(c => doc.text(c.text, c.x, y + 5))
  y += 10

  // Rows
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(17, 24, 39)
  rows.forEach((r, i) => {
    if (y > pageH - 20) { doc.addPage(); y = 20 }
    doc.text(String(i + 1), cols[0].x, y)
    doc.text(stripVi(r.studentName).slice(0, 32), cols[1].x, y)
    doc.text(String(r.present), cols[2].x, y)
    doc.text(String(r.late),    cols[3].x, y)
    doc.text(String(r.excused), cols[4].x, y)
    doc.text(String(r.absent),  cols[5].x, y)

    // Rate with color
    const rateColor: [number, number, number] =
      r.rate >= 90 ? [34, 197, 94] :
      r.rate >= 75 ? [245, 158, 11] : [239, 68, 68]
    doc.setTextColor(...rateColor)
    doc.setFont('helvetica', 'bold')
    doc.text(`${r.rate}%`, cols[6].x, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(17, 24, 39)

    y += 6.5
    if (i < rows.length - 1) {
      doc.setDrawColor(243, 244, 246)
      doc.line(15, y - 2, pageW - 15, y - 2)
    }
  })

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(156, 163, 175)
  doc.setFont('helvetica', 'italic')
  doc.text(`Generated: ${new Date().toLocaleString('vi-VN')}`, pageW / 2, pageH - 8, { align: 'center' })

  doc.save(`DiemDanh_${stripVi(className).replace(/\s+/g, '_')}_${fromDate}_${toDate}.pdf`)
}
