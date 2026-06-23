import { supabase } from '../lib/supabase';

export interface DashboardStats {
  totalStudents: number;
  activeClasses: number;
  monthlyRevenue: number;
  totalTeachers: number;
  attendanceRate: number;
  revenueChart: { month: string; value: number }[];
  distribution: { label: string; value: number; color: string }[];
  attendanceChart: { label: string; value: number; highlight: boolean }[];
  atRiskStudents: { id: string; name: string; className: string; absentCount: number }[];
  sparklines: {
    revenue: number[];
    attendance: number[];
  };
}

export const getDashboardStats = async (
  periodDays: number = 7,
  filters?: { branchId?: string; yearId?: string }
): Promise<DashboardStats> => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // 1. Build basic stats queries
  let studentQuery = supabase
    .from('students')
    .select('id, student_academic_records!inner(branch_id, academic_year_id)', { count: 'exact', head: true })
    .eq('is_deleted', false);
  if (filters?.branchId) studentQuery = studentQuery.eq('student_academic_records.branch_id', filters.branchId);
  if (filters?.yearId) studentQuery = studentQuery.eq('student_academic_records.academic_year_id', filters.yearId);

  let classQuery = supabase
    .from('classes')
    .select('id', { count: 'exact' })
    .eq('status', 'active')
    .eq('is_deleted', false);
  if (filters?.branchId) classQuery = classQuery.eq('branch_id', filters.branchId);
  if (filters?.yearId) classQuery = classQuery.eq('academic_year_id', filters.yearId);

  let teacherQuery = supabase
    .from('teachers')
    .select('*', { count: 'exact', head: true })
    .eq('is_deleted', false);
  if (filters?.branchId) teacherQuery = teacherQuery.eq('primary_branch_id', filters.branchId);

  // 2. Build monthly revenue query
  let revenueQuery = supabase
    .from('payments')
    .select('amount')
    .eq('status', 'paid')
    .eq('period_month', currentMonth)
    .eq('period_year', currentYear)
    .eq('is_deleted', false);
  if (filters?.branchId) revenueQuery = revenueQuery.eq('branch_id', filters.branchId);
  if (filters?.yearId) revenueQuery = revenueQuery.eq('academic_year_id', filters.yearId);

  // 3. Build student distribution query
  let distQuery: any = supabase
    .from('students')
    .select(
      filters?.branchId || filters?.yearId
        ? 'level, student_academic_records!inner(branch_id, academic_year_id)'
        : 'level'
    )
    .eq('is_deleted', false)
    .eq('status', 'active');
  if (filters?.branchId) distQuery = distQuery.eq('student_academic_records.branch_id', filters.branchId);
  if (filters?.yearId) distQuery = distQuery.eq('student_academic_records.academic_year_id', filters.yearId);

  // 4. Build monthly revenue chart queries (last 8 months)
  const chartMonths: { m: number; y: number; label: string }[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    chartMonths.push({
      m: d.getMonth() + 1,
      y: d.getFullYear(),
      label: `T${d.getMonth() + 1}`
    });
  }

  const chartPromises = chartMonths.map(month => {
    let q = supabase
      .from('payments')
      .select('amount')
      .eq('status', 'paid')
      .eq('period_month', month.m)
      .eq('period_year', month.y)
      .eq('is_deleted', false);
    if (filters?.branchId) q = q.eq('branch_id', filters.branchId);
    if (filters?.yearId) q = q.eq('academic_year_id', filters.yearId);
    return q;
  });

  // Execute Step 1 Parallel Queries
  const [
    studentRes,
    classRes,
    teacherRes,
    revenueRes,
    distRes,
    ...chartResults
  ] = await Promise.all([
    studentQuery,
    classQuery,
    teacherQuery,
    revenueQuery,
    distQuery,
    ...chartPromises
  ]);

  const totalStudents = studentRes.count || 0;
  const activeClassesCountVal = classRes.count || 0;
  const classIdsData = classRes.data || [];
  const activeClasses = activeClassesCountVal;
  const classIds = classIdsData.map((c: any) => c.id);
  const totalTeachers = teacherRes.count || 0;

  const monthlyRevenue = (revenueRes.data || []).reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

  const revenueChart = chartMonths.map((month, idx) => {
    const mData = chartResults[idx].data || [];
    const mSum = mData.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    return {
      month: month.label,
      value: Math.round(mSum / 1000000)
    };
  });

  const studentsData = distRes.data || [];
  
  const distMap: Record<string, number> = {};
  studentsData.forEach((s: any) => {
    const lvl = s.level || 'Chưa xếp lớp';
    distMap[lvl] = (distMap[lvl] || 0) + 1;
  });

  const colors = ['#FF6B35', '#2E5BFF', '#00C48C', '#FFAF00', '#7E3AF2'];
  const distribution = Object.entries(distMap).map(([label, value], i) => ({
    label,
    value,
    color: colors[i % colors.length]
  })).slice(0, 5);

  // 5. Attendance Chart (Step 2 Queries)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - periodDays);
  const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];

  let attData: any[] = [];
  if (classIds.length > 0) {
    const { data: enrollmentIdsData } = await supabase
      .from('enrollments')
      .select('id')
      .in('class_id', classIds)
      .eq('is_deleted', false);
    const enrollmentIds = (enrollmentIdsData || []).map(e => e.id);
    
    if (enrollmentIds.length > 0) {
      const { data: fetchedAttData } = await supabase
        .from('attendance')
        .select('session_date, status')
        .gte('session_date', oneWeekAgoStr)
        .in('enrollment_id', enrollmentIds)
        .eq('is_deleted', false);
      attData = fetchedAttData || [];
    }
  }

  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const lastDays = [];
  for (let i = periodDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = periodDays <= 7 ? dayNames[d.getDay()] : `${d.getDate()}/${d.getMonth() + 1}`;
    lastDays.push({ dateStr, label: dayLabel });
  }

  const attendanceChart = lastDays.map(day => {
    const dayRecords = (attData || []).filter(r => r.session_date === day.dateStr);
    const presentCount = dayRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    return {
      label: day.label,
      value: presentCount,
      highlight: new Date(day.dateStr).toDateString() === now.toDateString(),
    };
  });

  // 6. At-Risk Students (Vắng mặt nhiều)
  let atRiskStudents: { id: string; name: string; className: string; absentCount: number }[] = [];
  if (classIds.length > 0) {
    const { data: absentData } = await supabase
      .from('attendance')
      .select('status, enrollments!inner(student:students(id, full_name), class:classes(name))')
      .in('enrollments.class_id', classIds)
      .in('status', ['absent', 'excused'])
      .eq('is_deleted', false);
      
    if (absentData) {
      const absentMap: Record<string, { studentId: string; name: string; className: string; count: number }> = {};
      absentData.forEach((row: any) => {
        const student = row.enrollments?.student;
        const cls = row.enrollments?.class;
        if (!student || !cls) return;
        
        const key = `${student.id}-${cls.name}`;
        if (!absentMap[key]) {
          absentMap[key] = { studentId: student.id, name: student.full_name, className: cls.name, count: 0 };
        }
        absentMap[key].count++;
      });
      
      atRiskStudents = Object.values(absentMap)
        .filter(s => s.count >= 2) // >= 2 sessions missed is at risk
        .sort((a, b) => b.count - a.count)
        .map(s => ({ id: s.studentId, name: s.name, className: s.className, absentCount: s.count }))
        .slice(0, 5); // top 5 at risk
    }
  }

  // 7. Calculate attendance rate
  const totalAttRecords = attData.length;
  const presentRecords = attData.filter(r => r.status === 'present' || r.status === 'late').length;
  const attendanceRate = totalAttRecords > 0 ? Math.round((presentRecords / totalAttRecords) * 100) : 0;

  // 8. Build sparklines from existing data
  const revenueSparkline = revenueChart.slice(-7).map(r => r.value);
  const attendanceSparkline = attendanceChart.slice(-7).map(a => a.value);

  return {
    totalStudents: totalStudents || 0,
    activeClasses: activeClasses || 0,
    monthlyRevenue: monthlyRevenue / 1000000,
    totalTeachers: totalTeachers || 0,
    attendanceRate,
    revenueChart,
    distribution: distribution.length > 0 ? distribution : [{ label: 'Trống', value: 1, color: '#eee' }],
    attendanceChart,
    atRiskStudents,
    sparklines: {
      revenue: revenueSparkline,
      attendance: attendanceSparkline,
    },
  };
};

export const getTodayClasses = async (filters?: { branchId?: string; yearId?: string }) => {
  const now = new Date();
  const dayOfWeek = now.getDay(); 
  let query = supabase
    .from('class_schedules')
    .select(`
      start_time,
      end_time,
      classes!inner (
        id,
        name,
        level,
        is_deleted,
        branch_id,
        academic_year_id,
        teacher: teachers!teacher_id ( full_name ),
        room: rooms ( name ),
        enrollments ( id )
      )
    `)
    .eq('day_of_week', dayOfWeek)
    .eq('classes.is_deleted', false);

  if (filters?.branchId) query = query.eq('classes.branch_id', filters.branchId);
  if (filters?.yearId) query = query.eq('classes.academic_year_id', filters.yearId);

  const { data } = await query;

  const items = (data || []).map((s: any) => {
    const c = s.classes;
    const startTimeStr = s.start_time?.slice(0, 5) || '00:00';
    const endTimeStr = s.end_time?.slice(0, 5) || '00:00';
    
    // Check if class is active right now
    const nowTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const active = nowTimeStr >= startTimeStr && nowTimeStr <= endTimeStr;

    return {
      id: c.id,
      time: `${startTimeStr} - ${endTimeStr}`,
      name: c.name,
      level: c.level || 'A1',
      teacher: c.teacher?.full_name || 'Chưa phân công',
      room: c.room?.name || 'Tự do',
      students: c.enrollments?.length || 0,
      active,
    };
  });

  return items;
};

export interface ActivityItem {
  icon: string;
  color: string;
  bg: string;
  text: string;
  time: string;
  created_at: string;
}

export const getRecentActivities = async (filters?: { branchId?: string; yearId?: string }): Promise<ActivityItem[]> => {
  let eQuery = supabase
    .from('enrollments')
    .select(`
      created_at,
      student: students ( full_name ),
      class: classes!inner ( name, branch_id, academic_year_id )
    `)
    .eq('is_deleted', false);
  if (filters?.branchId) eQuery = eQuery.eq('class.branch_id', filters.branchId);
  if (filters?.yearId) eQuery = eQuery.eq('class.academic_year_id', filters.yearId);

  let pQuery = supabase
    .from('payments')
    .select(`
      created_at,
      amount,
      student: students ( full_name )
    `)
    .eq('status', 'paid')
    .eq('is_deleted', false);
  if (filters?.branchId) pQuery = pQuery.eq('branch_id', filters.branchId);
  if (filters?.yearId) pQuery = pQuery.eq('academic_year_id', filters.yearId);

  let tQuery = supabase
    .from('test_results')
    .select(`
      created_at,
      total_score,
      student: students!inner ( 
        full_name, 
        student_academic_records!inner ( branch_id, academic_year_id ) 
      )
    `)
    .eq('is_deleted', false);
  if (filters?.branchId) tQuery = tQuery.eq('student.student_academic_records.branch_id', filters.branchId);
  if (filters?.yearId) tQuery = tQuery.eq('student.student_academic_records.academic_year_id', filters.yearId);

  const [eRes, pRes, tRes] = await Promise.all([
    eQuery.order('created_at', { ascending: false }).limit(5),
    pQuery.order('created_at', { ascending: false }).limit(5),
    tQuery.order('created_at', { ascending: false }).limit(5),
  ]);

  const activities: ActivityItem[] = [];

  const timeAgo = (dateStr: string): string => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  if (eRes.data) {
    eRes.data.forEach((e: any) => {
      if (e.student) {
        activities.push({
          icon: 'users',
          color: '#10B981',
          bg: 'var(--success-light)',
          text: `${e.student?.full_name || 'Học viên'} đăng ký lớp ${e.class?.name || 'mới'}`,
          time: timeAgo(e.created_at),
          created_at: e.created_at,
        });
      }
    });
  }

  if (pRes.data) {
    pRes.data.forEach((p: any) => {
      if (p.student) {
        activities.push({
          icon: 'wallet',
          color: '#3B82F6',
          bg: 'var(--info-light)',
          text: `${p.student?.full_name || 'Học viên'} đã thanh toán ${(Number(p.amount) || 0).toLocaleString()}đ`,
          time: timeAgo(p.created_at),
          created_at: p.created_at,
        });
      }
    });
  }

  if (tRes.data) {
    tRes.data.forEach((t: any) => {
      if (t.student) {
        activities.push({
          icon: 'star',
          color: '#F59E0B',
          bg: 'var(--warning-light)',
          text: `${t.student?.full_name || 'Học viên'} đạt ${t.total_score}/100 bài kiểm tra`,
          time: timeAgo(t.created_at),
          created_at: t.created_at,
        });
      }
    });
  }

  // Sắp xếp các hoạt động theo thời gian giảm dần
  activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Trả về tối đa 6 hoạt động gần nhất
  return activities.slice(0, 6);
};

export interface TuitionAlerts {
  totalPendingCount: number;
  totalOverdueCount: number;
  totalPendingAmount: number;
  alerts: {
    studentName: string;
    className: string;
    amount: number;
    dueDate: string;
    status: 'pending' | 'overdue';
  }[];
}

export const getTuitionAlerts = async (filters?: { branchId?: string; yearId?: string }): Promise<TuitionAlerts> => {
  let query = supabase
    .from('payments')
    .select(`
      amount,
      due_date,
      status,
      student: students ( full_name ),
      class: classes ( name )
    `)
    .in('status', ['pending', 'overdue'])
    .eq('is_deleted', false);

  if (filters?.branchId) query = query.eq('branch_id', filters.branchId);
  if (filters?.yearId) query = query.eq('academic_year_id', filters.yearId);

  const { data, error } = await query;

  if (error) throw error;

  const alertsRaw = (data || []).map((p: any) => ({
    studentName: p.student?.full_name || 'Học viên',
    className: p.class?.name || 'Chưa xếp lớp',
    amount: Number(p.amount) || 0,
    dueDate: p.due_date || '',
    status: p.status as 'pending' | 'overdue',
  }));

  const pendingList = alertsRaw.filter(a => a.status === 'pending');
  const overdueList = alertsRaw.filter(a => a.status === 'overdue');
  
  const totalPendingCount = pendingList.length;
  const totalOverdueCount = overdueList.length;
  const totalPendingAmount = alertsRaw.reduce((sum, a) => sum + a.amount, 0);

  // Sắp xếp các cảnh báo: quá hạn trước, sau đó là số tiền lớn trước
  const sortedAlerts = [...alertsRaw].sort((a, b) => {
    if (a.status === 'overdue' && b.status !== 'overdue') return -1;
    if (a.status !== 'overdue' && b.status === 'overdue') return 1;
    return b.amount - a.amount;
  });

  return {
    totalPendingCount,
    totalOverdueCount,
    totalPendingAmount,
    alerts: sortedAlerts.slice(0, 3),
  };
};

export interface HistoryTimelineItem {
  id: string;
  icon: string;
  color: string;
  bg: string;
  title: string;
  description: string;
  time: string;
  timestamp: string;
}

export const getEntityHistory = async (type: 'student' | 'teacher' | 'parent', id: string): Promise<HistoryTimelineItem[]> => {
  const list: HistoryTimelineItem[] = [];
  const timeAgo = (dateStr: string): string => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  try {
    if (type === 'student') {
      // 1. Enrollments
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('created_at, classes ( name )')
        .eq('student_id', id);
      
      (enrollments || []).forEach((e: any, idx) => {
        list.push({
          id: `student-enroll-${idx}-${id}`,
          icon: 'book',
          color: '#3B82F6',
          bg: 'rgba(59, 130, 246, 0.1)',
          title: 'Đăng ký lớp học',
          description: `Đã nhập học vào lớp ${e.classes?.name || 'mới'}`,
          time: timeAgo(e.created_at),
          timestamp: e.created_at
        });
      });

      // 2. Payments
      const { data: payments } = await supabase
        .from('payments')
        .select('created_at, amount, status, billing_month')
        .eq('student_id', id);

      (payments || []).forEach((p: any, idx) => {
        const isPaid = p.status === 'paid';
        list.push({
          id: `student-pay-${idx}-${id}`,
          icon: 'wallet',
          color: isPaid ? '#10B981' : '#F59E0B',
          bg: isPaid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          title: isPaid ? 'Thanh toán học phí' : 'Hoá đơn học phí mới',
          description: `${isPaid ? 'Đã đóng' : 'Chưa đóng'} số tiền ${(Number(p.amount) || 0).toLocaleString()}đ cho tháng ${p.billing_month || ''}`,
          time: timeAgo(p.created_at),
          timestamp: p.created_at
        });
      });

      // 3. Test results
      const { data: testResults } = await supabase
        .from('test_results')
        .select('created_at, total_score, tests ( title )')
        .eq('student_id', id);

      (testResults || []).forEach((t: any, idx) => {
        list.push({
          id: `student-test-${idx}-${id}`,
          icon: 'award',
          color: '#8B5CF6',
          bg: 'rgba(139, 92, 246, 0.1)',
          title: 'Hoàn thành bài kiểm tra',
          description: `Đạt điểm số ${t.total_score || 0}/100 trong bài thi "${t.tests?.title || 'Đánh giá'}"`,
          time: timeAgo(t.created_at),
          timestamp: t.created_at
        });
      });

      // 4. Attendance
      const { data: attendance } = await supabase
        .from('attendance_logs')
        .select('created_at, status, session_date, classes ( name )')
        .eq('student_id', id)
        .order('session_date', { ascending: false })
        .limit(10);

      (attendance || []).forEach((a: any, idx) => {
        let statusText = 'Vắng mặt';
        let col = '#EF4444';
        if (a.status === 'present') { statusText = 'Có mặt'; col = '#10B981'; }
        else if (a.status === 'late') { statusText = 'Đi muộn'; col = '#F59E0B'; }
        
        list.push({
          id: `student-attn-${idx}-${id}`,
          icon: 'clipboard',
          color: col,
          bg: `${col}15`,
          title: 'Điểm danh lớp học',
          description: `Được đánh dấu là "${statusText}" tại lớp ${a.classes?.name || ''} ngày ${a.session_date}`,
          time: timeAgo(a.created_at || a.session_date),
          timestamp: a.created_at || a.session_date
        });
      });
    } else if (type === 'teacher') {
      // 1. Classes assigned
      const { data: classes } = await supabase
        .from('classes')
        .select('created_at, name, level')
        .eq('teacher_id', id);

      (classes || []).forEach((c: any, idx) => {
        list.push({
          id: `teacher-class-${idx}-${id}`,
          icon: 'book',
          color: '#3B82F6',
          bg: 'rgba(59, 130, 246, 0.1)',
          title: 'Phân công lớp học',
          description: `Được giao quản lý giảng dạy lớp ${c.name} (${c.level || 'A1'})`,
          time: timeAgo(c.created_at),
          timestamp: c.created_at
        });
      });

      // 2. Mock teaching activity
      list.push({
        id: `teacher-mock-active-${id}`,
        icon: 'zap',
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.1)',
        title: 'Hoạt động dạy học',
        description: 'Giảng dạy buổi học lý thuyết trực tiếp tại trung tâm',
        time: '1 ngày trước',
        timestamp: new Date(Date.now() - 86400000).toISOString()
      });
    } else if (type === 'parent') {
      // Parent timeline gathers their children's activities
      const { data: links } = await supabase
        .from('student_parents')
        .select('student_id, student: students ( full_name )')
        .eq('parent_id', id);

      const studentIds = (links || []).map(l => l.student_id);

      if (studentIds.length > 0) {
        // Fetch latest child enrollment
        const { data: childEnrollments } = await supabase
          .from('enrollments')
          .select('created_at, student: students ( full_name ), classes ( name )')
          .in('student_id', studentIds)
          .order('created_at', { ascending: false })
          .limit(3);

        (childEnrollments || []).forEach((e: any, idx) => {
          list.push({
            id: `parent-child-enroll-${idx}-${id}`,
            icon: 'users',
            color: '#10B981',
            bg: 'rgba(16, 185, 129, 0.1)',
            title: 'Con nhập học lớp mới',
            description: `Đăng ký cho con "${e.student?.full_name}" học lớp "${e.classes?.name || ''}"`,
            time: timeAgo(e.created_at),
            timestamp: e.created_at
          });
        });

        // Fetch payments made for their children
        const { data: childPayments } = await supabase
          .from('payments')
          .select('created_at, amount, status, student: students ( full_name )')
          .in('student_id', studentIds)
          .order('created_at', { ascending: false })
          .limit(3);

        (childPayments || []).forEach((p: any, idx) => {
          const isPaid = p.status === 'paid';
          list.push({
            id: `parent-child-pay-${idx}-${id}`,
            icon: 'wallet',
            color: isPaid ? '#3B82F6' : '#EF4444',
            bg: isPaid ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            title: isPaid ? 'Nộp tiền học phí' : 'Thông báo học phí con',
            description: `${isPaid ? 'Đã thanh toán' : 'Có hoá đơn chưa nộp'} số tiền ${(Number(p.amount) || 0).toLocaleString()}đ của con "${p.student?.full_name}"`,
            time: timeAgo(p.created_at),
            timestamp: p.created_at
          });
        });
      } else {
        list.push({
          id: `parent-empty-${id}`,
          icon: 'alert',
          color: '#6B7280',
          bg: 'var(--hover-bg)',
          title: 'Chưa có thông tin liên kết',
          description: 'Phụ huynh chưa được liên kết với bất kỳ học viên nào',
          time: 'Vừa xong',
          timestamp: new Date().toISOString()
        });
      }
    }
  } catch (err) {
    console.error('Error fetching entity history:', err);
  }

  // Sort by time descending
  list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return list;
};
