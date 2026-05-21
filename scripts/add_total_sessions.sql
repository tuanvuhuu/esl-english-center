-- Thêm cột total_sessions vào bảng classes
ALTER TABLE public.classes
ADD COLUMN total_sessions INTEGER DEFAULT NULL;

-- Cập nhật comment (tùy chọn)
COMMENT ON COLUMN public.classes.total_sessions IS 'Tổng số buổi học dự kiến của lớp';
