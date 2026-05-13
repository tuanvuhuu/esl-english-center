-- ============================================================
-- MIGRATION: Thêm roles, permissions, role_permissions
-- Chạy file này nếu đã có schema cũ (branches, students... đã tồn tại)
-- ============================================================

-- ============================================================
-- 1. TẠO BẢNG MỚI
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  description   TEXT,
  is_system     BOOLEAN NOT NULL DEFAULT TRUE,

  is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by    UUID,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by    UUID
);

CREATE OR REPLACE TRIGGER trg_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS permissions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource      TEXT NOT NULL,
  action        TEXT NOT NULL,
  display_name  TEXT,

  UNIQUE (resource, action),

  is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by    UUID,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by    UUID
);

CREATE OR REPLACE TRIGGER trg_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ============================================================
-- 2. THÊM FK TỪ roles/permissions → profiles (nếu chưa có)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_roles_created') THEN
    ALTER TABLE roles ADD CONSTRAINT fk_roles_created FOREIGN KEY (created_by) REFERENCES profiles(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_roles_updated') THEN
    ALTER TABLE roles ADD CONSTRAINT fk_roles_updated FOREIGN KEY (updated_by) REFERENCES profiles(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_permissions_created') THEN
    ALTER TABLE permissions ADD CONSTRAINT fk_permissions_created FOREIGN KEY (created_by) REFERENCES profiles(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_permissions_updated') THEN
    ALTER TABLE permissions ADD CONSTRAINT fk_permissions_updated FOREIGN KEY (updated_by) REFERENCES profiles(id);
  END IF;
END $$;

-- ============================================================
-- 3. SỬA BẢNG profiles: xóa cột role cũ, thêm role_id
-- ============================================================

ALTER TABLE profiles DROP COLUMN IF EXISTS role;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id);

-- ============================================================
-- 4. RLS CHO BẢNG MỚI
-- ============================================================

ALTER TABLE roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY['roles', 'permissions', 'role_permissions'];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = tbl AND policyname = 'auth_read_' || tbl
    ) THEN
      EXECUTE format(
        'CREATE POLICY "auth_read_%1$s" ON %1$s FOR SELECT USING (auth.role() = ''authenticated'');',
        tbl
      );
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = tbl AND policyname = 'auth_write_' || tbl
    ) THEN
      EXECUTE format(
        'CREATE POLICY "auth_write_%1$s" ON %1$s FOR ALL USING (auth.role() = ''authenticated'');',
        tbl
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 5. SEED ROLES + PERMISSIONS + ROLE_PERMISSIONS
-- ============================================================

INSERT INTO roles (id, name, display_name, description) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'admin',   'Quản trị viên', 'Toàn quyền hệ thống'),
  ('f0000000-0000-0000-0000-000000000002', 'manager', 'Quản lý',       'Quản lý cơ sở, lớp học, học phí'),
  ('f0000000-0000-0000-0000-000000000003', 'teacher', 'Giáo viên',     'Xem lớp, điểm danh học sinh'),
  ('f0000000-0000-0000-0000-000000000004', 'staff',   'Nhân viên',     'Nhập liệu học sinh, thu học phí')
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (resource, action, display_name)
SELECT r.res, a.act, r.res || ':' || a.act
FROM (VALUES
  ('students'), ('parents'), ('teachers'), ('classes'),
  ('rooms'), ('payments'), ('reports'), ('notifications'),
  ('settings'), ('branches')
) AS r(res)
CROSS JOIN (VALUES
  ('view'), ('create'), ('edit'), ('delete'), ('export')
) AS a(act)
ON CONFLICT (resource, action) DO NOTHING;

-- admin: toàn quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- manager: hầu hết, trừ settings và xóa giáo viên/branches
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON TRUE
WHERE r.name = 'manager'
  AND NOT (p.resource = 'settings')
  AND NOT (p.resource = 'teachers' AND p.action = 'delete')
  AND NOT (p.resource = 'branches' AND p.action IN ('create','delete'))
ON CONFLICT DO NOTHING;

-- teacher: chỉ xem students/parents/classes/notifications
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON TRUE
WHERE r.name = 'teacher'
  AND p.resource IN ('students','parents','classes','notifications')
  AND p.action = 'view'
ON CONFLICT DO NOTHING;

-- staff: nhập/sửa học sinh, phụ huynh, học phí; chỉ xem phần còn lại
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON TRUE
WHERE r.name = 'staff' AND (
  (p.resource IN ('students','parents','payments') AND p.action IN ('view','create','edit'))
  OR (p.resource IN ('classes','rooms','branches','notifications') AND p.action = 'view')
)
ON CONFLICT DO NOTHING;
