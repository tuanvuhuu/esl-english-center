-- ============================================================
-- ESL ENGLISH CENTER — SUPABASE SCHEMA (v2)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- HELPER: tự cập nhật updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Macro tạo trigger nhanh
-- (dùng trong từng bảng bên dưới)

-- ============================================================
-- 1. BRANCHES (cơ sở)
-- ============================================================
CREATE TABLE branches (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code                TEXT NOT NULL UNIQUE,           -- CS1, CS2, CSBT...
  name                TEXT NOT NULL,                  -- Cơ sở Quận 1, Cơ sở Bình Thạnh
  address             TEXT,
  phone               TEXT,
  email               TEXT,
  manager_id          UUID,                           -- FK → profiles (set sau)
  status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'inactive')),
  notes               TEXT,

  -- base fields
  is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID,                           -- FK → profiles (set sau)
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by          UUID
);

CREATE TRIGGER trg_branches_updated_at
  BEFORE UPDATE ON branches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 2. ACADEMIC_YEARS (năm học)
-- ============================================================
CREATE TABLE academic_years (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL UNIQUE,           -- "2025-2026"
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  is_current          BOOLEAN NOT NULL DEFAULT FALSE,
  notes               TEXT,

  CONSTRAINT chk_academic_year_dates CHECK (end_date > start_date),

  -- base fields
  is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by          UUID
);

-- Đảm bảo chỉ có 1 năm học hiện tại
CREATE UNIQUE INDEX idx_academic_years_current
  ON academic_years (is_current) WHERE is_current = TRUE;

CREATE TRIGGER trg_academic_years_updated_at
  BEFORE UPDATE ON academic_years
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 3. ROLES (vai trò người dùng)
-- ============================================================
CREATE TABLE roles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL UNIQUE,       -- 'admin', 'manager', 'teacher', 'staff'
  display_name  TEXT NOT NULL,              -- 'Quản trị viên', 'Quản lý', ...
  description   TEXT,
  is_system     BOOLEAN NOT NULL DEFAULT TRUE,

  is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by    UUID,                       -- FK → profiles (set sau)
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by    UUID
);

CREATE TRIGGER trg_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 4. PERMISSIONS (danh sách quyền hạn)
-- ============================================================
CREATE TABLE permissions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource      TEXT NOT NULL,              -- 'students', 'classes', 'payments', ...
  action        TEXT NOT NULL,              -- 'view', 'create', 'edit', 'delete', 'export'
  display_name  TEXT,

  UNIQUE (resource, action),

  is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by    UUID,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by    UUID
);

CREATE TRIGGER trg_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 5. ROLE_PERMISSIONS (phân quyền theo role)
-- ============================================================
CREATE TABLE role_permissions (
  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ============================================================
-- 6. PROFILES (tài khoản hệ thống — extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name           TEXT NOT NULL,
  role_id             UUID REFERENCES roles(id),
  phone               TEXT,
  avatar_url          TEXT,
  branch_id           UUID REFERENCES branches(id),  -- cơ sở chính

  -- base fields
  is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID REFERENCES profiles(id),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by          UUID REFERENCES profiles(id)
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Gắn FK bị hoãn ở branches, academic_years, roles, permissions
ALTER TABLE branches
  ADD CONSTRAINT fk_branches_manager  FOREIGN KEY (manager_id)  REFERENCES profiles(id),
  ADD CONSTRAINT fk_branches_created  FOREIGN KEY (created_by)  REFERENCES profiles(id),
  ADD CONSTRAINT fk_branches_updated  FOREIGN KEY (updated_by)  REFERENCES profiles(id);

ALTER TABLE academic_years
  ADD CONSTRAINT fk_academic_years_created FOREIGN KEY (created_by) REFERENCES profiles(id),
  ADD CONSTRAINT fk_academic_years_updated FOREIGN KEY (updated_by) REFERENCES profiles(id);

ALTER TABLE roles
  ADD CONSTRAINT fk_roles_created FOREIGN KEY (created_by) REFERENCES profiles(id),
  ADD CONSTRAINT fk_roles_updated FOREIGN KEY (updated_by) REFERENCES profiles(id);

ALTER TABLE permissions
  ADD CONSTRAINT fk_permissions_created FOREIGN KEY (created_by) REFERENCES profiles(id),
  ADD CONSTRAINT fk_permissions_updated FOREIGN KEY (updated_by) REFERENCES profiles(id);

-- ============================================================
-- 4. PARENTS (phụ huynh — đầy đủ thông tin liên lạc)
-- ============================================================
CREATE TABLE parents (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name           TEXT NOT NULL,
  gender              CHAR(1) CHECK (gender IN ('M', 'F')),
  dob                 DATE,

  -- Thông tin liên lạc đầy đủ
  phone               TEXT NOT NULL,                  -- số chính
  phone_secondary     TEXT,                           -- số phụ / zalo
  email               TEXT,

  address             TEXT,
  -- Nghề nghiệp (hữu ích cho tư vấn)
  occupation          TEXT,
  notes               TEXT,

  -- base fields
  is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID REFERENCES profiles(id),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by          UUID REFERENCES profiles(id)
);

CREATE TRIGGER trg_parents_updated_at
  BEFORE UPDATE ON parents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 5. STUDENTS (học sinh)
-- ============================================================
CREATE TABLE students (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name           TEXT NOT NULL,
  dob                 DATE,
  gender              CHAR(1) CHECK (gender IN ('M', 'F')),
  level               TEXT,                           -- A1, A2, B1, B2, C1
  phone               TEXT,                           -- số riêng nếu là teen
  email               TEXT,
  photo_url           TEXT,
  status              TEXT NOT NULL DEFAULT 'trial'
                        CHECK (status IN ('active', 'trial', 'paused', 'inactive')),
  enroll_date         DATE,
  notes               TEXT,

  -- base fields
  is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID REFERENCES profiles(id),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by          UUID REFERENCES profiles(id)
);

CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 6. STUDENT_PARENTS (quan hệ học sinh ↔ phụ huynh)
-- ============================================================
CREATE TABLE student_parents (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id          UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id           UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  relation            TEXT NOT NULL
                        CHECK (relation IN ('father', 'mother', 'grandfather', 'grandmother', 'guardian', 'other')),
  is_primary          BOOLEAN NOT NULL DEFAULT FALSE, -- liên lạc chính
  is_emergency        BOOLEAN NOT NULL DEFAULT FALSE, -- liên hệ khẩn cấp
  notes               TEXT,

  UNIQUE (student_id, parent_id),

  -- base fields
  is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID REFERENCES profiles(id),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by          UUID REFERENCES profiles(id)
);

CREATE TRIGGER trg_student_parents_updated_at
  BEFORE UPDATE ON student_parents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 7. STUDENT_ACADEMIC_RECORDS (lịch sử HS theo năm học + cơ sở)
-- ============================================================
CREATE TABLE student_academic_records (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id          UUID NOT NULL REFERENCES students(id),
  academic_year_id    UUID NOT NULL REFERENCES academic_years(id),
  branch_id           UUID NOT NULL REFERENCES branches(id),
  level               TEXT,                           -- trình độ năm đó
  status              TEXT NOT NULL DEFAULT 'enrolled'
                        CHECK (status IN ('enrolled', 'completed', 'transferred', 'dropped', 'paused')),
  transferred_from    UUID REFERENCES branches(id),  -- nếu chuyển cơ sở
  transferred_to      UUID REFERENCES branches(id),
  transfer_date       DATE,
  notes               TEXT,

  UNIQUE (student_id, academic_year_id),              -- 1 HS 1 record/năm học

  -- base fields
  is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID REFERENCES profiles(id),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by          UUID REFERENCES profiles(id)
);

CREATE TRIGGER trg_student_academic_records_updated_at
  BEFORE UPDATE ON student_academic_records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 8. TEACHERS (giáo viên)
-- ============================================================
CREATE TABLE teachers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id          UUID REFERENCES profiles(id),  -- nếu GV có tài khoản
  full_name           TEXT NOT NULL,
  nationality         TEXT,
  phone               TEXT,
  email               TEXT,
  color               TEXT,                           -- màu hiển thị UI
  bio                 TEXT,
  join_date           DATE,
  primary_branch_id   UUID REFERENCES branches(id),  -- cơ sở chính
  status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'on-leave', 'inactive')),

  -- base fields
  is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID REFERENCES profiles(id),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by          UUID REFERENCES profiles(id)
);

CREATE TRIGGER trg_teachers_updated_at
  BEFORE UPDATE ON teachers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- GV có thể dạy nhiều cơ sở
CREATE TABLE teacher_branches (
  teacher_id          UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  branch_id           UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  PRIMARY KEY (teacher_id, branch_id)
);

-- ============================================================
-- 9. SUBJECTS & TEACHER_SUBJECTS
-- ============================================================
CREATE TABLE subjects (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL UNIQUE,           -- Speaking, Grammar, IELTS...

  -- base fields
  is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID REFERENCES profiles(id),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by          UUID REFERENCES profiles(id)
);

CREATE TRIGGER trg_subjects_updated_at
  BEFORE UPDATE ON subjects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE teacher_subjects (
  teacher_id          UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id          UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (teacher_id, subject_id)
);

-- ============================================================
-- 10. ROOMS (phòng học)
-- ============================================================
CREATE TABLE rooms (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id           UUID NOT NULL REFERENCES branches(id),
  name                TEXT NOT NULL,                  -- P.201, P.301...
  floor               TEXT,
  capacity            INT,
  type                TEXT CHECK (type IN ('Kids', 'Teens', 'Multi', 'Tutorial')),
  status              TEXT NOT NULL DEFAULT 'available'
                        CHECK (status IN ('available', 'in-use', 'maintenance')),
  equipment           JSONB DEFAULT '[]',             -- ["Máy chiếu", "Loa"]

  UNIQUE (branch_id, name),

  -- base fields
  is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID REFERENCES profiles(id),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by          UUID REFERENCES profiles(id)
);

CREATE TRIGGER trg_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 11. COURSES (chương trình học — template dùng chung)
-- ============================================================
CREATE TABLE courses (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,                  -- Kids Starter, Teen Pre-Inter...
  level               TEXT,
  age_min             INT,
  age_max             INT,
  description         TEXT,

  -- base fields
  is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID REFERENCES profiles(id),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by          UUID REFERENCES profiles(id)
);

CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 12. CLASSES (lớp học thực tế)
-- ============================================================
CREATE TABLE classes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  branch_id           UUID NOT NULL REFERENCES branches(id),
  academic_year_id    UUID NOT NULL REFERENCES academic_years(id),
  course_id           UUID REFERENCES courses(id),
  teacher_id          UUID REFERENCES teachers(id),
  room_id             UUID REFERENCES rooms(id),
  level               TEXT,
  age_group           TEXT,                           -- "5-7", "11-14"
  max_students        INT DEFAULT 15,
  status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'inactive', 'completed', 'cancelled')),
  start_date          DATE,
  end_date            DATE,
  fee_per_month       BIGINT,                         -- VND

  -- base fields
  is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID REFERENCES profiles(id),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by          UUID REFERENCES profiles(id)
);

CREATE TRIGGER trg_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 13. CLASS_SCHEDULES (lịch học của lớp)
-- ============================================================
CREATE TABLE class_schedules (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id            UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  day_of_week         INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=CN, 1=T2...
  start_time          TIME NOT NULL,
  end_time            TIME NOT NULL,

  -- base fields
  is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID REFERENCES profiles(id),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by          UUID REFERENCES profiles(id)
);

CREATE TRIGGER trg_class_schedules_updated_at
  BEFORE UPDATE ON class_schedules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 14. ENROLLMENTS (học sinh đăng ký lớp)
-- ============================================================
CREATE TABLE enrollments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id          UUID NOT NULL REFERENCES students(id),
  class_id            UUID NOT NULL REFERENCES classes(id),
  enrolled_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'dropped', 'completed', 'trial')),
  notes               TEXT,

  UNIQUE (student_id, class_id),

  -- base fields
  is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID REFERENCES profiles(id),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by          UUID REFERENCES profiles(id)
);

CREATE TRIGGER trg_enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 15. ATTENDANCE (điểm danh)
-- ============================================================
CREATE TABLE attendance (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id       UUID NOT NULL REFERENCES enrollments(id),
  session_date        DATE NOT NULL,
  status              TEXT NOT NULL DEFAULT 'present'
                        CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes               TEXT,
  marked_by           UUID REFERENCES profiles(id),

  UNIQUE (enrollment_id, session_date),

  -- base fields
  is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID REFERENCES profiles(id),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by          UUID REFERENCES profiles(id)
);

CREATE TRIGGER trg_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 16. PAYMENTS (học phí)
-- ============================================================
CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id          UUID NOT NULL REFERENCES students(id),
  class_id            UUID REFERENCES classes(id),
  branch_id           UUID REFERENCES branches(id),
  academic_year_id    UUID REFERENCES academic_years(id),
  amount              BIGINT NOT NULL,                -- VND
  payment_date        DATE,
  due_date            DATE,
  period_month        INT CHECK (period_month BETWEEN 1 AND 12),
  period_year         INT,
  type                TEXT NOT NULL DEFAULT 'tuition'
                        CHECK (type IN ('tuition', 'material', 'exam_fee', 'other')),
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('paid', 'pending', 'overdue', 'cancelled')),
  payment_method      TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'momo', 'vnpay')),
  notes               TEXT,
  received_by         UUID REFERENCES profiles(id),

  -- base fields
  is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID REFERENCES profiles(id),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by          UUID REFERENCES profiles(id)
);

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 17. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES profiles(id),   -- NULL = broadcast
  branch_id           UUID REFERENCES branches(id),   -- NULL = tất cả cơ sở
  title               TEXT NOT NULL,
  body                TEXT,
  type                TEXT NOT NULL DEFAULT 'info'
                        CHECK (type IN ('info', 'warning', 'alert', 'success')),
  entity_type         TEXT,                           -- 'student', 'payment', 'class'...
  entity_id           UUID,
  is_read             BOOLEAN NOT NULL DEFAULT FALSE,

  -- base fields
  is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID REFERENCES profiles(id),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by          UUID REFERENCES profiles(id)
);

CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_students_status          ON students(status)                WHERE is_deleted = FALSE;
CREATE INDEX idx_students_level           ON students(level)                 WHERE is_deleted = FALSE;
CREATE INDEX idx_teachers_status          ON teachers(status)                WHERE is_deleted = FALSE;
CREATE INDEX idx_teachers_branch          ON teachers(primary_branch_id)     WHERE is_deleted = FALSE;
CREATE INDEX idx_rooms_branch             ON rooms(branch_id)                WHERE is_deleted = FALSE;
CREATE INDEX idx_classes_branch           ON classes(branch_id)              WHERE is_deleted = FALSE;
CREATE INDEX idx_classes_academic_year    ON classes(academic_year_id)       WHERE is_deleted = FALSE;
CREATE INDEX idx_classes_teacher          ON classes(teacher_id)             WHERE is_deleted = FALSE;
CREATE INDEX idx_classes_status           ON classes(status)                 WHERE is_deleted = FALSE;
CREATE INDEX idx_enrollments_student      ON enrollments(student_id)         WHERE is_deleted = FALSE;
CREATE INDEX idx_enrollments_class        ON enrollments(class_id)           WHERE is_deleted = FALSE;
CREATE INDEX idx_attendance_date          ON attendance(session_date)        WHERE is_deleted = FALSE;
CREATE INDEX idx_payments_student         ON payments(student_id)            WHERE is_deleted = FALSE;
CREATE INDEX idx_payments_status          ON payments(status)                WHERE is_deleted = FALSE;
CREATE INDEX idx_payments_period          ON payments(period_year, period_month);
CREATE INDEX idx_payments_branch_year     ON payments(branch_id, academic_year_id);
CREATE INDEX idx_notifications_user       ON notifications(user_id, is_read) WHERE is_deleted = FALSE;
CREATE INDEX idx_sar_student_year         ON student_academic_records(student_id, academic_year_id);
CREATE INDEX idx_sar_branch_year          ON student_academic_records(branch_id, academic_year_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE roles                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years            ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE students                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_parents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_academic_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_branches          ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_subjects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules           ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance                ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications             ENABLE ROW LEVEL SECURITY;

-- Policy tạm thời: authenticated user đọc/ghi tất cả
DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    'roles','permissions','role_permissions',
    'branches','academic_years','profiles','parents','students',
    'student_parents','student_academic_records','teachers','teacher_branches',
    'subjects','teacher_subjects','rooms','courses','classes',
    'class_schedules','enrollments','attendance','payments','notifications'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format(
      'CREATE POLICY "auth_read_%1$s"  ON %1$s FOR SELECT USING (auth.role() = ''authenticated'');
       CREATE POLICY "auth_write_%1$s" ON %1$s FOR ALL    USING (auth.role() = ''authenticated'');',
      tbl
    );
  END LOOP;
END $$;
