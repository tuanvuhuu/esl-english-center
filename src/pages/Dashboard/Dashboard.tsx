import React, { useState } from 'react';
import { FadeIn } from '../../components';
import { StatCard, TodaySchedule, RecentActivity, QuickActions, StudentDistribution, RevenueChart, AtRiskStudents } from './components';
import { TuitionAlerts } from './components/TuitionAlerts';
import { SkeletonCard } from './components/SkeletonCard';
import { useQuery } from '../../hooks/useSupabase';
import { getDashboardStats, getTodayClasses, getRecentActivities, getTuitionAlerts } from '../../services/dashboard';
import { useAppContext } from '../../context/AppContext';

interface DashboardProps {
  onNavigate?: (page: string, params?: any) => void;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Chào buổi sáng';
  if (hour >= 12 && hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
};

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { selectedBranch, selectedYear } = useAppContext();
  const branchId = selectedBranch?.id;
  const yearId = selectedYear?.id;

  const now = new Date();
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dateStr = `${days[now.getDay()]}, ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  const [periodDays, setPeriodDays] = useState(7);
  const greeting = getGreeting();

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Greeting + period selector */}
      <FadeIn delay={0}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>
              {greeting}, Admin! 👋
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '4px 0 0' }}>
              {dateStr} · Hôm nay có {(todayClasses || []).length} lớp học
            </p>
          </div>
          <select
            value={periodDays}
            onChange={(e) => setPeriodDays(Number(e.target.value))}
            style={{
              height: 32,
              padding: '0 28px 0 10px',
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
              backgroundPosition: 'right 8px center',
            }}
          >
            <option value={7}>7 ngày qua</option>
            <option value={14}>14 ngày qua</option>
            <option value={30}>30 ngày qua</option>
          </select>
        </div>
      </FadeIn>

      {/* Tuition Alerts */}
      <TuitionAlerts data={tuitionAlerts} loading={tuitionLoading} onActionClick={() => onNavigate?.('finance')} />

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
        {statsLoading ? (
          <>{[1,2,3,4,5].map(i => <SkeletonCard key={i} variant="stat" />)}</>
        ) : (
          <>
            <StatCard icon="users" iconBg="var(--primary-light)" label="Tổng học viên" value={stats?.totalStudents || 0} trend={12} trendLabel="So với tháng trước" delay={0} />
            <StatCard icon="book" iconBg="var(--info-light)" label="Lớp hoạt động" value={stats?.activeClasses || 0} suffix="lớp" trend={5} delay={80} />
            <StatCard icon="wallet" iconBg="var(--success-light)" label="Doanh thu tháng" value={stats?.monthlyRevenue.toFixed(1) || "0"} suffix="tr" trend={8.2} trendLabel={`${(stats?.monthlyRevenue || 0).toLocaleString()} tr`} delay={160} sparkData={stats?.sparklines?.revenue} />
            <StatCard icon="graduation" iconBg="var(--academic-light)" label="Giáo viên" value={stats?.totalTeachers || 0} suffix="người" delay={240} />
            <StatCard icon="clipboard" iconBg="rgba(245, 158, 11, 0.12)" label="Chuyên cần" value={stats?.attendanceRate || 0} suffix="%" delay={320} sparkData={stats?.sparklines?.attendance} />
          </>
        )}
      </div>

      {/* Charts + Schedule */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 14 }}>
        {statsLoading ? (
          <>
            <SkeletonCard variant="chart" />
            <SkeletonCard variant="list" rows={4} />
          </>
        ) : (
          <>
            <RevenueChart data={stats?.revenueChart} attendanceData={stats?.attendanceChart} />
            <TodaySchedule classes={todayClasses || []} loading={todayClassesLoading} onQuickAttendance={(classId) => onNavigate?.('attendance', { classId })} />
          </>
        )}
      </div>

      {/* Bottom section: 3-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        <StudentDistribution data={stats?.distribution} />
        <AtRiskStudents students={stats?.atRiskStudents} />
        <QuickActions onNavigate={onNavigate} />
      </div>

      {/* Full-width recent activity */}
      <RecentActivity activities={recentActivities || []} loading={activitiesLoading} />
    </div>
  );
};

export default Dashboard;
