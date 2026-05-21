import React, { useState } from 'react';
import { FadeIn, LoadingSpinner } from '../../components';
import { StatCard, TodaySchedule, RecentActivity, QuickActions, StudentDistribution, RevenueChart, AtRiskStudents } from './components';
import { TuitionAlerts } from './components/TuitionAlerts';
import { useQuery } from '../../hooks/useSupabase';
import { getDashboardStats, getTodayClasses, getRecentActivities, getTuitionAlerts } from '../../services/dashboard';
import { useAppContext } from '../../context/AppContext';

interface DashboardProps {
  onNavigate?: (page: string, params?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { selectedBranch, selectedYear } = useAppContext();
  const branchId = selectedBranch?.id;
  const yearId = selectedYear?.id;

  const now = new Date();
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dateStr = `${days[now.getDay()]}, ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  const [periodDays, setPeriodDays] = useState(7);

  const { data: stats, loading: statsLoading } = useQuery(
    () => getDashboardStats(periodDays, { branchId, yearId }),
    [periodDays, branchId, yearId]
  );
  const { data: todayClasses, loading: todayClassesLoading } = useQuery(
    () => getTodayClasses({ branchId, yearId }),
    [branchId, yearId]
  );
  const { data: recentActivities, loading: activitiesLoading } = useQuery(
    () => getRecentActivities({ branchId, yearId }),
    [branchId, yearId]
  );
  const { data: tuitionAlerts, loading: tuitionLoading } = useQuery(
    () => getTuitionAlerts({ branchId, yearId }),
    [branchId, yearId]
  );

  if (statsLoading) return <LoadingSpinner />;

  return (
    <div>
      <FadeIn delay={0}>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>Xin chào, Admin! 👋</h1>
            <p style={{ fontSize: 14, color: 'var(--text-3)', margin: '6px 0 0' }}>{dateStr} · Hôm nay có {(todayClasses || []).length} lớp học</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>Chu kỳ chuyên cần:</span>
            <select
              value={periodDays}
              onChange={(e) => setPeriodDays(Number(e.target.value))}
              style={{
                height: 34,
                padding: '0 30px 0 12px',
                borderRadius: 8,
                border: '1.5px solid var(--border)',
                background: 'var(--card)',
                color: 'var(--text-1)',
                fontSize: 12,
                fontFamily: 'var(--font)',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
              }}
            >
              <option value={7}>7 ngày qua</option>
              <option value={14}>14 ngày qua</option>
              <option value={30}>30 ngày qua</option>
            </select>
          </div>
        </div>
      </FadeIn>

      {/* Tuition Alerts section */}
      <TuitionAlerts data={tuitionAlerts} loading={tuitionLoading} onActionClick={() => onNavigate?.('finance')} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon="users" iconBg="var(--primary-light)" label="Tổng học viên" value={stats?.totalStudents || 0} trend={12} trendLabel="So với tháng trước" delay={0} />
        <StatCard icon="book" iconBg="var(--info-light)" label="Lớp đang hoạt động" value={stats?.activeClasses || 0} suffix="lớp" trend={5} delay={80} />
        <StatCard icon="wallet" iconBg="var(--success-light)" label="Doanh thu tháng này" value={stats?.monthlyRevenue.toFixed(1) || "0"} suffix="tr" trend={8.2} trendLabel={`${(stats?.monthlyRevenue || 0).toLocaleString()} tr`} delay={160} />
        <StatCard icon="graduation" iconBg="var(--academic-light)" label="Giáo viên" value={stats?.totalTeachers || 0} suffix="người" delay={240} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginBottom: 24 }}>
        <RevenueChart data={stats?.revenueChart} attendanceData={stats?.attendanceChart} />
        <TodaySchedule classes={todayClasses || []} loading={todayClassesLoading} onQuickAttendance={(classId) => onNavigate?.('attendance', { classId })} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <StudentDistribution data={stats?.distribution} />
        <AtRiskStudents students={stats?.atRiskStudents} />
        <QuickActions onNavigate={onNavigate} />
        <RecentActivity activities={recentActivities || []} loading={activitiesLoading} />
      </div>
    </div>
  );
};

export default Dashboard;
