-- =============================================================================
-- update_sql.sql
-- Sync teacher ↔ branches (cập nhật bảng teacher_branches khi sửa giáo viên)
-- =============================================================================
-- Bảng đích:
--   teacher_branches (teacher_id UUID, branch_id UUID, PRIMARY KEY(teacher_id, branch_id))
--
-- Mục tiêu:
--   Cho 1 giáo viên + danh sách branch_id mới → đồng bộ lại các dòng trong
--   teacher_branches sao cho khớp với danh sách mới (xoá branch không còn,
--   thêm branch mới, giữ nguyên branch trùng).
-- =============================================================================


-- ─── 1. Function chính: sync_teacher_branches ────────────────────────────────
-- Gọi từ client qua Supabase RPC:
--   supabase.rpc('sync_teacher_branches', {
--     p_teacher_id: '<uuid>',
--     p_branch_ids: ['<uuid1>', '<uuid2>'],
--   })
--
-- Toàn bộ thao tác chạy trong 1 transaction (atomicity của function),
-- không gây race condition giữa DELETE và INSERT.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION sync_teacher_branches(
  p_teacher_id UUID,
  p_branch_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate input
  IF p_teacher_id IS NULL THEN
    RAISE EXCEPTION 'p_teacher_id không được null';
  END IF;

  IF p_branch_ids IS NULL OR array_length(p_branch_ids, 1) IS NULL THEN
    -- Truyền mảng rỗng → xoá hết branch của giáo viên này
    DELETE FROM teacher_branches WHERE teacher_id = p_teacher_id;
    RETURN;
  END IF;

  -- 1) Xoá những branch không còn trong danh sách mới
  DELETE FROM teacher_branches
  WHERE teacher_id = p_teacher_id
    AND branch_id <> ALL(p_branch_ids);

  -- 2) Thêm những branch mới (idempotent nhờ PRIMARY KEY)
  INSERT INTO teacher_branches (teacher_id, branch_id)
  SELECT p_teacher_id, unnest(p_branch_ids)
  ON CONFLICT (teacher_id, branch_id) DO NOTHING;
END;
$$;

COMMENT ON FUNCTION sync_teacher_branches(UUID, UUID[]) IS
  'Đồng bộ teacher_branches cho 1 giáo viên với danh sách branch_id mới. Xoá branch không còn, thêm branch mới, giữ nguyên branch trùng.';


-- ─── 2. Cấp quyền gọi function ───────────────────────────────────────────────
-- Cho phép user đã đăng nhập (authenticated) gọi function này.
-- Bỏ comment dòng cuối nếu muốn cho cả anon gọi (KHÔNG khuyến khích).
-- -----------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION sync_teacher_branches(UUID, UUID[]) TO authenticated;
-- GRANT EXECUTE ON FUNCTION sync_teacher_branches(UUID, UUID[]) TO anon;


-- ─── 3. (Tuỳ chọn) Manual sync — dùng khi chạy trực tiếp trên SQL editor ────
-- Cách 3a: Gọi function
-- -----------------------------------------------------------------------------

-- SELECT sync_teacher_branches(
--   '7e000000-0000-0000-0000-000000000001'::uuid,
--   ARRAY[
--     'b1000000-0000-0000-0000-000000000001'::uuid,
--     'b1000000-0000-0000-0000-000000000002'::uuid
--   ]
-- );


-- Cách 3b: Sync thủ công không dùng function
-- -----------------------------------------------------------------------------

-- BEGIN;
--
-- DELETE FROM teacher_branches
-- WHERE teacher_id = '<TEACHER_ID>'
--   AND branch_id NOT IN (
--     '<BRANCH_ID_1>',
--     '<BRANCH_ID_2>'
--   );
--
-- INSERT INTO teacher_branches (teacher_id, branch_id) VALUES
--   ('<TEACHER_ID>', '<BRANCH_ID_1>'),
--   ('<TEACHER_ID>', '<BRANCH_ID_2>')
-- ON CONFLICT (teacher_id, branch_id) DO NOTHING;
--
-- COMMIT;


-- ─── 4. Kiểm tra kết quả sau khi sync ────────────────────────────────────────

-- SELECT tb.teacher_id, t.full_name, tb.branch_id, b.name AS branch_name
-- FROM teacher_branches tb
-- JOIN teachers t ON t.id = tb.teacher_id
-- JOIN branches b ON b.id = tb.branch_id
-- WHERE tb.teacher_id = '<TEACHER_ID>';
