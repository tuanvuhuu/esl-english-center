/* ESL English Center — Dashboard View with Animations */

/* ─── Animated Number Display ─── */
const AnimNum = ({ value, suffix = '', decimals = 0 }) => {
  const [ref, num] = useAnimatedNumber(parseFloat(value), 900);
  return <span ref={ref}>{isNaN(num) ? value : num.toFixed(decimals)}{suffix && <span style={{ fontSize: '0.5em', fontWeight: 600, color: 'var(--text-4)', marginLeft: 4 }}>{suffix}</span>}</span>;
};

/* ─── Mini Charts ─── */
const MiniAreaChart = ({ data, width = 200, height = 60, color = '#FF6B35' }) => {
  const [ref, inView] = useInView();
  const max = Math.max(...data.map(d => d.value)) * 1.1;
  const min = Math.min(...data.map(d => d.value)) * 0.9;
  const range = max - min;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.value - min) / range) * (height - 8) - 4;
    return { x, y, str: `${x},${y}` };
  });
  const areaPath = `0,${height} ${pts.map(p => p.str).join(' ')} ${width},${height}`;
  const linePath = pts.map(p => p.str).join(' ');
  const gid = React.useMemo(() => `g-${Math.random().toString(36).slice(2,8)}`, []);
  return (
    <svg ref={ref} width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', maxWidth: width }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" /><stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPath} fill={`url(#${gid})`} style={{ opacity: inView ? 1 : 0, transition: 'opacity 0.8s ease 0.2s' }} />
      <polyline points={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ strokeDasharray: inView ? 'none' : '0 9999', transition: 'stroke-dasharray 1s ease 0.1s' }} />
      <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="4" fill={color} stroke="var(--card)" strokeWidth="2.5"
        style={{ opacity: inView ? 1 : 0, transition: 'opacity 0.3s ease 0.9s', filter: `drop-shadow(0 0 6px ${color}50)` }} />
    </svg>
  );
};

const DonutChart = ({ segments, size = 130, strokeWidth = 16 }) => {
  const [ref, inView] = useInView();
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * radius;
  const total = segments.reduce((a, s) => a + s.value, 0);
  let offset = 0;
  return (
    <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((s, i) => {
        const dashLen = (s.value / total) * circ;
        const dashOff = -offset; offset += dashLen;
        return (
          <circle key={i} cx={cx} cy={cy} r={radius} fill="none" stroke={s.color} strokeWidth={strokeWidth}
            strokeDasharray={inView ? `${dashLen} ${circ - dashLen}` : `0 ${circ}`}
            strokeDashoffset={dashOff} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: `stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1) ${i * 150}ms` }}
          />
        );
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--text-1)" fontFamily="var(--font)">
        {inView ? total : 0}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="11" fill="var(--text-4)" fontFamily="var(--font)">học viên</text>
    </svg>
  );
};

const BarChart = ({ data, width = 320, height = 140 }) => {
  const [ref, inView] = useInView();
  const max = Math.max(...data.map(d => d.value)) * 1.15;
  const barW = Math.min(28, (width / data.length) * 0.55);
  const gap = width / data.length;
  return (
    <svg ref={ref} width="100%" viewBox={`0 0 ${width} ${height + 24}`} style={{ display: 'block', maxWidth: width }}>
      {data.map((d, i) => {
        const barH = (d.value / max) * height;
        const x = i * gap + (gap - barW) / 2;
        return (
          <g key={i}>
            <rect x={x} y={inView ? height - barH : height} width={barW} height={inView ? barH : 0} rx={barW / 2}
              fill={d.highlight ? 'var(--primary)' : 'var(--border)'}
              style={{ transition: `height 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 60}ms, y 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 60}ms` }}
            />
            <text x={x + barW / 2} y={height + 16} textAnchor="middle" fontSize="10" fill="var(--text-4)" fontFamily="var(--font)">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

/* ─── Stat Card ─── */
const StatCard = ({ icon, iconBg, label, value, suffix, trend, trendLabel, delay = 0 }) => (
  <Card hover animate delay={delay} style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ width: 44, height: 44, borderRadius: 14, background: iconBg || 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', transition: 'background 0.35s' }}>
        <Icon name={icon} size={22} />
      </div>
      {trend != null && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700,
          color: trend >= 0 ? 'var(--success-dark)' : 'var(--error-dark)',
          background: trend >= 0 ? 'var(--success-light)' : 'var(--error-light)',
          padding: '3px 8px', borderRadius: 8, transition: 'all 0.35s',
        }}>
          <Icon name={trend >= 0 ? 'trending-up' : 'trending-down'} size={14} />{Math.abs(trend)}%
        </div>
      )}
    </div>
    <div>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>
        <AnimNum value={value} suffix={suffix} decimals={value.toString().includes('.') ? 1 : 0} />
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
    {trendLabel && <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{trendLabel}</div>}
  </Card>
);

/* ─── Today Schedule ─── */
const TodaySchedule = () => {
  const todayClasses = [
    { time: '15:00 - 16:30', name: 'Kids Starter A', teacher: 'Ms. Sarah', room: 'P.201', students: 12, level: 'A1', active: false },
    { time: '17:00 - 18:30', name: 'Kids Elementary A', teacher: 'Ms. Sarah', room: 'P.201', students: 14, level: 'A2', active: true },
    { time: '17:00 - 18:30', name: 'Kids Elementary B', teacher: 'Ms. Emily', room: 'P.203', students: 11, level: 'A2', active: true },
    { time: '17:30 - 19:00', name: 'Teen Pre-Inter A', teacher: 'Mr. James', room: 'P.301', students: 15, level: 'B1', active: false },
    { time: '18:00 - 19:30', name: 'Teen Inter A', teacher: 'Mr. James', room: 'P.302', students: 8, level: 'B2', active: false },
  ];
  const lvl = { A1: '#FF6B35', A2: '#3B82F6', B1: '#10B981', B2: '#8B5CF6' };
  return (
    <Card animate delay={150} style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}><Icon name="calendar" size={16} /></div>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>Lịch hôm nay</span>
        </div>
        <Badge variant="primary">{todayClasses.length} lớp</Badge>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {todayClasses.map((c, i) => (
          <FadeIn key={i} delay={i * 80} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
            background: c.active ? 'var(--activity-warm)' : 'var(--hover-bg)',
            borderRadius: 12, border: c.active ? '1.5px solid var(--primary)' : '1px solid var(--border-light)',
            transition: 'all 0.25s', cursor: 'pointer',
          }}>
            <div style={{ width: 4, height: 36, borderRadius: 2, background: lvl[c.level] || 'var(--text-4)' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{c.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                <span>{c.teacher}</span><span>·</span><span>{c.room}</span><span>·</span><span>{c.students} HV</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{c.time.split(' - ')[0]}</div>
              <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{c.time.split(' - ')[1]}</div>
            </div>
            {c.active && <Badge variant="success" style={{ fontSize: 10, animation: 'pulse 2s ease infinite' }}>LIVE</Badge>}
          </FadeIn>
        ))}
      </div>
    </Card>
  );
};

/* ─── Recent Activity ─── */
const RecentActivity = () => {
  const acts = [
    { icon: 'users', color: '#10B981', bg: 'var(--success-light)', text: 'Bùi Nhật Linh đăng ký lớp Kids Starter A', time: '5 phút trước' },
    { icon: 'wallet', color: '#3B82F6', bg: 'var(--info-light)', text: 'Nguyễn Minh Anh đã thanh toán 3.500.000đ', time: '30 phút trước' },
    { icon: 'clipboard', color: '#FF6B35', bg: 'var(--primary-light)', text: 'Ms. Sarah điểm danh Kids Starter A (12/12)', time: '1 giờ trước' },
    { icon: 'star', color: '#F59E0B', bg: 'var(--warning-light)', text: 'Trần Bảo Ngọc đạt 95/100 bài kiểm tra', time: '2 giờ trước' },
    { icon: 'graduation', color: '#8B5CF6', bg: '#EDE9FE', text: 'Mr. James cập nhật giáo trình Teen B1', time: '3 giờ trước' },
    { icon: 'bell', color: '#EC4899', bg: '#FCE7F3', text: 'Gửi thông báo học phí tháng 5 thành công', time: '5 giờ trước' },
  ];
  return (
    <Card animate delay={300}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}><Icon name="clock" size={16} /></div>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>Hoạt động gần đây</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {acts.map((a, i) => (
          <FadeIn key={i} delay={i * 70} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0',
            borderBottom: i < acts.length - 1 ? '1px solid var(--border-light)' : 'none',
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color, flexShrink: 0, marginTop: 2 }}><Icon name={a.icon} size={14} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.4 }}>{a.text}</div>
              <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>{a.time}</div>
            </div>
          </FadeIn>
        ))}
      </div>
    </Card>
  );
};

/* ─── Quick Actions ─── */
const QuickActions = () => {
  const actions = [
    { icon: 'plus', label: 'Thêm học viên', color: '#FF6B35', bg: 'var(--primary-light)' },
    { icon: 'book', label: 'Mở lớp mới', color: '#3B82F6', bg: 'var(--info-light)' },
    { icon: 'clipboard', label: 'Điểm danh', color: '#10B981', bg: 'var(--success-light)' },
    { icon: 'wallet', label: 'Thu học phí', color: '#8B5CF6', bg: '#EDE9FE' },
  ];
  return (
    <Card animate delay={200}>
      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)', marginBottom: 14 }}>Thao tác nhanh</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {actions.map((a, i) => (
          <FadeIn key={i} delay={i * 60}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', width: '100%',
              background: a.bg, border: 'none', borderRadius: 12, cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)', fontFamily: 'var(--font)',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.96)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color, boxShadow: 'var(--shadow-sm)' }}><Icon name={a.icon} size={18} /></div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>{a.label}</span>
            </button>
          </FadeIn>
        ))}
      </div>
    </Card>
  );
};

/* ─── Student Distribution ─── */
const StudentDistribution = () => {
  const segments = [
    { label: 'A1 · Starter', value: 68, color: '#FF6B35' },
    { label: 'A2 · Elementary', value: 82, color: '#3B82F6' },
    { label: 'B1 · Pre-Inter', value: 62, color: '#10B981' },
    { label: 'B2 · Intermediate', value: 33, color: '#8B5CF6' },
  ];
  return (
    <Card animate delay={100}>
      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)', marginBottom: 16 }}>Phân bổ trình độ</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
        <DonutChart segments={segments} size={130} strokeWidth={16} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minWidth: 120 }}>
          {segments.map((s, i) => (
            <FadeIn key={i} delay={i * 80 + 400} direction="right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--text-2)', flex: 1 }}>{s.label}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{s.value}</span>
            </FadeIn>
          ))}
        </div>
      </div>
    </Card>
  );
};

/* ─── Revenue Chart ─── */
const RevenueChart = () => {
  const attendData = [
    { label: 'T2', value: 42, highlight: false }, { label: 'T3', value: 38, highlight: false },
    { label: 'T4', value: 45, highlight: false }, { label: 'T5', value: 40, highlight: false },
    { label: 'T6', value: 44, highlight: true }, { label: 'T7', value: 52, highlight: true },
    { label: 'CN', value: 24, highlight: false },
  ];
  return (
    <Card animate delay={80} style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>Doanh thu 8 tháng</div>
        <Badge variant="success">+8.2%</Badge>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-4)', marginBottom: 16 }}>Triệu VNĐ</div>
      <MiniAreaChart data={REVENUE_MONTHLY} width={420} height={100} color="#FF6B35" />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, padding: '0 2px' }}>
        {REVENUE_MONTHLY.map((d, i) => <span key={i} style={{ fontSize: 10, color: 'var(--text-4)' }}>{d.month}</span>)}
      </div>
      <div style={{ marginTop: 20, borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)', marginBottom: 12 }}>Lượt học theo ngày</div>
        <BarChart data={attendData} width={420} height={80} />
      </div>
    </Card>
  );
};

/* ─── Dashboard View ─── */
const DashboardView = () => {
  const now = new Date();
  const days = ['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
  const dateStr = `${days[now.getDay()]}, ${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;

  return (
    <div>
      <FadeIn delay={0}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>Xin chào, Admin! 👋</h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)', margin: '6px 0 0' }}>{dateStr} · Hôm nay có 5 lớp học</p>
        </div>
      </FadeIn>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon="users" iconBg="var(--primary-light)" label="Tổng học viên" value="245" trend={12} trendLabel="So với tháng trước" delay={0} />
        <StatCard icon="book" iconBg="var(--info-light)" label="Lớp đang hoạt động" value="10" suffix="lớp" trend={5} delay={80} />
        <StatCard icon="wallet" iconBg="var(--success-light)" label="Doanh thu tháng 5" value="156.8" suffix="tr" trend={8.2} trendLabel="156.800.000đ" delay={160} />
        <StatCard icon="graduation" iconBg="#EDE9FE" label="Giáo viên" value="8" suffix="người" delay={240} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginBottom: 24 }}>
        <RevenueChart />
        <TodaySchedule />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <StudentDistribution />
        <QuickActions />
        <RecentActivity />
      </div>
    </div>
  );
};

Object.assign(window, { DashboardView, AnimNum });
