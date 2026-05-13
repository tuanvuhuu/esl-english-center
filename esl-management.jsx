/* ESL English Center — Students, Teachers, Classes Views (Dark Mode + Animations) */

/* ═══════════ STUDENTS VIEW ═══════════ */
const StudentsView = () => {
  const [students] = React.useState(STUDENTS_DATA);
  const [search, setSearch] = React.useState('');
  const [filterLevel, setFilterLevel] = React.useState('all');
  const [filterStatus, setFilterStatus] = React.useState('all');
  const [showAdd, setShowAdd] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState(null);
  const [viewMode, setViewMode] = React.useState('table');

  const filtered = students.filter(s => {
    const ms = s.name.toLowerCase().includes(search.toLowerCase()) || s.parent.toLowerCase().includes(search.toLowerCase());
    const ml = filterLevel === 'all' || s.level === filterLevel;
    const mt = filterStatus === 'all' || s.status === filterStatus;
    return ms && ml && mt;
  });

  const counts = { all: students.length, active: students.filter(s => s.status === 'active').length };

  return (
    <div>
      <PageHeader title="Quản lý học viên" subtitle={`${students.length} học viên · ${counts.active} đang học`}
        actions={<Button icon="plus" onClick={() => setShowAdd(true)}>Thêm học viên</Button>} />

      <Card animate style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Input placeholder="Tìm theo tên học viên, phụ huynh..." value={search} onChange={setSearch} icon="search" />
          </div>
          <Select value={filterLevel} onChange={setFilterLevel}
            options={[{value:'all',label:'Tất cả trình độ'},{value:'A1',label:'A1 · Starter'},{value:'A2',label:'A2 · Elementary'},{value:'B1',label:'B1 · Pre-Inter'},{value:'B2',label:'B2 · Intermediate'}]}
            style={{ minWidth: 160 }} />
          <Select value={filterStatus} onChange={setFilterStatus}
            options={[{value:'all',label:'Tất cả trạng thái'},{value:'active',label:'Đang học'},{value:'trial',label:'Học thử'},{value:'paused',label:'Tạm nghỉ'}]}
            style={{ minWidth: 160 }} />
          <Tabs tabs={[{id:'table',label:'☰'},{id:'grid',label:'⊞'}]} active={viewMode} onChange={setViewMode} />
        </div>
      </Card>

      {viewMode === 'table' ? (
        <Card animate delay={80} style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--table-header)', borderBottom: '1px solid var(--border)' }}>
                  {['Học viên','Tuổi','Trình độ','Lớp','Phụ huynh','SĐT','Trạng thái',''].map((h,i) => (
                    <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-3)', whiteSpace: 'nowrap', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s,idx) => (
                  <tr key={s.id} onClick={() => setSelectedStudent(s)}
                    style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer', transition: 'background 0.15s', animation: `slideUp 0.3s ease ${idx*30}ms both` }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--table-row-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar initials={s.avatar} size={34} />
                        <div><div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{s.name}</div><div style={{ fontSize: 11, color: 'var(--text-4)' }}>#{String(s.id).padStart(3,'0')}</div></div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-2)' }}>{s.age}</td>
                    <td style={{ padding: '12px 16px' }}><Badge variant="primary">{s.level}</Badge></td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-2)' }}>{s.className}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-2)' }}>{s.parent}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{s.phone}</td>
                    <td style={{ padding: '12px 16px' }}><StatusBadge status={s.status} /></td>
                    <td style={{ padding: '12px 16px' }}><button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 4 }}><Icon name="more-v" size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <EmptyState icon="users" title="Không tìm thấy học viên" desc="Thử thay đổi bộ lọc" />}
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {filtered.map((s,i) => (
            <Card key={s.id} hover animate delay={i*50} onClick={() => setSelectedStudent(s)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Avatar initials={s.avatar} size={44} />
                <div style={{ flex: 1 }}><div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 14 }}>{s.name}</div><div style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.age} tuổi · {s.level}</div></div>
                <StatusBadge status={s.status} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="book" size={14} />{s.className}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="user" size={14} />{s.parent}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="phone" size={14} />{s.phone}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Student Detail Modal */}
      <Modal open={!!selectedStudent} onClose={() => setSelectedStudent(null)} title="Thông tin học viên" width={560}>
        {selectedStudent && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 20, background: 'var(--hover-bg)', borderRadius: 14, transition: 'background 0.35s' }}>
              <Avatar initials={selectedStudent.avatar} size={56} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>{selectedStudent.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>{selectedStudent.age} tuổi · {selectedStudent.gender === 'F' ? 'Nữ' : 'Nam'} · Ngày sinh: {selectedStudent.dob}</div>
              </div>
              <StatusBadge status={selectedStudent.status} />
            </div>
            {/* Progress Bar */}
            <div style={{ marginBottom: 20, padding: 16, background: 'var(--hover-bg)', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>Tiến độ khoá học</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>68%</span>
              </div>
              <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '68%', background: 'linear-gradient(90deg, var(--primary), #FF8F65)', borderRadius: 4, transition: 'width 0.8s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-4)' }}>
                <span>Bắt đầu: {selectedStudent.enrollDate}</span><span>Dự kiến: 30/06/2026</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <InfoRow icon="book" label="Lớp" value={selectedStudent.className} />
              <InfoRow icon="award" label="Trình độ" value={selectedStudent.level} />
              <InfoRow icon="user" label="Phụ huynh" value={selectedStudent.parent} />
              <InfoRow icon="phone" label="Điện thoại" value={selectedStudent.phone} />
              <InfoRow icon="mail" label="Email" value={selectedStudent.email} />
              <InfoRow icon="calendar" label="Ngày nhập học" value={selectedStudent.enrollDate} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <Button icon="edit" variant="outline" style={{ flex: 1 }}>Chỉnh sửa</Button>
              <Button icon="message" variant="secondary" style={{ flex: 1 }}>Nhắn tin</Button>
              <Button icon="trash" variant="danger">Xoá</Button>
            </div>
          </div>
        )}
      </Modal>

      <AddStudentModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
};

const AddStudentModal = ({ open, onClose }) => {
  const [form, setForm] = React.useState({ name: '', age: '', parent: '', phone: '', email: '', level: 'A1', className: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Modal open={open} onClose={onClose} title="Thêm học viên mới" width={560}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Input label="Họ tên học viên" value={form.name} onChange={v => set('name',v)} placeholder="Nguyễn Văn A" style={{ gridColumn: '1/-1' }} />
        <Input label="Tuổi" value={form.age} onChange={v => set('age',v)} placeholder="8" type="number" />
        <Select label="Trình độ" value={form.level} onChange={v => set('level',v)} options={['A1','A2','B1','B2']} />
        <Input label="Tên phụ huynh" value={form.parent} onChange={v => set('parent',v)} placeholder="Nguyễn Văn B" style={{ gridColumn: '1/-1' }} />
        <Input label="Số điện thoại" value={form.phone} onChange={v => set('phone',v)} placeholder="0912 345 678" />
        <Input label="Email" value={form.email} onChange={v => set('email',v)} placeholder="email@gmail.com" />
        <Select label="Lớp học" value={form.className} onChange={v => set('className',v)}
          options={[{value:'',label:'Chọn lớp...'}, ...CLASSES_DATA.map(c => ({value:c.name,label:c.name}))]}
          style={{ gridColumn: '1/-1' }} />
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onClose}>Huỷ</Button>
        <Button icon="check" onClick={onClose}>Lưu học viên</Button>
      </div>
    </Modal>
  );
};

/* ═══════════ TEACHERS VIEW ═══════════ */
const TeachersView = () => {
  const [selectedTeacher, setSelectedTeacher] = React.useState(null);
  return (
    <div>
      <PageHeader title="Quản lý giáo viên" subtitle={`${TEACHERS_DATA.length} giáo viên`}
        actions={<Button icon="plus">Thêm giáo viên</Button>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {TEACHERS_DATA.map((t,i) => (
          <Card key={t.id} hover animate delay={i*60} onClick={() => setSelectedTeacher(t)} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <Avatar initials={t.avatar} size={48} color={t.color} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>{t.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}><Icon name="map-pin" size={12} />{t.nationality}</div>
              </div>
              <StatusBadge status={t.status} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {t.subjects.map(s => <Badge key={s} variant="info">{s}</Badge>)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', borderTop: '1px solid var(--border-light)', fontSize: 13, color: 'var(--text-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="book" size={14} />{t.classCount} lớp</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="mail" size={14} />{t.email}</div>
            </div>
          </Card>
        ))}
      </div>
      <Modal open={!!selectedTeacher} onClose={() => setSelectedTeacher(null)} title="Thông tin giáo viên" width={520}>
        {selectedTeacher && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 20, background: 'var(--hover-bg)', borderRadius: 14 }}>
              <Avatar initials={selectedTeacher.avatar} size={56} color={selectedTeacher.color} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>{selectedTeacher.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{selectedTeacher.nationality}</div>
              </div>
              <StatusBadge status={selectedTeacher.status} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <InfoRow icon="phone" label="Điện thoại" value={selectedTeacher.phone} />
              <InfoRow icon="mail" label="Email" value={selectedTeacher.email} />
              <InfoRow icon="book" label="Số lớp dạy" value={`${selectedTeacher.classCount} lớp`} />
              <InfoRow icon="award" label="Chuyên môn" value={selectedTeacher.subjects.join(', ')} />
            </div>
            <div style={{ marginTop: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)', marginBottom: 10 }}>Lớp đang dạy</div>
              {CLASSES_DATA.filter(c => c.teacherId === selectedTeacher.id).map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--hover-bg)', borderRadius: 10, marginBottom: 6, transition: 'background 0.35s' }}>
                  <div style={{ width: 4, height: 28, borderRadius: 2, background: selectedTeacher.color }} />
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{c.name}</div><div style={{ fontSize: 12, color: 'var(--text-3)' }}>{c.schedule}</div></div>
                  <Badge>{c.room}</Badge>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <Button icon="edit" variant="outline" style={{ flex: 1 }}>Chỉnh sửa</Button>
              <Button icon="calendar" variant="secondary" style={{ flex: 1 }}>Xem lịch dạy</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

/* ═══════════ CLASSES VIEW ═══════════ */
const ClassesView = () => {
  const [filterLevel, setFilterLevel] = React.useState('all');
  const [selectedClass, setSelectedClass] = React.useState(null);
  const filtered = CLASSES_DATA.filter(c => filterLevel === 'all' || c.level === filterLevel || (filterLevel === 'mixed' && c.level.includes('-')));
  const lvlC = { 'A1':'#FF6B35','A2':'#3B82F6','B1':'#10B981','B2':'#8B5CF6','B2+':'#8B5CF6','A1-A2':'#F59E0B','All':'#EC4899' };

  return (
    <div>
      <PageHeader title="Quản lý lớp học" subtitle={`${CLASSES_DATA.length} lớp · ${CLASSES_DATA.reduce((a,c)=>a+c.students,0)} học viên`}
        actions={<Button icon="plus">Mở lớp mới</Button>} />
      <FadeIn delay={0}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {[{v:'all',l:'Tất cả'},{v:'A1',l:'A1'},{v:'A2',l:'A2'},{v:'B1',l:'B1'},{v:'B2',l:'B2'}].map(f => (
            <button key={f.v} onClick={() => setFilterLevel(f.v)} style={{
              padding: '8px 16px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600,
              fontFamily: 'var(--font)', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
              background: filterLevel === f.v ? 'var(--primary)' : 'var(--hover-bg)', color: filterLevel === f.v ? '#fff' : 'var(--text-3)',
              transform: filterLevel === f.v ? 'scale(1.05)' : 'scale(1)',
            }}>{f.l}</button>
          ))}
        </div>
      </FadeIn>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {filtered.map((c,i) => {
          const pct = Math.round((c.students / c.maxStudents) * 100);
          const barColor = pct > 85 ? '#EF4444' : pct > 60 ? '#F59E0B' : '#10B981';
          return (
            <Card key={c.id} hover animate delay={i*60} onClick={() => setSelectedClass(c)} style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: lvlC[c.level] || 'var(--text-4)' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 }}>
                <div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>{c.name}</div><div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{c.ageGroup} tuổi · {c.level}</div></div>
                <Badge variant={pct > 85 ? 'error' : pct > 60 ? 'warning' : 'success'}>{c.students}/{c.maxStudents}</Badge>
              </div>
              <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, marginBottom: 14, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3, transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="graduation" size={14} style={{ color: lvlC[c.level] }} />{c.teacher}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="calendar" size={14} />{c.schedule}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="building" size={14} />{c.room} · {c.fee}</div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={!!selectedClass} onClose={() => setSelectedClass(null)} title="Chi tiết lớp học" width={600}>
        {selectedClass && (
          <div>
            <div style={{ padding: 20, background: 'var(--hover-bg)', borderRadius: 14, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div><div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)' }}>{selectedClass.name}</div><div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>{selectedClass.level} · {selectedClass.ageGroup} tuổi</div></div>
                <Badge variant="success">Đang hoạt động</Badge>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <InfoRow icon="graduation" label="Giáo viên" value={selectedClass.teacher} />
              <InfoRow icon="calendar" label="Lịch học" value={selectedClass.schedule} />
              <InfoRow icon="building" label="Phòng" value={selectedClass.room} />
              <InfoRow icon="wallet" label="Học phí" value={selectedClass.fee} />
              <InfoRow icon="users" label="Sĩ số" value={`${selectedClass.students}/${selectedClass.maxStudents}`} />
              <InfoRow icon="clock" label="Thời gian" value={`${selectedClass.startDate} → ${selectedClass.endDate}`} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)', marginBottom: 10 }}>Danh sách học viên</div>
              {STUDENTS_DATA.filter(s => s.className === selectedClass.name).map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--hover-bg)', borderRadius: 10, marginBottom: 4, transition: 'background 0.35s' }}>
                  <Avatar initials={s.avatar} size={30} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{s.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.age} tuổi</span>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

Object.assign(window, { StudentsView, TeachersView, ClassesView, AddStudentModal });
