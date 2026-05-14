# 📑 ESL English Center - Project Logic Summary

## 1. 🏗️ High-Level Architecture
- **Frontend**: React 18 + TypeScript + Vite.
- **Backend-as-a-Service**: Supabase (Auth, Database, Storage).
- **Styling**: Vanilla CSS with CSS Variables (theming support).
- **Design Pattern**: Component-based architecture with centralized state management via Context API.

---

## 2. 🔐 Authentication & Permissions Logic
Managed via `AuthContext.tsx` and `supabase.ts`.

### Logic Flow:
1. **App Initialization**: `AuthProvider` checks for an existing session using `supabase.auth.getSession()`.
2. **Session Persistence**: Listens for auth state changes (`onAuthStateChange`).
3. **Profile Enrichment**: When a user logs in, the app fetches their detailed profile from the `profiles` table, joining with `roles` and `permissions`.
4. **Permissions System**:
    - Permissions are stored as `resource:action` (e.g., `students:edit`).
    - `hasPermission(resource, action)` hook checks if the user's role has the required permission.
    - Admins bypass all checks.

---

## 3. 🗺️ Routing & Navigation Logic
The app uses a custom routing logic instead of a heavy library like React Router for simple state-based switching.

### Components:
- **`App.tsx`**: The master shell. It checks if a `session` exists.
    - **No Session**: Renders the `Login` page.
    - **Session Active**: Renders the `Sidebar`, `Header`, and the current `page`.
- **`config/routers.ts`**: Defines the mapping between route IDs (e.g., `dashboard`), display titles, and React components.
- **Navigation**: The `Sidebar` updates the `page` state in `App.tsx`, which triggers a re-render of the main content area.

---

## 4. 📊 Data Management Logic
Hybrid approach transitioning from mock to real data.

- **Supabase (Real)**:
    - Tables: `profiles`, `roles`, `permissions`, `branches`, `students`, `teachers`, `classes`.
    - Queries use the Supabase client with RLS (Row Level Security) enabled.
- **Mock Data (Local)**:
    - Located in `src/data/*.json`.
    - Used for rapid UI prototyping and as a fallback if the DB is not fully populated.

---

## 5. 🎨 UI & Design System Logic
- **Theme Logic**: `ThemeContext.tsx` manages 'light' vs 'dark' mode. It toggles a `data-theme` attribute on the `document` element.
- **Responsive Logic**: `App.tsx` monitors `window.innerWidth`.
    - `isMobile`: `< 768px`.
    - Sidebar behavior: Automatically collapses/hides on mobile.
- **Components**: Centralized in `src/components/`. All components use `var(--color-name)` for styling to ensure theme consistency.

---

## 🗄️ Database Schema Logic (Supabase)
Dựa trên `supabase/schema.sql`, cơ sở dữ liệu được thiết kế chuẩn hóa và hỗ trợ đa chi nhánh.

### 1. Hệ thống Phân quyền (RBAC)
- **`roles`**: Định nghĩa các vai trò (admin, manager, teacher, staff).
- **`permissions`**: Danh sách các hành động chi tiết (`resource:action`).
- **`role_permissions`**: Bảng trung gian nối quyền hạn với vai trò.
- **`profiles`**: Mở rộng từ `auth.users` của Supabase, chứa thông tin nhân viên và liên kết với `role_id`.

### 2. Quản lý Đào tạo (Academics)
- **`branches`**: Quản lý đa cơ sở (chi nhánh).
- **`academic_years`**: Quản lý năm học (ví dụ: 2025-2026).
- **`courses`**: Danh mục khóa học mẫu.
- **`classes`**: Các lớp học thực tế, liên kết với giáo viên, phòng học và khóa học.
- **`class_schedules`**: Chi tiết lịch học trong tuần của từng lớp (thứ, giờ bắt đầu/kết thúc).
- **`rooms`**: Quản lý phòng học tại từng chi nhánh.

### 3. Đối tượng Học viên & Giáo viên
- **`students`**: Thông tin chi tiết học viên.
- **`parents`**: Thông tin phụ huynh.
- **`student_parents`**: Quản lý quan hệ giữa học viên và phụ huynh (cha, mẹ, người giám hộ).
- **`student_academic_records`**: Theo dõi lịch sử học tập của học viên qua từng năm học và cơ sở.
- **`teachers`**: Thông tin giáo viên, chuyên môn (`teacher_subjects`) và cơ sở giảng dạy (`teacher_branches`).

### 4. Vận hành & Tài chính
- **`enrollments`**: Đăng ký học viên vào lớp.
- **`attendance`**: Theo dõi điểm danh hàng ngày.
- **`payments`**: Quản lý học phí, các loại phí khác (giáo trình, phí thi) và trạng thái thanh toán.
- **`notifications`**: Hệ thống thông báo nội bộ cho người dùng.

### 5. Đặc điểm Kỹ thuật DB
- **Audit Fields**: Mọi bảng đều có `created_at`, `updated_at`, `created_by`, `updated_by`.
- **Soft Delete**: Sử dụng field `is_deleted` thay vì xóa vật lý dữ liệu.
- **Row Level Security (RLS)**: Đã được bật cho tất cả các bảng để bảo mật dữ liệu ở mức database.

---

## 📂 Cấu trúc thư mục (Directory Breakdown)
- `src/components`: Các thành phần giao diện dùng chung (Button, Card, Input, etc.).
- `src/context`: Quản lý trạng thái toàn cục (Auth, App, Theme).
- `src/hooks`: Các logic React hook tùy chỉnh.
- `src/lib`: Khởi tạo các thư viện bên thứ ba (Supabase).
- `src/pages`: Các trang chức năng (Dashboard, Học viên, Giáo viên, etc.).
- `src/utils`: Các hàm tiện ích (Formatters, Validators, Constants).

---

## 🚀 Deployment & Environment
- **`.env.local`**: Chứa key phát triển cục bộ (được gitignore).
- **`.env.production`**: Chứa key cho production (cho phép commit).
- **Vite Config**: Xử lý việc tiêm các biến môi trường qua `import.meta.env`.
