import { supabase } from '../lib/supabase'

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export interface DbAttendance {
  id: string
  enrollment_id: string
  session_date: string
  status: AttendanceStatus
  notes: string | null
  marked_by: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
}

/**
 * Get attendance records for 1 class on a specific date.
 * Returns map: enrollment_id → DbAttendance
 */
export async function getAttendanceByClassDate(
  classId: string,
  date: string
): Promise<Record<string, DbAttendance>> {
  // First get enrollment IDs for this class
  const { data: enrollments, error: eErr } = await supabase
    .from('enrollments')
    .select('id')
    .eq('class_id', classId)
    .eq('is_deleted', false)
  if (eErr) throw eErr

  const enrollmentIds = (enrollments ?? []).map(e => e.id)
  if (enrollmentIds.length === 0) return {}

  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .in('enrollment_id', enrollmentIds)
    .eq('session_date', date)
    .eq('is_deleted', false)
  if (error) throw error

  const map: Record<string, DbAttendance> = {}
  for (const r of data ?? []) map[r.enrollment_id] = r as DbAttendance
  return map
}

/**
 * Upsert attendance for 1 enrollment + 1 date.
 */
export async function upsertAttendance(payload: {
  enrollment_id: string
  session_date: string
  status: AttendanceStatus
  notes?: string | null
}): Promise<DbAttendance> {
  const { data, error } = await supabase
    .from('attendance')
    .upsert(payload, { onConflict: 'enrollment_id,session_date' })
    .select('*')
    .single()
  if (error) throw error
  return data as DbAttendance
}

/**
 * Bulk upsert — useful for "Mark all present"
 */
export async function bulkUpsertAttendance(
  rows: { enrollment_id: string; session_date: string; status: AttendanceStatus; notes?: string | null }[]
): Promise<void> {
  if (rows.length === 0) return
  const { error } = await supabase
    .from('attendance')
    .upsert(rows, { onConflict: 'enrollment_id,session_date' })
  if (error) throw error
}

/**
 * Lịch sử điểm danh của 1 học viên trong khoảng thời gian.
 * Trả về kèm thông tin lớp.
 */
export async function getStudentAttendanceHistory(
  studentId: string,
  fromDate?: string,
  toDate?: string
): Promise<(DbAttendance & { class_name?: string; class_id?: string })[]> {
  let q = supabase
    .from('attendance')
    .select(`
      *,
      enrollment: enrollments!enrollment_id (
        id,
        student_id,
        class: classes ( id, name )
      )
    `)
    .eq('is_deleted', false)

  if (fromDate) q = q.gte('session_date', fromDate)
  if (toDate)   q = q.lte('session_date', toDate)

  const { data, error } = await q.order('session_date', { ascending: false })
  if (error) throw error

  return ((data ?? []) as any[])
    .filter(r => r.enrollment?.student_id === studentId)
    .map(r => ({
      ...r,
      class_name: r.enrollment?.class?.name,
      class_id: r.enrollment?.class?.id,
    }))
}

/**
 * Daily attendance breakdown for a class — useful for trend charts.
 */
export async function getClassDailyAttendance(
  classId: string,
  fromDate: string,
  toDate: string,
): Promise<{ date: string; present: number; absent: number; late: number; excused: number; total: number; rate: number }[]> {
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id')
    .eq('class_id', classId)
    .eq('is_deleted', false)

  const enrollmentIds = (enrollments ?? []).map(e => e.id)
  if (enrollmentIds.length === 0) return []

  const { data, error } = await supabase
    .from('attendance')
    .select('session_date,status')
    .in('enrollment_id', enrollmentIds)
    .gte('session_date', fromDate)
    .lte('session_date', toDate)
    .eq('is_deleted', false)
  if (error) throw error

  const byDate: Record<string, { present: number; absent: number; late: number; excused: number }> = {}
  for (const r of (data ?? []) as { session_date: string; status: AttendanceStatus }[]) {
    if (!byDate[r.session_date]) byDate[r.session_date] = { present: 0, absent: 0, late: 0, excused: 0 }
    byDate[r.session_date][r.status]++
  }

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, c]) => {
      const total = c.present + c.absent + c.late + c.excused
      const rate = total > 0 ? Math.round(((c.present + c.late) / total) * 100) : 0
      return { date, ...c, total, rate }
    })
}

/**
 * Stats cho dashboard / class card: % chuyên cần trong khoảng thời gian.
 */
export async function getClassAttendanceStats(
  classId: string,
  fromDate: string,
  toDate: string
): Promise<{ totalSessions: number; presentCount: number; absentCount: number; lateCount: number; excusedCount: number; rate: number }> {
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id')
    .eq('class_id', classId)
    .eq('is_deleted', false)

  const enrollmentIds = (enrollments ?? []).map(e => e.id)
  if (enrollmentIds.length === 0) {
    return { totalSessions: 0, presentCount: 0, absentCount: 0, lateCount: 0, excusedCount: 0, rate: 0 }
  }

  const { data, error } = await supabase
    .from('attendance')
    .select('status')
    .in('enrollment_id', enrollmentIds)
    .gte('session_date', fromDate)
    .lte('session_date', toDate)
    .eq('is_deleted', false)
  if (error) throw error

  const counts = { present: 0, absent: 0, late: 0, excused: 0 }
  for (const r of data ?? []) counts[r.status as AttendanceStatus]++

  const total = counts.present + counts.absent + counts.late + counts.excused
  const rate = total > 0 ? Math.round(((counts.present + counts.late) / total) * 100) : 0
  return {
    totalSessions: total,
    presentCount:  counts.present,
    absentCount:   counts.absent,
    lateCount:     counts.late,
    excusedCount:  counts.excused,
    rate,
  }
}
