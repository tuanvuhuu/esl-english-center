import type { DbPayment } from '../types/database'
import {
  DEFAULT_CENTER_SETTINGS,
  DEFAULT_BANK_SETTINGS,
  CenterSettings,
  BankSettings,
} from '../services/settings'

export const TYPE_LABEL: Record<string, string> = {
  tuition: 'Học phí',
  material: 'Học liệu',
  exam_fee: 'Phí thi',
  other: 'Khác',
}

export const METHOD_LABEL: Record<string, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  momo: 'MoMo',
  vnpay: 'VNPay',
}

export const STATUS_LABEL: Record<string, string> = {
  paid: 'Đã thu',
  pending: 'Chờ thu',
  overdue: 'Quá hạn',
  cancelled: 'Đã huỷ',
}

export const removeAccents = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

export const convertNumberToVietnameseWords = (amount: number): string => {
  if (amount === 0) return 'Không đồng'
  
  const units = ['', ' nghìn', ' triệu', ' tỷ', ' nghìn tỷ', ' triệu tỷ']
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']
  
  const readGroup3 = (group: number, showZero: boolean): string => {
    let result = ''
    const hundreds = Math.floor(group / 100)
    const tens = Math.floor((group % 100) / 10)
    const ones = group % 10
    
    if (hundreds > 0 || showZero) {
      result += digits[hundreds] + ' trăm '
    }
    
    if (tens > 1) {
      result += digits[tens] + ' mươi '
      if (ones === 1) result += 'mốt '
      else if (ones === 5) result += 'lăm '
      else if (ones > 0) result += digits[ones] + ' '
    } else if (tens === 1) {
      result += 'mười '
      if (ones === 5) result += 'lăm '
      else if (ones > 0) result += digits[ones] + ' '
    } else { // tens === 0
      if (ones > 0) {
        if (hundreds > 0 || showZero) {
          result += 'lẻ '
        }
        result += digits[ones] + ' '
      }
    }
    return result
  }
  
  let temp = Math.abs(amount)
  let word = ''
  let groupIdx = 0
  let hasValueBefore = false

  while (temp > 0) {
    const group = temp % 1000
    temp = Math.floor(temp / 1000)
    
    if (group > 0) {
      const showZero = temp > 0
      const groupStr = readGroup3(group, showZero).trim()
      word = groupStr + units[groupIdx] + (word ? ' ' + word : '')
      hasValueBefore = true
    } else if (groupIdx === 3 && hasValueBefore) {
      word = units[groupIdx] + (word ? ' ' + word : '')
    }
    groupIdx++
  }

  const result = word.trim()
  return result.charAt(0).toUpperCase() + result.slice(1) + ' đồng'
}

export const generateReceiptHtml = (options: {
  payment: DbPayment
  studentName: string
  className?: string
  centerSettings?: CenterSettings
  bankSettings?: BankSettings
}): string => {
  const { payment, studentName, className, centerSettings = DEFAULT_CENTER_SETTINGS, bankSettings = DEFAULT_BANK_SETTINGS } = options

  const amount = payment.amount ?? 0
  const printDate = new Date().toLocaleDateString('vi-VN')
  const paymentDate = payment.payment_date
    ? new Date(payment.payment_date).toLocaleDateString('vi-VN')
    : ''
  const dueDate = payment.due_date
    ? new Date(payment.due_date).toLocaleDateString('vi-VN')
    : ''

  let qrUrl = ''
  const hasBankSettings = bankSettings && (bankSettings.bank_id || bankSettings.bank_bin_id) && bankSettings.account_no && bankSettings.account_name
  if (hasBankSettings) {
    const bankIdentifier = bankSettings.bank_bin_id || bankSettings.bank_id
    const description = `Thanh toan ${payment.code || ''} ${removeAccents(studentName)}`
    const safeDesc = description.substring(0, 25).trim()
    const safeAccountName = removeAccents(bankSettings.account_name).toUpperCase()
    qrUrl = `https://img.vietqr.io/image/${bankIdentifier}-${bankSettings.account_no}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(safeDesc)}&accountName=${encodeURIComponent(safeAccountName)}`
  }

  const typeText = TYPE_LABEL[payment.type] || payment.type
  const methodText = METHOD_LABEL[payment.payment_method ?? ''] || payment.payment_method || ''
  const statusText = STATUS_LABEL[payment.status] || payment.status
  const periodMonth = payment.period_month ?? (new Date().getMonth() + 1)
  const periodYear = payment.period_year ?? new Date().getFullYear()
  const wordsText = convertNumberToVietnameseWords(amount)

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>Phiếu thu ${payment.code || ''}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Times New Roman',serif;padding:28px;color:#000;background:#fff}
.receipt{max-width:680px;margin:0 auto}

/* Header */
.header-container{display:flex;justify-content:space-between;align-items:start;border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:20px}
.header-left{flex-grow:1}
.logo-area{display:flex;align-items:center;gap:8px}
.org-name{font-size:16px;font-weight:bold;text-transform:uppercase;color:#1e3a8a}
.header-right{text-align:right;font-size:12px;line-height:1.4;color:#374151;max-width:320px}

/* Title */
.title-container{text-align:center;margin:20px 0 24px}
.title{font-size:24px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#000;margin-bottom:4px}
.code{font-size:13px;color:#374151}

/* Two columns info grid */
.info-grid{display:grid;grid-template-columns:1fr 1fr;column-gap:36px;row-gap:12px;margin-bottom:20px}
.info-item{display:flex;align-items:baseline;font-size:14px;border-bottom:1px dashed #cbd5e1;padding-bottom:4px}
.info-item .label{color:#475569;width:130px;flex-shrink:0}
.info-item .value{color:#0f172a;flex-grow:1}

/* Notes */
.receipt-notes{margin:12px 0 20px;font-size:13px;line-height:1.5;color:#334155;background:#fff;padding:6px 12px;border-left:3px solid #64748b}

/* VietQR Section */
.qr-section{margin:12px 0;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:4px}
.qr-title{font-size:12px;font-weight:bold;text-transform:uppercase;color:#475569}
.qr-img{width:180px;height:180px}
.qr-details{font-size:12px;color:#334155}

/* Signatures */
.signatures{display:flex;justify-content:space-between;margin-top:40px;padding:0 40px}
.sig-col{text-align:center;width:200px}
.sig-title{font-size:14px;font-weight:bold;color:#0f172a}
.sig-subtitle{font-size:12px;font-style:italic;color:#64748b;margin-top:2px}
.sig-space{height:80px}

/* Print utilities */
.print-info{font-size:11px;text-align:right;margin-top:24px;color:#666}
@media print{body{padding:0}.no-print{display:none!important}}
</style>
</head>
<body>
<div class="receipt">
  <!-- Header with logo on left, address on right -->
  <div class="header-container">
    <div class="header-left">
      <div class="logo-area">
        <svg class="logo-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #1e3a8a; vertical-align: middle;">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
          <path d="M6 12v5c0 2 4 3 6 3s6-1 6-3v-5"/>
        </svg>
        <span class="org-name">${centerSettings.name || 'Trung tâm Anh ngữ ESL'}</span>
      </div>
    </div>
    <div class="header-right">
      ${centerSettings.address ? `<div><b>ĐC:</b> ${centerSettings.address}</div>` : ''}
      ${centerSettings.phone ? `<div><b>ĐT:</b> ${centerSettings.phone}</div>` : ''}
      ${centerSettings.email ? `<div><b>Email:</b> ${centerSettings.email}</div>` : ''}
    </div>
  </div>

  <!-- Centered Title -->
  <div class="title-container">
    <h1 class="title">Phiếu thu học phí</h1>
    <div class="code">Số: <b>${payment.code || '___'}</b></div>
  </div>

  <!-- Two columns basic info grid -->
  <div class="info-grid">
    <div class="info-item">
      <span class="label">Họ tên học viên</span>
      <span class="value">${studentName}</span>
    </div>
    <div class="info-item">
      <span class="label">Lớp học</span>
      <span class="value">${className || '\u2014'}</span>
    </div>
    <div class="info-item">
      <span class="label">Nội dung thu</span>
      <span class="value">${typeText}</span>
    </div>
    <div class="info-item">
      <span class="label">Kỳ thanh toán</span>
      <span class="value">Tháng ${periodMonth}/${periodYear}</span>
    </div>
    <div class="info-item">
      <span class="label">Trạng thái</span>
      <span class="value">${statusText}</span>
    </div>
    <div class="info-item">
      <span class="label">Hình thức đóng</span>
      <span class="value">${methodText}</span>
    </div>
    <div class="info-item">
      <span class="label">Ngày thu</span>
      <span class="value">${paymentDate || '\u2014'}</span>
    </div>
    <div class="info-item">
      <span class="label">Hạn đóng</span>
      <span class="value">${dueDate || '\u2014'}</span>
    </div>
    <!-- Amount to pay aligned in the left column (bold text) -->
    <div class="info-item">
      <span class="label">Số tiền đóng</span>
      <span class="value" style="font-weight: bold;">${amount.toLocaleString('vi-VN')} VNĐ</span>
    </div>
    <!-- Empty item to balance the grid row -->
    <div class="info-item" style="border-bottom: none;"></div>
    
    <!-- Amount in words takes full width of the grid (italic text) -->
    <div class="info-item" style="grid-column: 1 / -1;">
      <span class="label">Bằng chữ</span>
      <span class="value" style="font-style: italic;">${wordsText}</span>
    </div>
  </div>

  <!-- Notes -->
  ${payment.notes ? `<div class="receipt-notes"><b>Ghi chú:</b> ${payment.notes}</div>` : ''}

  <!-- VietQR Section -->
  ${hasBankSettings ? `
  <div class="qr-section">
    <div class="qr-title">Quét mã VietQR để thanh toán</div>
    <img src="${qrUrl}" alt="Mã QR Chuyển khoản" class="qr-img" />
    <div class="qr-details">Ngân hàng: <b>${bankSettings.bank_id}</b> - STK: <b>${bankSettings.account_no}</b></div>
    <div class="qr-details">Chủ tài khoản: <b>${bankSettings.account_name}</b></div>
  </div>
  ` : ''}

  <!-- Signatures -->
  <div class="signatures">
    <div class="sig-col">
      <div class="sig-title">Người nộp tiền</div>
      <div class="sig-subtitle">(Ký, ghi rõ họ tên)</div>
      <div class="sig-space"></div>
    </div>
    <div class="sig-col">
      <div class="sig-title">Người thu tiền</div>
      <div class="sig-subtitle">(Ký, ghi rõ họ tên)</div>
      <div class="sig-space"></div>
    </div>
  </div>
  
  <div class="print-info">Ngày in: ${printDate}</div>
</div>

<div style="text-align:center;margin-top:32px" class="no-print">
  <button onclick="window.print()" style="padding:10px 28px;border:1px solid #475569;border-radius:6px;background:#1e293b;color:#fff;font-size:14px;font-weight:bold;cursor:pointer;font-family:'Times New Roman',serif;transition:background 0.2s">In phiếu thu</button>
</div>
</body>
</html>`
}

export const printReceipt = (options: {
  payment: DbPayment
  studentName: string
  className?: string
  centerSettings?: CenterSettings
  bankSettings?: BankSettings
}): boolean => {
  const html = generateReceiptHtml(options)
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    return true
  }
  return false
}
