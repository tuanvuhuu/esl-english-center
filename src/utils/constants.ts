import { IconName } from '../components/common/Icon';

export interface NavItem {
  id?: string;
  icon?: IconName;
  label?: string;
  labelEn?: string;
  badge?: number | string;
  section?: string;
}

// Navigation
export const NAV_ITEMS: NavItem[] = [
  { section: 'CHÍNH' },
  { id: 'dashboard', icon: 'dashboard', label: 'Tổng quan', labelEn: 'Dashboard' },
  { section: 'QUẢN LÝ' },
  { id: 'students', icon: 'users', label: 'Học viên', labelEn: 'Students', badge: 245 },
  { id: 'teachers', icon: 'graduation', label: 'Giáo viên', labelEn: 'Teachers' },
  { id: 'classes', icon: 'book', label: 'Lớp học', labelEn: 'Classes' },
  { id: 'rooms', icon: 'building', label: 'Phòng học', labelEn: 'Rooms' },
  { section: 'HOẠT ĐỘNG' },
  { id: 'schedule', icon: 'calendar', label: 'Lịch học', labelEn: 'Schedule' },
  { id: 'attendance', icon: 'clipboard', label: 'Điểm danh', labelEn: 'Attendance' },
  { id: 'tests', icon: 'file-edit', label: 'Kiểm tra', labelEn: 'Tests' },
  { section: 'TÀI CHÍNH' },
  { id: 'finance', icon: 'wallet', label: 'Tài chính', labelEn: 'Finance' },
  { id: 'reports', icon: 'bar-chart', label: 'Báo cáo', labelEn: 'Reports' },
];

export const BOTTOM_NAV: NavItem[] = [
  { id: 'notifications', icon: 'bell', label: 'Thông báo', badge: 3 },
  { id: 'settings', icon: 'settings', label: 'Cài đặt' },
];

// Colors by level
export const LEVEL_COLORS: Record<string, string> = {
  'A1': '#FF6B35',
  'A2': '#3B82F6',
  'B1': '#10B981',
  'B2': '#8B5CF6',
  'B2+': '#8B5CF6',
  'A1-A2': '#F59E0B',
  'All': '#EC4899',
};

// Status badges
export interface StatusInfo {
  label: string;
  variant: 'success' | 'info' | 'warning' | 'error' | 'default';
}

export const STATUS_MAP: Record<string, StatusInfo> = {
  active: { label: 'Đang học', variant: 'success' },
  trial: { label: 'Học thử', variant: 'info' },
  paused: { label: 'Tạm nghỉ', variant: 'warning' },
  inactive: { label: 'Nghỉ học', variant: 'error' },
  paid: { label: 'Đã thanh toán', variant: 'success' },
  pending: { label: 'Chờ TT', variant: 'warning' },
  overdue: { label: 'Quá hạn', variant: 'error' },
  available: { label: 'Trống', variant: 'success' },
  'in-use': { label: 'Đang dùng', variant: 'info' },
  maintenance: { label: 'Bảo trì', variant: 'warning' },
  'on-leave': { label: 'Nghỉ phép', variant: 'warning' },
};
