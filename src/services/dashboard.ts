import { supabase } from '../lib/supabase';

export interface DashboardStats {
  totalStudents: number;
  activeClasses: number;
  monthlyRevenue: number;
  totalTeachers: number;
  revenueChart: { month: string; value: number }[];
  distribution: { label: string; value: number; color: string }[];
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // 1. Basic Stats
  const { count: totalStudents } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_deleted', false);
  const { count: activeClasses } = await supabase.from('classes').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('is_deleted', false);
  const { count: totalTeachers } = await supabase.from('teachers').select('*', { count: 'exact', head: true }).eq('is_deleted', false);

  // 2. Monthly Revenue
  const { data: revenueData } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'paid')
    .eq('period_month', currentMonth)
    .eq('period_year', currentYear)
    .eq('is_deleted', false);
  const monthlyRevenue = (revenueData || []).reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

  // 3. Revenue Chart (Last 8 months)
  const revenueChart = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const { data: mData } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'paid')
      .eq('period_month', m)
      .eq('period_year', y)
      .eq('is_deleted', false);
    const mSum = (mData || []).reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    revenueChart.push({ 
      month: `T${m}`, 
      value: Math.round(mSum / 1000000) 
    });
  }

  // 4. Student Distribution (By Level)
  const { data: classesData } = await supabase
    .from('classes')
    .select('level')
    .eq('is_deleted', false);
  
  const distMap: Record<string, number> = {};
  (classesData || []).forEach(c => {
    const lvl = c.level || 'Khác';
    distMap[lvl] = (distMap[lvl] || 0) + 1; // Simplified: counting classes by level
  });

  const colors = ['#FF6B35', '#2E5BFF', '#00C48C', '#FFAF00', '#7E3AF2'];
  const distribution = Object.entries(distMap).map(([label, value], i) => ({
    label,
    value,
    color: colors[i % colors.length]
  })).slice(0, 5);

  return {
    totalStudents: totalStudents || 0,
    activeClasses: activeClasses || 0,
    monthlyRevenue: monthlyRevenue / 1000000,
    totalTeachers: totalTeachers || 0,
    revenueChart,
    distribution: distribution.length > 0 ? distribution : [{ label: 'Trống', value: 1, color: '#eee' }]
  };
};

export const getTodayClasses = async () => {
  const now = new Date();
  const dayOfWeek = now.getDay(); 
  const { data } = await supabase
    .from('class_schedules')
    .select(`class_id, classes!inner ( id, name, level, is_deleted )`)
    .eq('day_of_week', dayOfWeek)
    .eq('classes.is_deleted', false);
  
  const uniqueIds = new Set();
  const uniqueClasses = (data || []).filter(item => {
    const id = (item.classes as any).id;
    if (uniqueIds.has(id)) return false;
    uniqueIds.add(id);
    return true;
  }).map(item => item.classes);

  return uniqueClasses || [];
};
