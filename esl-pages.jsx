/* ESL English Center — Schedule, Finance & Other Pages (Dark Mode + Animations) */

/* ═══════════ SCHEDULE VIEW ═══════════ */
const ScheduleView = () => {
  const [viewType, setViewType] = React.useState('week');
  const days = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','CN'];
  const dayMap = [1,2,3,4,5,6,0];
  const hours = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
  const lvlC = { 'A1':'#FF6B35','A2':'#3B82F6','B1':'#10B981','B2':'#8B5CF6','B2+':'#8B5CF6','A1-A2':'#F59E0B','All':'#EC4899' };
  const getPos = (t) => { const [h,m] = t.split(':').map(Number); return (h-8)*60+m; };
  const getH = (s,e) => getPos(e) - getPos(s);
  const getDay = (di) => CLASSES_DATA.filter(c => c.days.includes(dayMap[di]));
  const [tooltip, setTooltip] = React.useState(null);

  return (
    <div>
      <PageHeader title="Lịch học" subtitle="Thời khoá biểu tuần · 11/05 – 17/05/2026"
        actions={<div style={{ display: 'flex', gap: 8 }}>
          <Tabs tabs={[{id:'week',label:'Tuần'},{id:'day',label:'Ngày'}]} active={viewType} onChange={setViewType} />
          <Button icon="download" variant="secondary" size="sm">Xuất PDF</Button>
        </div>} />

      <Card animate style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '72px repeat(7, 1fr)', minWidth: 900 }}>
            <div style={{ padding: '14px 8px', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border-light)', background: 'var(--table-header)' }} />
            {days.map((d,i) => (
              <div key={i} style={{ padding: '14px 12px', borderBottom: '1px solid var(--border)', borderRight: i<6 ? '1px solid var(--border-light)' : 'none', background: 'var(--table-header)', textAlign: 'center', transition: 'background 0.35s' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>{d}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', marginTop: 2 }}>{11+i}</div>
              </div>
            ))}
            <div style={{ position: 'relative' }}>
              {hours.map((h,i) => <div key={i} style={{ height: 60, borderBottom: '1px solid var(--border-light)', borderRight: '1px solid var(--border-light)' }} />)}
              {hours.map((h,i) => <div key={`l${i}`} style={{ position: 'absolute', top: i*60-7, right: 8, fontSize: 11, color: 'var(--text-4)', fontWeight: 500 }}>{h}</div>)}
            </div>
            {days.map((_,di) => {
              const dc = getDay(di);
              return (
                <div key={di} style={{ position: 'relative', height: hours.length*60, borderRight: di<6 ? '1px solid var(--border-light)' : 'none', background: di>=5 ? 'var(--table-header)' : 'transparent', transition: 'background 0.35s' }}>
                  {hours.map((_,hi) => <div key={hi} style={{ position: 'absolute', top: hi*60, left: 0, right: 0, height: 1, background: 'var(--border-light)' }} />)}
                  {dc.map(c => {
                    const top = getPos(c.time)/60*60, height = getH(c.time,c.endTime)/60*60;
                    const color = lvlC[c.level] || 'var(--text-4)';
                    return (
                      <div key={c.id}
                        onMouseEnter={() => setTooltip(c.id)} onMouseLeave={() => setTooltip(null)}
                        style={{
                          position: 'absolute', top, left: 4, right: 4, height: height-4,
                          background: color+'18', border: `1.5px solid ${color}40`, borderLeft: `3px solid ${color}`,
                          borderRadius: 10, padding: '6px 8px', cursor: 'pointer', overflow: 'hidden', fontSize: 11,
                          transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s',
                          transform: tooltip === c.id ? 'scale(1.03)' : 'scale(1)',
                          boxShadow: tooltip === c.id ? `0 4px 16px ${color}30` : 'none',
                          zIndex: tooltip === c.id ? 10 : 1,
                          animation: `scaleIn 0.35s cubic-bezier(0.16,1,0.3,1) ${di*40}ms both`,
                        }}>
                        <div style={{ fontWeight: 700, color, fontSize: 12, lineHeight: 1.2, marginBottom: 2 }}>{c.name}</div>
                        <div style={{ color: 'var(--text-3)', lineHeight: 1.3 }}>{c.teacher.split(' ').pop()}</div>
                        <div style={{ color: 'var(--text-4)' }}>{c.room} · {c.students} HV</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16, padding: '0 4px' }}>
        {Object.entries(lvlC).filter(([k]) => ['A1','A2','B1','B2'].includes(k)).map(([l,c]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)' }}><div style={{ width: 12, height: 12, borderRadius: 4, background: c }} />{l}</div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════ FINANCE VIEW ═══════════ */
const FinanceView = () => {
  const [tab, setTab] = React.useState('overview');
  const stats = [
    { label: 'Tổng thu', value: '156.800.000đ', color: 'var(--success)', sub: '42 giao dịch' },
    { label: 'Tổng chi', value: '89.200.000đ', color: 'var(--error)', sub: '18 giao dịch' },
    { label: 'Lợi nhuận', value: '67.600.000đ', color: 'var(--info)', sub: '+12% so với T4' },
    { label: 'Công nợ', value: '23.500.000đ', color: 'var(--warning)', sub: '5 HV chưa đóng' },
  ];
  return (
    <div>
      <PageHeader title="Quản lý tài chính" subtitle="Tổng quan thu chi tháng 5/2026"
        actions={<div style={{ display: 'flex', gap: 8 }}><Button icon="download" variant="secondary">Xuất báo cáo</Button><Button icon="plus">Tạo phiếu thu</Button></div>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {stats.map((s,i) => (
          <Card key={i} animate delay={i*70} style={{ borderLeft: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 4 }}>{s.sub}</div>
          </Card>
        ))}
      </div>
      <Tabs tabs={[{id:'overview',label:'Học phí'},{id:'expenses',label:'Chi phí'},{id:'salary',label:'Lương GV'}]} active={tab} onChange={setTab} />
      <Card animate delay={100} style={{ padding: 0, overflow: 'hidden', marginTop: 16 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: 'var(--table-header)', borderBottom: '1px solid var(--border)' }}>
              {['#','Học viên','Số tiền','Ngày','Loại','Trạng thái',''].map((h,i) => (
                <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-3)', fontSize: 12 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {RECENT_PAYMENTS.map((p,i) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-light)', animation: `slideUp 0.3s ease ${i*40}ms both` }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--table-row-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-4)' }}>{String(i+1).padStart(2,'0')}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-1)' }}>{p.student}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-1)' }}>{p.amount}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-3)' }}>{p.date}</td>
                  <td style={{ padding: '12px 16px' }}><Badge>{p.type}</Badge></td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={p.status} /></td>
                  <td style={{ padding: '12px 16px' }}><button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 4 }}><Icon name="eye" size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

/* ═══════════ ROOMS VIEW ═══════════ */
const RoomsView = () => (
  <div>
    <PageHeader title="Quản lý phòng học" subtitle={`${ROOMS_DATA.length} phòng`} actions={<Button icon="plus">Thêm phòng</Button>} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
      {ROOMS_DATA.map((r,i) => (
        <Card key={r.id} hover animate delay={i*60}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>{r.name}</div>
              <div><div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{r.name}</div><div style={{ fontSize: 12, color: 'var(--text-3)' }}>{r.floor} · {r.type}</div></div>
            </div>
            <StatusBadge status={r.status} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-3)', padding: '12px 0 0', borderTop: '1px solid var(--border-light)' }}>
            <span>{r.capacity} chỗ</span><span>{r.equipment.length} thiết bị</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>{r.equipment.map(e => <Badge key={e} variant="info" style={{ fontSize: 11 }}>{e}</Badge>)}</div>
        </Card>
      ))}
    </div>
  </div>
);

/* ═══════════ ATTENDANCE VIEW ═══════════ */
const AttendanceView = () => {
  const [selClass, setSelClass] = React.useState(CLASSES_DATA[0].name);
  const classStudents = STUDENTS_DATA.filter(s => s.className === selClass);
  const [att, setAtt] = React.useState(() => { const m = {}; STUDENTS_DATA.forEach(s => { m[s.id] = Math.random() > 0.15 ? 'present' : 'absent'; }); return m; });
  const toggle = (id) => setAtt(p => ({ ...p, [id]: p[id] === 'present' ? 'absent' : 'present' }));
  const pCount = classStudents.filter(s => att[s.id] === 'present').length;

  return (
    <div>
      <PageHeader title="Điểm danh" subtitle="Thứ Ba, 13/05/2026" actions={<Button icon="check">Lưu điểm danh</Button>} />
      <Card animate style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Select value={selClass} onChange={setSelClass} options={CLASSES_DATA.map(c => ({value:c.name,label:c.name}))} style={{ minWidth: 200 }} />
          <Badge variant="success">{pCount}/{classStudents.length} có mặt</Badge>
          <Badge variant="error">{classStudents.length - pCount} vắng</Badge>
        </div>
      </Card>
      <Card animate delay={60} style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: 'var(--table-header)', borderBottom: '1px solid var(--border)' }}>
            {['#','Học viên','Tuổi','Trạng thái','Điểm danh'].map((h,i) => <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-3)', fontSize: 12 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {classStudents.map((s,i) => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border-light)', animation: `slideUp 0.3s ease ${i*30}ms both` }}>
                <td style={{ padding: '10px 16px', color: 'var(--text-4)' }}>{i+1}</td>
                <td style={{ padding: '10px 16px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar initials={s.avatar} size={32} /><span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{s.name}</span></div></td>
                <td style={{ padding: '10px 16px', color: 'var(--text-3)' }}>{s.age}</td>
                <td style={{ padding: '10px 16px' }}><StatusBadge status={s.status} /></td>
                <td style={{ padding: '10px 16px' }}>
                  <button onClick={() => toggle(s.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 10, border: 'none',
                    cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600,
                    background: att[s.id] === 'present' ? 'var(--success-light)' : 'var(--error-light)',
                    color: att[s.id] === 'present' ? 'var(--success-dark)' : 'var(--error-dark)',
                    transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                    transform: 'scale(1)',
                  }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.93)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                    <Icon name={att[s.id] === 'present' ? 'check' : 'x'} size={14} />
                    {att[s.id] === 'present' ? 'Có mặt' : 'Vắng'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

/* ═══════════ TESTS VIEW ═══════════ */
const TestsView = () => {
  const tests = [
    { id:1, name:'Mid-term Test', className:'Kids Elementary A', date:'20/05/2026', type:'Giữa kỳ', status:'upcoming', students:14 },
    { id:2, name:'Unit 5 Quiz', className:'Teen Pre-Inter A', date:'15/05/2026', type:'Quiz', status:'upcoming', students:15 },
    { id:3, name:'Speaking Test', className:'Kids Starter A', date:'10/05/2026', type:'Kỹ năng', status:'completed', students:12, avgScore:82 },
    { id:4, name:'Final Test', className:'IELTS Prep', date:'05/05/2026', type:'Cuối kỳ', status:'completed', students:6, avgScore:78 },
    { id:5, name:'Unit 4 Quiz', className:'Kids Elementary B', date:'01/05/2026', type:'Quiz', status:'completed', students:11, avgScore:88 },
  ];
  return (
    <div>
      <PageHeader title="Kiểm tra & Thi" subtitle="Quản lý bài kiểm tra và kết quả" actions={<Button icon="plus">Tạo bài kiểm tra</Button>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {tests.map((t,i) => (
          <Card key={t.id} hover animate delay={i*60}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Badge variant={t.status==='upcoming' ? 'warning' : 'success'}>{t.status==='upcoming' ? 'Sắp tới' : 'Hoàn thành'}</Badge>
              <span style={{ fontSize: 12, color: 'var(--text-4)' }}>{t.date}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>{t.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12 }}>{t.className} · {t.type}</div>
            {t.avgScore && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                  <span style={{ color: 'var(--text-4)' }}>Điểm trung bình</span>
                  <span style={{ fontWeight: 700, color: t.avgScore >= 80 ? 'var(--success)' : 'var(--warning)' }}>{t.avgScore}/100</span>
                </div>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${t.avgScore}%`, background: t.avgScore >= 80 ? 'var(--success)' : 'var(--warning)', borderRadius: 3, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', borderTop: '1px solid var(--border-light)', fontSize: 13 }}>
              <span style={{ color: 'var(--text-3)' }}>{t.students} học viên</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

/* ═══════════ REPORTS VIEW ═══════════ */
const ReportsView = () => (
  <div>
    <PageHeader title="Báo cáo & Thống kê" subtitle="Xem tổng quan hoạt động trung tâm" actions={<Button icon="download" variant="secondary">Xuất báo cáo</Button>} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
      {[
        { icon:'users', title:'Báo cáo học viên', desc:'Thống kê nhập học, nghỉ học, chuyển lớp', color:'#FF6B35', bg:'var(--primary-light)' },
        { icon:'wallet', title:'Báo cáo tài chính', desc:'Doanh thu, chi phí, công nợ theo tháng', color:'#10B981', bg:'var(--success-light)' },
        { icon:'clipboard', title:'Báo cáo điểm danh', desc:'Tỷ lệ đi học, vắng mặt theo lớp', color:'#3B82F6', bg:'var(--info-light)' },
        { icon:'star', title:'Báo cáo học tập', desc:'Điểm trung bình, tiến bộ học viên', color:'#8B5CF6', bg:'#EDE9FE' },
        { icon:'graduation', title:'Báo cáo giáo viên', desc:'Giờ dạy, đánh giá, phản hồi', color:'#F59E0B', bg:'var(--warning-light)' },
        { icon:'bar-chart', title:'Tổng hợp', desc:'Báo cáo tổng hợp toàn trung tâm', color:'#EC4899', bg:'#FCE7F3' },
      ].map((r,i) => (
        <Card key={i} hover animate delay={i*60} style={{ cursor: 'pointer' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.color, marginBottom: 14 }}><Icon name={r.icon} size={22} /></div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>{r.title}</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{r.desc}</div>
        </Card>
      ))}
    </div>
  </div>
);

/* ═══════════ NOTIFICATIONS VIEW ═══════════ */
const NotificationsView = () => (
  <div>
    <PageHeader title="Thông báo" subtitle={`${NOTIFICATIONS_DATA.filter(n=>!n.read).length} thông báo mới`} actions={<Button variant="secondary">Đánh dấu đã đọc</Button>} />
    <Card animate style={{ padding: 0, overflow: 'hidden' }}>
      {NOTIFICATIONS_DATA.map((n,i) => {
        const tI = { info:'bell', warning:'alert', alert:'alert' };
        const tC = { info:'var(--info)', warning:'var(--warning)', alert:'var(--error)' };
        return (
          <div key={n.id} style={{
            display: 'flex', gap: 14, padding: '16px 20px',
            borderBottom: i < NOTIFICATIONS_DATA.length-1 ? '1px solid var(--border-light)' : 'none',
            background: n.read ? 'var(--card)' : 'var(--activity-warm)', cursor: 'pointer',
            transition: 'background 0.2s', animation: `slideUp 0.3s ease ${i*50}ms both`,
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
          onMouseLeave={e => e.currentTarget.style.background = n.read ? 'var(--card)' : 'var(--activity-warm)'}>
            <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: 'var(--hover-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tC[n.type]||'var(--info)' }}><Icon name={tI[n.type]||'bell'} size={18} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: n.read ? 500 : 700, color: 'var(--text-1)' }}>{n.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>{n.desc}</div>
              <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 4 }}>{n.time}</div>
            </div>
            {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', marginTop: 8, flexShrink: 0, animation: 'pulse 2s ease infinite' }} />}
          </div>
        );
      })}
    </Card>
  </div>
);

/* ═══════════ SETTINGS VIEW ═══════════ */
const SettingsView = () => {
  const [centerName, setCenterName] = React.useState('ESL English Center');
  const [addr, setAddr] = React.useState('123 Nguyễn Huệ, Q.1, TP.HCM');
  const [phone, setPhone] = React.useState('028 1234 5678');
  const [email, setEmail] = React.useState('info@esl.edu.vn');
  const { mode, toggle } = useTheme();

  return (
    <div>
      <PageHeader title="Cài đặt hệ thống" subtitle="Quản lý thông tin trung tâm và cấu hình" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20 }}>
        <Card animate>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="building" size={18} /> Thông tin trung tâm</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Tên trung tâm" value={centerName} onChange={setCenterName} />
            <Input label="Địa chỉ" value={addr} onChange={setAddr} />
            <Input label="Số điện thoại" value={phone} onChange={setPhone} />
            <Input label="Email" value={email} onChange={setEmail} />
            <Button icon="check" style={{ alignSelf: 'flex-end' }}>Lưu thay đổi</Button>
          </div>
        </Card>
        <Card animate delay={80}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="settings" size={18} /> Cấu hình chung</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SettingToggle label="Chế độ tối / Dark mode" desc="Chuyển giao diện sang theme tối" on={mode === 'dark'} onToggle={toggle} />
            <SettingToggle label="Gửi thông báo qua Email" desc="Tự động gửi email nhắc học phí" on={true} />
            <SettingToggle label="Gửi thông báo qua SMS" desc="Gửi tin nhắn nhắc lịch học" on={false} />
            <SettingToggle label="Tự động tạo báo cáo" desc="Tạo báo cáo tháng vào ngày 1" on={true} />
            <SettingToggle label="Cho phép đăng ký online" desc="Học viên đăng ký qua website" on={true} />
          </div>
        </Card>
      </div>
    </div>
  );
};

const SettingToggle = ({ label, desc, on: initialOn, onToggle: externalToggle }) => {
  const [on, setOn] = React.useState(initialOn);
  const handleClick = () => { if (externalToggle) { externalToggle(); } else { setOn(!on); } };
  const isOn = externalToggle ? initialOn : on;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
      <div><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{label}</div><div style={{ fontSize: 12, color: 'var(--text-4)' }}>{desc}</div></div>
      <button onClick={handleClick} style={{
        width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
        background: isOn ? 'var(--primary)' : 'var(--border)', position: 'relative',
        transition: 'background 0.3s cubic-bezier(0.16,1,0.3,1)', flexShrink: 0,
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 3, left: isOn ? 23 : 3,
          transition: 'left 0.3s cubic-bezier(0.16,1,0.3,1)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  );
};

Object.assign(window, {
  ScheduleView, FinanceView, RoomsView, AttendanceView,
  TestsView, ReportsView, NotificationsView, SettingsView,
});
