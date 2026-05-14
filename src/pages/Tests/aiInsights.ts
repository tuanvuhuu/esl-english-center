import type { DbTestResult, DbTest } from '../../types/database'

const SKILL_LABELS: Record<string, string> = {
  score_reading:   'Đọc hiểu',
  score_listening: 'Nghe hiểu',
  score_speaking:  'Nói',
  score_writing:   'Viết',
}

function avg(nums: (number | null | undefined)[]): number | null {
  const valid = nums.filter((n): n is number => n !== null && n !== undefined)
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

function round1(n: number | null): string {
  if (n === null) return '—'
  return n.toFixed(1)
}

type SkillKey = 'score_reading' | 'score_listening' | 'score_speaking' | 'score_writing'
const SKILL_KEYS: SkillKey[] = ['score_reading', 'score_listening', 'score_speaking', 'score_writing']

interface SkillStats {
  key: SkillKey
  label: string
  avg: number
}

export function generateClassInsights(results: DbTestResult[], test: DbTest): string {
  const withScores = results.filter(r => r.total_score !== null)
  if (withScores.length === 0) {
    return 'Chưa có dữ liệu điểm số. Hãy nhập điểm để nhận phân tích AI.'
  }

  const totalAvg = avg(withScores.map(r => r.total_score))!
  const passCount = withScores.filter(r => r.is_passed).length
  const passRate = Math.round((passCount / withScores.length) * 100)

  const skillStats: SkillStats[] = SKILL_KEYS
    .map(k => ({
      key: k,
      label: SKILL_LABELS[k],
      avg: avg(withScores.map(r => r[k] as number | null))!,
    }))
    .filter(s => s.avg !== null)
    .sort((a, b) => a.avg - b.avg)

  const weakest = skillStats[0]
  const strongest = skillStats[skillStats.length - 1]

  const scoreMin = Math.min(...withScores.map(r => r.total_score!))
  const scoreMax = Math.max(...withScores.map(r => r.total_score!))
  const spread = scoreMax - scoreMin

  const lines: string[] = []

  // Overview
  const performanceLabel =
    totalAvg >= 85 ? 'xuất sắc' :
    totalAvg >= 75 ? 'tốt' :
    totalAvg >= 65 ? 'khá' :
    totalAvg >= 55 ? 'trung bình' : 'cần cải thiện'

  lines.push(
    `📊 **Tổng quan:** Lớp đạt điểm trung bình ${round1(totalAvg)}/100 — mức ${performanceLabel}. ` +
    `Tỷ lệ đạt: ${passRate}% (${passCount}/${withScores.length} học viên).`
  )

  // Skill breakdown (only if skill data present)
  if (skillStats.length >= 2) {
    lines.push(
      `📈 **Kỹ năng nổi bật:** ${strongest.label} (${round1(strongest.avg)}/100). ` +
      `**Kỹ năng cần cải thiện:** ${weakest.label} (${round1(weakest.avg)}/100).`
    )
  }

  // Distribution comment
  if (spread > 30) {
    lines.push(
      `⚠️ **Phân bố điểm:** Có sự chênh lệch lớn giữa học viên giỏi nhất (${round1(scoreMax)}) và yếu nhất (${round1(scoreMin)}). ` +
      'Giáo viên nên chú ý phân hóa bài tập theo trình độ.'
    )
  } else if (spread <= 15) {
    lines.push(
      `✅ **Phân bố điểm:** Lớp có trình độ đồng đều (khoảng cách ${round1(spread)} điểm), thuận lợi cho giảng dạy nhóm.`
    )
  }

  // Recommendations based on weak skills
  if (weakest) {
    const recs: Record<string, string> = {
      'Đọc hiểu': 'Tăng cường luyện đọc với các đoạn văn ngắn, câu hỏi hiểu ý và từ vựng theo chủ đề.',
      'Nghe hiểu': 'Bổ sung bài nghe đa dạng giọng (Anh, Mỹ, Úc), luyện nghe chép từ và điền vào chỗ trống.',
      'Nói': 'Tổ chức nhiều hoạt động pair-work, role-play và thảo luận nhóm nhỏ để học viên tự tin hơn.',
      'Viết': 'Rèn cấu trúc đoạn văn, bổ sung từ nối và luyện viết hàng ngày với chủ đề quen thuộc.',
    }
    const rec = recs[weakest.label]
    if (rec) {
      lines.push(`💡 **Đề xuất:** ${rec}`)
    }
  }

  // At-risk students
  const atRisk = withScores.filter(r => r.total_score !== null && r.total_score < test.pass_threshold * 0.8)
  if (atRisk.length > 0) {
    const names = atRisk
      .map(r => r.student?.full_name ?? 'Học viên')
      .slice(0, 3)
      .join(', ')
    const more = atRisk.length > 3 ? ` và ${atRisk.length - 3} học viên khác` : ''
    lines.push(
      `🔔 **Học viên cần quan tâm đặc biệt:** ${names}${more} — điểm dưới ${Math.round(test.pass_threshold * 0.8)}/100. ` +
      'Nên sắp xếp buổi học thêm hoặc tư vấn phụ huynh.'
    )
  }

  return lines.join('\n\n')
}

export function generateStudentFeedback(result: DbTestResult, test: DbTest): string {
  const score = result.total_score
  if (score === null) return 'Chưa có điểm số.'

  const isPassed = result.is_passed ?? score >= test.pass_threshold
  const name = result.student?.full_name ?? 'Học viên'

  const skillRows = SKILL_KEYS
    .map(k => ({ label: SKILL_LABELS[k], score: result[k] as number | null }))
    .filter(s => s.score !== null)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))

  const weakSkills = skillRows.slice(0, 2).filter(s => (s.score ?? 0) < 70)
  const strongSkills = skillRows.slice(-1).filter(s => (s.score ?? 0) >= 75)

  const parts: string[] = []

  if (isPassed) {
    parts.push(
      score >= 85
        ? `${name} đạt kết quả xuất sắc với ${score}/100. Tiếp tục phát huy!`
        : `${name} đã vượt qua bài kiểm tra với ${score}/100. Tốt lắm!`
    )
  } else {
    parts.push(`${name} đạt ${score}/100, chưa đạt ngưỡng ${test.pass_threshold}. Cần cố gắng thêm.`)
  }

  if (strongSkills.length > 0) {
    parts.push(`Điểm mạnh: ${strongSkills.map(s => `${s.label} (${round1(s.score)})`).join(', ')}.`)
  }

  if (weakSkills.length > 0) {
    parts.push(`Cần cải thiện: ${weakSkills.map(s => `${s.label} (${round1(s.score)})`).join(', ')}.`)
  }

  return parts.join(' ')
}
