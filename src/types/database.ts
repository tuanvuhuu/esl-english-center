// Types khớp với Supabase schema

export interface Role {
  id: string
  name: 'admin' | 'manager' | 'teacher' | 'staff'
  display_name: string
  description: string | null
  is_system: boolean
}

export interface Permission {
  id: string
  resource: string
  action: 'view' | 'create' | 'edit' | 'delete' | 'export'
  display_name: string | null
}

export interface RoleWithPermissions extends Role {
  role_permissions: { permission: Permission }[]
}

export interface Branch {
  id: string
  code: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  manager_id: string | null
  status: 'active' | 'inactive'
  notes: string | null
  is_deleted: boolean
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
}

export interface AcademicYear {
  id: string
  name: string
  start_date: string
  end_date: string
  is_current: boolean
  notes: string | null
  is_deleted: boolean
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
}

export interface Parent {
  id: string
  full_name: string
  gender: 'M' | 'F' | null
  dob: string | null
  phone: string
  phone_secondary: string | null
  email: string | null
  address: string | null
  occupation: string | null
  notes: string | null
  is_deleted: boolean
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
}

export interface StudentParent {
  id: string
  student_id: string
  parent_id: string
  relation: 'father' | 'mother' | 'grandfather' | 'grandmother' | 'guardian' | 'other'
  is_primary: boolean
  is_emergency: boolean
  notes: string | null
  parent?: Parent
}

export interface DbStudent {
  id: string
  full_name: string
  dob: string | null
  gender: 'M' | 'F' | null
  level: string | null
  phone: string | null
  email: string | null
  photo_url: string | null
  status: 'active' | 'trial' | 'paused' | 'inactive'
  enroll_date: string | null
  notes: string | null
  is_deleted: boolean
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
  // joins
  student_parents?: StudentParent[]
}

export interface DbTeacher {
  id: string
  profile_id: string | null
  full_name: string
  nationality: string | null
  phone: string | null
  email: string | null
  color: string | null
  bio: string | null
  join_date: string | null
  primary_branch_id: string | null
  status: 'active' | 'on-leave' | 'inactive'
  is_deleted: boolean
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
  // joins
  teacher_subjects?: { subject: { name: string } }[]
  primary_branch?: Branch
}

export interface DbRoom {
  id: string
  branch_id: string
  name: string
  floor: string | null
  capacity: number | null
  type: 'Kids' | 'Teens' | 'Multi' | 'Tutorial' | null
  status: 'available' | 'in-use' | 'maintenance'
  equipment: string[]
  is_deleted: boolean
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
  branch?: Branch
}

export interface ClassSchedule {
  id: string
  class_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

export interface DbClass {
  id: string
  name: string
  branch_id: string
  academic_year_id: string
  course_id: string | null
  teacher_id: string | null
  room_id: string | null
  level: string | null
  age_group: string | null
  max_students: number
  status: 'active' | 'inactive' | 'completed' | 'cancelled'
  start_date: string | null
  end_date: string | null
  fee_per_month: number | null
  is_deleted: boolean
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
  // joins
  teacher?: DbTeacher
  room?: DbRoom
  class_schedules?: ClassSchedule[]
  enrollments?: { id: string }[]
}

export interface DbPayment {
  id: string
  student_id: string
  class_id: string | null
  branch_id: string | null
  academic_year_id: string | null
  amount: number
  payment_date: string | null
  due_date: string | null
  period_month: number | null
  period_year: number | null
  type: 'tuition' | 'material' | 'exam_fee' | 'other'
  status: 'paid' | 'pending' | 'overdue' | 'cancelled'
  payment_method: 'cash' | 'bank_transfer' | 'momo' | 'vnpay' | null
  notes: string | null
  received_by: string | null
  is_deleted: boolean
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
  // joins
  student?: DbStudent
  class?: DbClass
}

export interface DbNotification {
  id: string
  user_id: string | null
  branch_id: string | null
  title: string
  body: string | null
  type: 'info' | 'warning' | 'alert' | 'success'
  entity_type: string | null
  entity_id: string | null
  is_read: boolean
  is_deleted: boolean
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
}

export interface StudentAcademicRecord {
  id: string
  student_id: string
  academic_year_id: string
  branch_id: string
  level: string | null
  status: 'enrolled' | 'completed' | 'transferred' | 'dropped' | 'paused'
  transferred_from: string | null
  transferred_to: string | null
  transfer_date: string | null
  notes: string | null
  academic_year?: AcademicYear
  branch?: Branch
}
