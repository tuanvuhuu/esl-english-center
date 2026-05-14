import React from 'react';
import { FadeIn, LoadingSpinner } from '../../components';
import { StatCard, TodaySchedule, RecentActivity, QuickActions, StudentDistribution, RevenueChart } from './components';
import { useQuery } from '../../hooks/useSupabase';
import { getDashboardStats, getTodayClasses } from '../../services/dashboard';

export const Dashboard: React.FC = () => {
  const now = new Date();
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dateStr = `${days[now.getDay()]}, ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  const { data: stats, loading: statsLoading } = useQuery(getDashboardStats);
  const { data: todayClasses } = useQuery(getTodayClasses);

  if (statsLoading) return <LoadingSpinner />;

  return (
    <div>
      <FadeIn delay={0}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>Xin chào, Admin! 👋</h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)', margin: '6px 0 0' }}>{dateStr} · Hôm nay có {(todayClasses || []).length} lớp học</p>
        </div>
      </FadeIn>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon="users" iconBg="var(--primary-light)" label="Tổng học viên" value={stats?.totalStudents || 0} trend={12} trendLabel="So với tháng trước" delay={0} />
        <StatCard icon="book" iconBg="var(--info-light)" label="Lớp đang hoạt động" value={stats?.activeClasses || 0} suffix="lớp" trend={5} delay={80} />
        <StatCard icon="wallet" iconBg="var(--success-light)" label="Doanh thu tháng này" value={stats?.monthlyRevenue.toFixed(1) || "0"} suffix="tr" trend={8.2} trendLabel={`${(stats?.monthlyRevenue || 0).toLocaleString()} tr`} delay={160} />
        <StatCard icon="graduation" iconBg="#EDE9FE" label="Giáo viên" value={stats?.totalTeachers || 0} suffix="người" delay={240} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginBottom: 24 }}>
        <RevenueChart data={stats?.revenueChart} />
        <TodaySchedule />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <StudentDistribution data={stats?.distribution} />
        <QuickActions />
        <RecentActivity />
      </div>
    </div>
  );
};

export default Dashboard;
