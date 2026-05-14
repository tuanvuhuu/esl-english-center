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

const SKILL_ENCOURAGEMENT: Record<string, { great: string; good: string; tryMore: string }> = {
  'Đọc hiểu': {
    great:   'Con đọc hiểu rất giỏi, hiểu bài nhanh và chính xác!',
    good:    'Con đọc hiểu khá tốt, cố gắng thêm một chút nữa là xuất sắc rồi!',
    tryMore: 'Con cần luyện đọc thêm mỗi ngày nhé, chỉ cần 5–10 phút đọc sách tiếng Anh là con sẽ tiến bộ rất nhanh!',
  },
  'Nghe hiểu': {
    great:   'Khả năng nghe của con rất tốt, con nghe và hiểu tiếng Anh rất nhanh!',
    good:    'Con nghe khá tốt rồi, tiếp tục nghe nhạc và xem phim hoạt hình tiếng Anh nhé!',
    tryMore: 'Con hãy nghe tiếng Anh nhiều hơn nhé — nghe nhạc thiếu nhi, xem hoạt hình tiếng Anh mỗi ngày sẽ giúp con tiến bộ rất nhanh!',
  },
  'Nói': {
    great:   'Con nói tiếng Anh rất tự tin và rõ ràng, cô rất tự hào về con!',
    good:    'Con nói tiếng Anh khá mạnh dạn, hãy tiếp tục mạnh dạn nói nhiều hơn nhé!',
    tryMore: 'Con hãy mạnh dạn nói tiếng Anh hơn nhé, đừng sợ sai — cứ nói là con sẽ giỏi thôi!',
  },
  'Viết': {
    great:   'Con viết tiếng Anh rất đẹp và chính xác, con học rất chăm chỉ!',
    good:    'Con viết khá tốt rồi, luyện viết thêm mỗi ngày con sẽ giỏi hơn nữa!',
    tryMore: 'Con hãy luyện viết thêm nhé — mỗi ngày tập viết vài từ hay một câu ngắn là con sẽ tiến bộ rất nhiều!',
  },
}

const pickFirst = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

const PRAISE_OPENERS = [
  'Cô rất vui khi thấy con cố gắng trong bài kiểm tra này!',
  'Con đã làm bài rất nghiêm túc, cô rất tự hào về con!',
  'Bài kiểm tra này cho thấy con đã học rất chăm chỉ!',
]

const CLOSING_ENCOURAGEMENT = [
  'Cô tin con sẽ ngày càng giỏi hơn nữa! Cố lên nhé! 🌟',
  'Con học rất ngoan, hãy tiếp tục cố gắng nhé! 💪',
  'Cô mong con sẽ tiếp tục yêu thích tiếng Anh và học thật vui! ⭐',
  'Giỏi lắm! Cô chờ xem con tiến bộ thêm trong bài tới nhé! 🎉',
]

export function generateStudentFeedback(result: DbTestResult, test: DbTest): string {
  const score = result.total_score
  if (score === null) return 'Chưa có điểm số để nhận xét.'

  const isPassed = result.is_passed ?? score >= test.pass_threshold
  const firstName = (result.student?.full_name ?? '').split(' ').pop() || 'con'

  const skillRows = SKILL_KEYS
    .map(k => ({ key: k, label: SKILL_LABELS[k], score: result[k] as number | null }))
    .filter(s => s.score !== null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))

  const hasSkillData = skillRows.length >= 2
  const strongest = skillRows[0]
  const weakest   = skillRows[skillRows.length - 1]

  const lines: string[] = []

  // 1. Mở đầu — khen ngợi chung
  lines.push(pickFirst(PRAISE_OPENERS))

  // 2. Nhận xét điểm tổng — nhẹ nhàng, tích cực
  if (isPassed) {
    if (score >= 90) {
      lines.push(`**${firstName}** đạt **${score}/100** — xuất sắc! Con làm bài rất tốt, cô rất vui và tự hào về con. 🏆`)
    } else if (score >= 75) {
      lines.push(`**${firstName}** đạt **${score}/100** — giỏi lắm! Con đã vượt qua bài kiểm tra một cách tự tin.`)
    } else {
      lines.push(`**${firstName}** đạt **${score}/100** — con đã vượt qua bài kiểm tra rồi, cô rất vui! Cố gắng thêm một chút nữa là con sẽ đạt điểm cao hơn thôi.`)
    }
  } else {
    if (score >= test.pass_threshold * 0.85) {
      lines.push(`**${firstName}** đạt **${score}/100** — con đã rất cố gắng rồi! Lần sau con chỉ cần thêm một chút nữa là qua được bài kiểm tra này, cô tin con làm được!`)
    } else {
      lines.push(`**${firstName}** đạt **${score}/100** — con đã cố gắng rồi, cô ghi nhận điều đó! Lần tới con ôn bài kỹ hơn một chút, con chắc chắn sẽ làm tốt hơn nhé.`)
    }
  }

  // 3. Khen kỹ năng mạnh nhất
  if (hasSkillData && strongest.score !== null) {
    const enc = SKILL_ENCOURAGEMENT[strongest.label]
    if (enc) {
      const praise = strongest.score >= 80 ? enc.great : enc.good
      lines.push(praise)
    }
  }

  // 4. Góp ý nhẹ nhàng cho kỹ năng yếu nhất (chỉ khi chênh lệch rõ hoặc điểm thấp)
  if (hasSkillData && weakest.score !== null && weakest.score < 70 && weakest.label !== strongest.label) {
    const enc = SKILL_ENCOURAGEMENT[weakest.label]
    if (enc) lines.push(enc.tryMore)
  }

  // 5. Lời kết động viên
  lines.push(pickFirst(CLOSING_ENCOURAGEMENT))

  return lines.join('\n')
}
