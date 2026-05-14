-- =============================================================================
-- class_assistants.sql
-- Bảng trợ giảng cho lớp học + sync function
-- =============================================================================

-- ─── 1. Tạo bảng class_assistants ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS class_assistants (
  class_id   UUID NOT NULL REFERENCES classes(id)  ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  PRIMARY KEY (class_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_class_assistants_class_id   ON class_assistants(class_id);
CREATE INDEX IF NOT EXISTS idx_class_assistants_teacher_id ON class_assistants(teacher_id);

COMMENT ON TABLE class_assistants IS 'Trợ giảng của mỗi lớp học (nhiều-nhiều: class ↔ teacher)';


-- ─── 2. Function sync_class_assistants ───────────────────────────────────────
-- Gọi từ client qua Supabase RPC:
--   supabase.rpc('sync_class_assistants', {
--     p_class_id:    '<uuid>',
--     p_teacher_ids: ['<uuid1>', '<uuid2>'],
--   })

CREATE OR REPLACE FUNCTION sync_class_assistants(
  p_class_id    UUID,
  p_teacher_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_class_id IS NULL THEN
    RAISE EXCEPTION 'p_class_id không được null';
  END IF;

  IF p_teacher_ids IS NULL OR array_length(p_teacher_ids, 1) IS NULL THEN
    -- Mảng rỗng → xoá hết trợ giảng của lớp này
    DELETE FROM class_assistants WHERE class_id = p_class_id;
    RETURN;
  END IF;

  -- Xoá những teacher không còn trong danh sách mới
  DELETE FROM class_assistants
  WHERE class_id = p_class_id
    AND teacher_id <> ALL(p_teacher_ids);

  -- Thêm teacher mới (idempotent nhờ PRIMARY KEY)
  INSERT INTO class_assistants (class_id, teacher_id)
  SELECT p_class_id, unnest(p_teacher_ids)
  ON CONFLICT (class_id, teacher_id) DO NOTHING;
END;
$$;

COMMENT ON FUNCTION sync_class_assistants(UUID, UUID[]) IS
  'Đồng bộ class_assistants cho 1 lớp với danh sách teacher_id mới.';

GRANT EXECUTE ON FUNCTION sync_class_assistants(UUID, UUID[]) TO authenticated;


-- ─── 3. RLS ──────────────────────────────────────────────────────────────────

ALTER TABLE class_assistants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated can manage class_assistants" ON class_assistants;

CREATE POLICY "authenticated can manage class_assistants"
  ON class_assistants FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
