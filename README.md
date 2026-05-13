# ESL English Center Management System

Một ứng dụng quản lý trung tâm tiếng Anh toàn diện, xây dựng bằng React với giao diện hiện đại, hỗ trợ dark mode, và phản ứng động.

## 🎯 Tính năng

- **Dashboard**: Tổng quan doanh thu, học viên, lớp học, hoạt động gần đây
- **Quản lý Học viên**: Danh sách, thêm mới, xem chi tiết, theo dõi tiến độ
- **Quản lý Giáo viên**: Hồ sơ giáo viên, lớp dạy, chuyên môn
- **Quản lý Lớp học**: Lớp, sĩ số, lịch học, phí thi
- **Lịch Học**: Xem timetable tuần, ngày
- **Tài Chính**: Theo dõi thu chi, học phí, công nợ
- **Điểm Danh**: Theo dõi tham dự học viên
- **Kiểm Tra**: Quản lý bài kiểm tra và điểm số
- **Báo Cáo**: Thống kê và xuất báo cáo
- **Dark Mode**: Hỗ trợ chế độ sáng/tối
- **Responsive**: Tương thích mobile, tablet, desktop

## 📁 Cấu trúc Dự án

```
ESL-EnglishCenter/
├── public/
│   └── index.html                 # Entry point HTML
├── src/
│   ├── index.jsx                  # React root
│   ├── App.jsx                    # App shell
│   ├── components/
│   │   ├── common/                # Reusable UI components
│   │   ├── layout/                # Header, Sidebar
│   │   └── charts/                # Chart components
│   ├── pages/                     # Feature pages
│   ├── hooks/                     # Custom React hooks
│   ├── context/                   # React context
│   ├── data/                      # Mock data (JSON)
│   ├── utils/                     # Utility functions
│   ├── styles/                    # Global CSS
│   └── assets/                    # Images, icons
├── package.json
├── .gitignore
└── README.md
```

## 🚀 Bắt đầu

### Cài đặt

```bash
npm install
```

### Chạy Dev Server

```bash
npm run dev
```

Mở [http://localhost:5173](http://localhost:5173) trong trình duyệt.

### Build

```bash
npm run build
```

## 🏗️ Cấu trúc Component

### Common Components
- `Icon` - Icon component
- `Avatar` - Avatar display
- `Badge`, `StatusBadge` - Badge components
- `Button` - Button component
- `Card` - Card container
- `Input` - Input field
- `Modal` - Modal dialog
- `Select` - Dropdown select
- `Tabs` - Tab component
- `FadeIn` - Animation wrapper
- `PageHeader` - Page header
- `InfoRow` - Info row display
- `EmptyState` - Empty state

### Layout Components
- `Sidebar` - Navigation sidebar
- `Header` - Top header

### Chart Components
- `AreaChart` - Area chart
- `BarChart` - Bar chart
- `DonutChart` - Donut chart

## 🎨 Theming

Ứng dụng hỗ trợ light/dark mode tự động:

- CSS Variables trong `src/styles/variables.css`
- Theme definitions trong `src/styles/themes.css`
- Global styles trong `src/styles/global.css`
- Animations trong `src/styles/animations.css`

Chuyển theme qua `useTheme()` hook:

```jsx
const { mode, toggle } = useTheme();
```

## 🔧 Utilities

- `formatters.js` - Date, currency, phone formatting
- `validators.js` - Form validation
- `constants.js` - App constants (colors, navigation, status)
- `animations.js` - Animation helpers

## 📦 Mock Data

Dữ liệu mô phỏng có sẵn trong `src/data/`:

- `students.json` - 15 học viên
- `teachers.json` - 8 giáo viên
- `classes.json` - 10 lớp học
- `rooms.json` - 6 phòng học
- `payments.json` - Thanh toán
- `notifications.json` - Thông báo

Import từ `src/data/index.js`:

```jsx
import { STUDENTS_DATA, TEACHERS_DATA, CLASSES_DATA } from './data';
```

## 🎯 Tiếp theo

1. **Extract Components**: Tách các component từ file JSX cũ
2. **Build Pages**: Hoàn thành các page views
3. **Add Routing**: Implement React Router
4. **API Integration**: Kết nối API thật
5. **Testing**: Thêm unit tests
6. **Deployment**: Deploy lên server

## 📝 License

MIT
