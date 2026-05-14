import React from 'react';
import Dashboard from '../pages/Dashboard';
import Students from '../pages/Students';
import Teachers from '../pages/Teachers';
import Classes from '../pages/Classes';
import Rooms from '../pages/Rooms';
import Schedule from '../pages/Schedule';
import Attendance from '../pages/Attendance';
import Tests from '../pages/Tests';
import Finance from '../pages/Finance';
import Reports from '../pages/Reports';
import Notifications from '../pages/Notifications';
import Settings from '../pages/Settings';
import Config from '../pages/Config';
import { IconName } from '../components';

export const pageTitles: Record<string, string> = {
  dashboard: 'Tổng quan',
  students: 'Quản lý học viên',
  teachers: 'Quản lý giáo viên',
  classes: 'Quản lý lớp học',
  rooms: 'Quản lý phòng học',
  schedule: 'Lịch học',
  attendance: 'Điểm danh',
  tests: 'Kiểm tra & Thi',
  finance: 'Quản lý tài chính',
  reports: 'Báo cáo & Thống kê',
  notifications: 'Thông báo',
  settings: 'Cài đặt hệ thống',
  config: 'Cấu hình chung',
};

export const pageComponents: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  students: Students,
  teachers: Teachers,
  classes: Classes,
  rooms: Rooms,
  schedule: Schedule,
  attendance: Attendance,
  tests: Tests,
  finance: Finance,
  reports: Reports,
  notifications: Notifications,
  settings: Settings,
  config: Config,
};

export interface RouteItem {
  id: string;
  label: string;
  icon: IconName;
}

export const routes: RouteItem[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: 'dashboard' },
  { id: 'students', label: 'Học viên', icon: 'users' },
  { id: 'teachers', label: 'Giáo viên', icon: 'graduation' },
  { id: 'classes', label: 'Lớp học', icon: 'book' },
  { id: 'rooms', label: 'Phòng học', icon: 'building' },
  { id: 'schedule', label: 'Lịch học', icon: 'calendar' },
  { id: 'attendance', label: 'Điểm danh', icon: 'clipboard' },
  { id: 'tests', label: 'Kiểm tra', icon: 'award' },
  { id: 'finance', label: 'Tài chính', icon: 'wallet' },
  { id: 'reports', label: 'Báo cáo', icon: 'bar-chart' },
  { id: 'notifications', label: 'Thông báo', icon: 'bell' },
  { id: 'settings', label: 'Cài đặt', icon: 'settings' },
];

export default {
  pageTitles,
  pageComponents,
  routes,
};
