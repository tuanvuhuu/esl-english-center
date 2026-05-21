-- ============================================================
-- CREATE TABLE: student_levels (danh mục trình độ động)
-- ============================================================

CREATE TABLE IF NOT EXISTS student_levels (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  value               TEXT NOT NULL UNIQUE,           -- 'A1', 'A2', 'B1', 'B2', 'C1'...
  label               TEXT NOT NULL,                  -- 'A1 · Starter', 'A2 · Elementary'...
  is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tự động cập nhật updated_at
CREATE TRIGGER trg_student_levels_updated_at
  BEFORE UPDATE ON student_levels
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Bật Row Level Security (RLS)
ALTER TABLE student_levels ENABLE ROW LEVEL SECURITY;

-- Các chính sách bảo mật cho authenticated users
CREATE POLICY "auth_read_student_levels"  ON student_levels FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_student_levels" ON student_levels FOR ALL    USING (auth.role() = 'authenticated');

-- Chèn các trình độ mặc định
INSERT INTO student_levels (value, label) VALUES
  ('A1', 'A1 · Starter'),
  ('A2', 'A2 · Elementary'),
  ('B1', 'B1 · Pre-Inter'),
  ('B2', 'B2 · Intermediate')
ON CONFLICT (value) DO NOTHING;
