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
      {/* Welcome hero banner */}
      <FadeIn delay={0}>
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 20,
          background: 'var(--gradient-brand-soft)',
          padding: '24px 28px',
          color: 'var(--text-1)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-md)',
        }}>
          {/* Decorative glows */}
          <div style={{
            position: 'absolute', width: 320, height: 320, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(128,184,72,0.15) 0%, rgba(128,184,72,0) 65%)',
            top: -120, right: -80, pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(var(--navy) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }} />

          <div style={{
            position: 'relative',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: 16,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 999,
                background: 'rgba(128,184,72,0.12)',
                border: '1px solid rgba(128,184,72,0.3)',
                fontSize: 11, fontWeight: 700, color: 'var(--primary-dark)',
                letterSpacing: 0.6, marginBottom: 10,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--primary)' }} />
                TỔNG QUAN HÔM NAY
              </div>
              <h1 style={{
                fontSize: 26, fontWeight: 800, color: 'var(--text-1)',
                margin: 0, letterSpacing: -0.3,
              }}>
                {greeting}, Admin 👋
              </h1>
              <p style={{
                fontSize: 13.5, color: 'var(--text-3)',
                margin: '6px 0 0',
              }}>
                {dateStr} · Hôm nay có{' '}
                <strong style={{ color: 'var(--primary-dark)', fontWeight: 700 }}>{(todayClasses || []).length}</strong> lớp đang diễn ra
              </p>
            </div>

            <select
              value={periodDays}
              onChange={(e) => setPeriodDays(Number(e.target.value))}
              style={{
                height: 38,
                padding: '0 32px 0 14px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--card)',
                color: 'var(--text-1)',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'var(--font)',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                boxShadow: 'var(--shadow-sm)',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%235C6F8A' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
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
