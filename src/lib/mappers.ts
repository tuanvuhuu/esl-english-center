// Convert Supabase DB types → UI component types
import type { DbStudent, DbTeacher, DbClass, DbPayment, DbRoom, DbNotification } from '../types/database'
import type { Student, Teacher, Class, Payment, Room, Notification } from '../types/data'

function initials(name: string) {
  return name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()
}

function formatSchedule(schedules: { day_of_week: number; start_time: string; end_time: string }[]): string {
  if (!schedules?.length) return ''
  const DAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  const days = schedules.map(s => DAY[s.day_of_week]).join(', ')
  const { start_time, end_time } = schedules[0]
  return `${days} · ${start_time.slice(0, 5)}-${end_time.slice(0, 5)}`
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function mapStudent(s: DbStudent): Student {
  const primaryParent = s.student_parents?.find(sp => sp.is_primary) ?? s.student_parents?.[0]
  return {
    id: s.id,
    name: s.full_name,
    avatar: initials(s.full_name),
    level: s.level ?? '',
    gender: s.gender ?? undefined,
    dob: s.dob ? formatDate(s.dob) : undefined,
    email: s.email ?? undefined,
    status: s.status,
    enrollDate: s.enroll_date ? formatDate(s.enroll_date) : undefined,
    // phụ huynh
    parent: primaryParent?.parent?.full_name ?? '',
    phone: primaryParent?.parent?.phone ?? '',
    parentEmail: primaryParent?.parent?.email ?? undefined,
    parentAddress: primaryParent?.parent?.address ?? undefined,
    parentRelation: primaryParent?.relation ?? undefined,
  }
}

export function mapTeacher(t: DbTeacher): Teacher {
  return {
    id: t.id,
    name: t.full_name,
    avatar: initials(t.full_name),
    nationality: t.nationality ?? '',
    phone: t.phone ?? '',
    email: t.email ?? '',
    color: t.color ?? '#6366f1',
    status: t.status,
    subjects: t.teacher_subjects?.map(ts => ts.subject.name) ?? [],
    classCount: 0, // computed từ classes nếu cần
    bio: t.bio ?? undefined,
    joinDate: t.join_date ? formatDate(t.join_date) : undefined,
    branchIds: t.teacher_branches?.map(tb => tb.branch_id) ?? [],
    branches: (t as any).teacher_branches?.map((tb: any) => tb.branch?.name).filter(Boolean) ?? [],
  }
}

export function mapClass(c: DbClass): Class {
  return {
    id: c.id,
    name: c.name,
    level: c.level ?? '',
    ageGroup: c.age_group ?? '',
    teacher: c.teacher?.full_name ?? '',
    teacherId: c.teacher_id ?? '',
    room: c.room?.name ?? '',
    schedule: formatSchedule(c.class_schedules ?? []),
    days: c.class_schedules?.map(s => s.day_of_week) ?? [],
    time: c.class_schedules?.[0]?.start_time?.slice(0, 5) ?? '',
    endTime: c.class_schedules?.[0]?.end_time?.slice(0, 5) ?? '',
    students: c.enrollments?.length ?? 0,
    maxStudents: c.max_students,
    status: (c.status === 'active' ? 'active' : c.status === 'inactive' ? 'paused' : 'inactive') as Class['status'],
    startDate: c.start_date ? formatDate(c.start_date) : undefined,
    endDate: c.end_date ? formatDate(c.end_date) : undefined,
    fee: c.fee_per_month ? c.fee_per_month.toLocaleString('vi-VN') + 'đ/tháng' : '',
  }
}

export function mapPayment(p: DbPayment): Payment {
  return {
    id: p.id,
    student: p.student?.full_name ?? '',
    amount: p.amount,
    date: p.payment_date ? formatDate(p.payment_date) : formatDate(p.due_date),
    type: p.type === 'tuition' ? 'Học phí' : p.type === 'material' ? 'Học liệu' : p.type === 'exam_fee' ? 'Phí thi' : 'Khác',
    status: p.status as Payment['status'],
  }
}

export function mapRoom(r: DbRoom): Room {
  return {
    id: r.id,
    name: r.name,
    floor: r.floor ?? '',
    capacity: r.capacity ?? 0,
    type: r.type ?? '',
    status: r.status,
    equipment: Array.isArray(r.equipment) ? r.equipment : [],
  }
}

export function mapNotification(n: DbNotification): Notification {
  return {
    id: n.id,
    title: n.title,
    desc: n.body ?? '',
    time: formatRelativeTime(n.created_at),
    type: n.type,
    read: n.is_read,
  }
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} phút trước`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} giờ trước`
  return `${Math.floor(hrs / 24)} ngày trước`
}
