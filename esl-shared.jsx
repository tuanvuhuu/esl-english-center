/* ESL English Center — Shared: Theme, Icons, Data, UI Components */
const { useState, useEffect, useRef, useContext, createContext, useCallback, useMemo } = React;

/* ═══════ THEME ═══════ */
const ThemeContext = createContext({ mode: 'light', toggle: () => {} });
const useTheme = () => useContext(ThemeContext);
const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => localStorage.getItem('esl-theme') || 'light');
  const toggle = useCallback(() => {
    setMode(m => { const n = m === 'light' ? 'dark' : 'light'; localStorage.setItem('esl-theme', n); return n; });
  }, []);
  useEffect(() => { document.documentElement.setAttribute('data-theme', mode); }, [mode]);
  return <ThemeContext.Provider value={{ mode, toggle }}>{children}</ThemeContext.Provider>;
};

/* ═══════ ANIMATION HOOKS ═══════ */
const useInView = (opts = {}) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold: opts.threshold || 0.1 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
};

const useAnimatedNumber = (target, duration = 800) => {
  const [val, setVal] = useState(0);
  const [ref, inView] = useInView();
  useEffect(() => {
    if (!inView) return;
    const num = parseFloat(target);
    if (isNaN(num)) { setVal(target); return; }
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(ease * num);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration]);
  return [ref, val];
};

const FadeIn = ({ children, delay = 0, direction = 'up', style = {}, className = '' }) => {
  const [ref, inView] = useInView();
  const anims = { up: 'slideUp', right: 'slideInRight', left: 'slideInLeft', scale: 'scaleIn', none: 'fadeIn' };
  return (
    <div ref={ref} className={className} style={{
      ...style,
      opacity: inView ? 1 : 0,
      animation: inView ? `${anims[direction] || 'slideUp'} 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms both` : 'none',
    }}>{children}</div>
  );
};

/* ═══════ ICON COMPONENT ═══════ */
const ICON_PATHS = {
  'dashboard': <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  'users': <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  'graduation': <><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 4 3 6 3s6-1 6-3v-5"/></>,
  'book': <><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></>,
  'building': <><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></>,
  'calendar': <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></>,
  'clipboard': <><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/></>,
  'file-edit': <><path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v10"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10.4 12.6a2 2 0 0 0-3 3L12 21l4 1-1-4Z"/></>,
  'wallet': <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M16 14h.01"/></>,
  'bar-chart': <><path d="M12 20V10M18 20V4M6 20v-4"/></>,
  'bell': <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
  'settings': <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
  'search': <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
  'plus': <><path d="M5 12h14M12 5v14"/></>,
  'edit': <><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></>,
  'trash': <><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></>,
  'eye': <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
  'chevron-down': <><path d="m6 9 6 6 6-6"/></>,
  'chevron-right': <><path d="m9 18 6-6-6-6"/></>,
  'chevron-left': <><path d="m15 18-6-6 6-6"/></>,
  'menu': <><path d="M4 12h16M4 6h16M4 18h16"/></>,
  'x': <><path d="M18 6 6 18M6 6l12 12"/></>,
  'phone': <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></>,
  'mail': <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></>,
  'clock': <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  'trending-up': <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>,
  'trending-down': <><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></>,
  'more-v': <><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></>,
  'filter': <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
  'download': <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  'log-out': <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  'user': <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  'star': <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
  'check': <><path d="M20 6 9 17l-5-5"/></>,
  'alert': <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></>,
  'dollar': <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
  'map-pin': <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>,
  'award': <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></>,
  'message': <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
  'refresh': <><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></>,
  'sun': <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></>,
  'moon': <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>,
  'arrow-up': <><path d="m5 12 7-7 7 7M12 19V5"/></>,
};

const Icon = ({ name, size = 20, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={className} style={{ flexShrink: 0, ...style }}>
    {ICON_PATHS[name] || null}
  </svg>
);

/* ═══════ MOCK DATA ═══════ */
const STUDENTS_DATA = [
  { id: 1, name: "Nguyễn Minh Anh", age: 8, gender: "F", avatar: "MA", level: "A1", className: "Kids Starter A", parent: "Nguyễn Văn Hùng", phone: "0912 345 678", email: "hung.nv@gmail.com", status: "active", enrollDate: "01/09/2025", dob: "15/03/2018" },
  { id: 2, name: "Trần Bảo Ngọc", age: 10, gender: "F", avatar: "BN", level: "A2", className: "Kids Elementary A", parent: "Trần Thị Hoa", phone: "0903 456 789", email: "hoa.tt@gmail.com", status: "active", enrollDate: "15/08/2025", dob: "22/06/2016" },
  { id: 3, name: "Lê Hoàng Nam", age: 12, gender: "M", avatar: "HN", level: "B1", className: "Teen Pre-Inter A", parent: "Lê Văn Tùng", phone: "0934 567 890", email: "tung.lv@gmail.com", status: "active", enrollDate: "01/09/2025", dob: "10/11/2014" },
  { id: 4, name: "Phạm Thu Hà", age: 7, gender: "F", avatar: "TH", level: "A1", className: "Kids Starter B", parent: "Phạm Minh Tuấn", phone: "0978 678 901", email: "tuan.pm@gmail.com", status: "active", enrollDate: "01/10/2025", dob: "05/04/2019" },
  { id: 5, name: "Vũ Đức Minh", age: 14, gender: "M", avatar: "DM", level: "B1", className: "Teen Pre-Inter B", parent: "Vũ Thị Lan", phone: "0945 789 012", email: "lan.vt@gmail.com", status: "active", enrollDate: "15/09/2025", dob: "18/01/2012" },
  { id: 6, name: "Hoàng Thị Mai", age: 9, gender: "F", avatar: "TM", level: "A2", className: "Kids Elementary B", parent: "Hoàng Văn Đức", phone: "0967 890 123", email: "duc.hv@gmail.com", status: "trial", enrollDate: "01/11/2025", dob: "29/07/2017" },
  { id: 7, name: "Đỗ Quang Huy", age: 11, gender: "M", avatar: "QH", level: "A2", className: "Kids Elementary A", parent: "Đỗ Thị Ngọc", phone: "0923 901 234", email: "ngoc.dt@gmail.com", status: "active", enrollDate: "01/09/2025", dob: "12/12/2015" },
  { id: 8, name: "Ngô Thanh Trúc", age: 13, gender: "F", avatar: "TT", level: "B1", className: "Teen Pre-Inter A", parent: "Ngô Minh Phát", phone: "0956 012 345", email: "phat.nm@gmail.com", status: "active", enrollDate: "15/08/2025", dob: "03/05/2013" },
  { id: 9, name: "Bùi Nhật Linh", age: 6, gender: "F", avatar: "NL", level: "A1", className: "Kids Starter A", parent: "Bùi Văn Khoa", phone: "0989 123 456", email: "khoa.bv@gmail.com", status: "active", enrollDate: "01/09/2025", dob: "21/09/2020" },
  { id: 10, name: "Dương Minh Châu", age: 15, gender: "F", avatar: "MC", level: "B2", className: "Teen Inter A", parent: "Dương Thế Vinh", phone: "0912 234 567", email: "vinh.dt@gmail.com", status: "active", enrollDate: "01/06/2025", dob: "14/02/2011" },
  { id: 11, name: "Phan Gia Bảo", age: 8, gender: "M", avatar: "GB", level: "A1", className: "Kids Starter B", parent: "Phan Thị Hương", phone: "0934 345 678", email: "huong.pt@gmail.com", status: "paused", enrollDate: "01/09/2025", dob: "07/08/2018" },
  { id: 12, name: "Lý Khánh Vy", age: 10, gender: "F", avatar: "KV", level: "A2", className: "Kids Elementary B", parent: "Lý Minh Trí", phone: "0945 456 789", email: "tri.lm@gmail.com", status: "active", enrollDate: "15/09/2025", dob: "30/10/2016" },
  { id: 13, name: "Hồ Anh Tuấn", age: 16, gender: "M", avatar: "AT", level: "B2", className: "IELTS Prep", parent: "Hồ Văn Sơn", phone: "0967 567 890", email: "son.hv@gmail.com", status: "active", enrollDate: "01/03/2025", dob: "25/06/2010" },
  { id: 14, name: "Đinh Phương Linh", age: 9, gender: "F", avatar: "PL", level: "A2", className: "Kids Elementary A", parent: "Đinh Văn Quân", phone: "0978 678 901", email: "quan.dv@gmail.com", status: "active", enrollDate: "01/10/2025", dob: "11/03/2017" },
  { id: 15, name: "Võ Thành Long", age: 12, gender: "M", avatar: "TL", level: "B1", className: "Teen Pre-Inter B", parent: "Võ Thị Thanh", phone: "0989 789 012", email: "thanh.vt@gmail.com", status: "active", enrollDate: "01/09/2025", dob: "19/01/2014" },
];

const TEACHERS_DATA = [
  { id: 1, name: "Sarah Johnson", avatar: "SJ", nationality: "Mỹ", phone: "0987 654 321", email: "sarah@esl.edu.vn", subjects: ["Speaking", "Listening"], classCount: 3, status: "active", color: "#FF6B35" },
  { id: 2, name: "James Wilson", avatar: "JW", nationality: "Anh", phone: "0976 543 210", email: "james@esl.edu.vn", subjects: ["Grammar", "Reading"], classCount: 3, status: "active", color: "#3B82F6" },
  { id: 3, name: "Nguyễn Thị Lan", avatar: "NL", nationality: "Việt Nam", phone: "0965 432 109", email: "lan@esl.edu.vn", subjects: ["Phonics", "Writing"], classCount: 2, status: "active", color: "#10B981" },
  { id: 4, name: "Michael Brown", avatar: "MB", nationality: "Úc", phone: "0954 321 098", email: "michael@esl.edu.vn", subjects: ["IELTS", "Speaking"], classCount: 2, status: "active", color: "#8B5CF6" },
  { id: 5, name: "Emily Chen", avatar: "EC", nationality: "Singapore", phone: "0943 210 987", email: "emily@esl.edu.vn", subjects: ["Grammar", "Writing"], classCount: 2, status: "active", color: "#EC4899" },
  { id: 6, name: "Trần Văn Đức", avatar: "VĐ", nationality: "Việt Nam", phone: "0932 109 876", email: "duc@esl.edu.vn", subjects: ["Phonics", "Grammar"], classCount: 1, status: "active", color: "#F59E0B" },
  { id: 7, name: "Amanda Lee", avatar: "AL", nationality: "Canada", phone: "0921 098 765", email: "amanda@esl.edu.vn", subjects: ["Speaking", "Drama"], classCount: 2, status: "on-leave", color: "#06B6D4" },
  { id: 8, name: "David Park", avatar: "DP", nationality: "Mỹ", phone: "0910 987 654", email: "david@esl.edu.vn", subjects: ["Speaking", "Listening"], classCount: 1, status: "active", color: "#EF4444" },
];

const CLASSES_DATA = [
  { id: 1, name: "Kids Starter A", level: "A1", ageGroup: "5-7", teacher: "Sarah Johnson", teacherId: 1, schedule: "T2, T4, T6 · 15:00-16:30", days: [1,3,5], time: "15:00", endTime: "16:30", room: "P.201", students: 12, maxStudents: 15, status: "active", startDate: "01/09/2025", endDate: "30/06/2026", fee: "3.500.000đ/tháng" },
  { id: 2, name: "Kids Starter B", level: "A1", ageGroup: "5-7", teacher: "Nguyễn Thị Lan", teacherId: 3, schedule: "T3, T5 · 15:00-16:30", days: [2,4], time: "15:00", endTime: "16:30", room: "P.202", students: 10, maxStudents: 12, status: "active", startDate: "01/09/2025", endDate: "30/06/2026", fee: "3.200.000đ/tháng" },
  { id: 3, name: "Kids Elementary A", level: "A2", ageGroup: "8-10", teacher: "Sarah Johnson", teacherId: 1, schedule: "T2, T4, T6 · 17:00-18:30", days: [1,3,5], time: "17:00", endTime: "18:30", room: "P.201", students: 14, maxStudents: 15, status: "active", startDate: "01/09/2025", endDate: "30/06/2026", fee: "3.800.000đ/tháng" },
  { id: 4, name: "Kids Elementary B", level: "A2", ageGroup: "8-10", teacher: "Emily Chen", teacherId: 5, schedule: "T3, T5 · 17:00-18:30", days: [2,4], time: "17:00", endTime: "18:30", room: "P.203", students: 11, maxStudents: 20, status: "active", startDate: "01/09/2025", endDate: "30/06/2026", fee: "3.800.000đ/tháng" },
  { id: 5, name: "Teen Pre-Inter A", level: "B1", ageGroup: "11-14", teacher: "James Wilson", teacherId: 2, schedule: "T2, T4, T6 · 17:30-19:00", days: [1,3,5], time: "17:30", endTime: "19:00", room: "P.301", students: 15, maxStudents: 18, status: "active", startDate: "01/09/2025", endDate: "30/06/2026", fee: "4.200.000đ/tháng" },
  { id: 6, name: "Teen Pre-Inter B", level: "B1", ageGroup: "11-14", teacher: "James Wilson", teacherId: 2, schedule: "T7 · 08:00-11:00", days: [6], time: "08:00", endTime: "11:00", room: "P.301", students: 16, maxStudents: 18, status: "active", startDate: "01/09/2025", endDate: "30/06/2026", fee: "4.200.000đ/tháng" },
  { id: 7, name: "Teen Inter A", level: "B2", ageGroup: "14-17", teacher: "James Wilson", teacherId: 2, schedule: "T3, T5 · 18:00-19:30", days: [2,4], time: "18:00", endTime: "19:30", room: "P.302", students: 8, maxStudents: 18, status: "active", startDate: "01/09/2025", endDate: "30/06/2026", fee: "4.500.000đ/tháng" },
  { id: 8, name: "Kids Plus", level: "A1-A2", ageGroup: "6-10", teacher: "Amanda Lee", teacherId: 7, schedule: "T7 · 09:00-11:00", days: [6], time: "09:00", endTime: "11:00", room: "P.201", students: 13, maxStudents: 15, status: "active", startDate: "01/09/2025", endDate: "30/06/2026", fee: "3.000.000đ/tháng" },
  { id: 9, name: "IELTS Prep", level: "B2+", ageGroup: "15-17", teacher: "Michael Brown", teacherId: 4, schedule: "CN · 09:00-12:00", days: [0], time: "09:00", endTime: "12:00", room: "P.302", students: 6, maxStudents: 12, status: "active", startDate: "01/03/2025", endDate: "30/11/2026", fee: "5.500.000đ/tháng" },
  { id: 10, name: "Speaking Club", level: "All", ageGroup: "8-17", teacher: "David Park", teacherId: 8, schedule: "T7 · 14:00-15:30", days: [6], time: "14:00", endTime: "15:30", room: "P.203", students: 18, maxStudents: 25, status: "active", startDate: "01/09/2025", endDate: "30/06/2026", fee: "2.000.000đ/tháng" },
];

const ROOMS_DATA = [
  { id: 1, name: "P.201", floor: "Tầng 2", capacity: 15, type: "Kids", status: "available", equipment: ["Máy chiếu", "Bảng tương tác", "Loa"] },
  { id: 2, name: "P.202", floor: "Tầng 2", capacity: 12, type: "Kids", status: "in-use", equipment: ["Máy chiếu", "TV", "Loa"] },
  { id: 3, name: "P.203", floor: "Tầng 2", capacity: 20, type: "Multi", status: "available", equipment: ["Máy chiếu", "Bảng tương tác", "Loa", "Micro"] },
  { id: 4, name: "P.301", floor: "Tầng 3", capacity: 18, type: "Teens", status: "in-use", equipment: ["Máy chiếu", "Bảng trắng", "Loa"] },
  { id: 5, name: "P.302", floor: "Tầng 3", capacity: 25, type: "Teens", status: "available", equipment: ["Máy chiếu", "Bảng tương tác", "Loa", "Micro"] },
  { id: 6, name: "P.303", floor: "Tầng 3", capacity: 10, type: "Tutorial", status: "maintenance", equipment: ["TV", "Bảng trắng"] },
];

const REVENUE_MONTHLY = [
  { month: "T10", value: 132 }, { month: "T11", value: 145 }, { month: "T12", value: 128 },
  { month: "T1", value: 158 }, { month: "T2", value: 142 }, { month: "T3", value: 167 },
  { month: "T4", value: 172 }, { month: "T5", value: 156.8 },
];

const RECENT_PAYMENTS = [
  { id: 1, student: "Nguyễn Minh Anh", amount: "3.500.000đ", date: "12/05/2026", type: "Học phí", status: "paid" },
  { id: 2, student: "Trần Bảo Ngọc", amount: "3.800.000đ", date: "11/05/2026", type: "Học phí", status: "paid" },
  { id: 3, student: "Lê Hoàng Nam", amount: "4.200.000đ", date: "10/05/2026", type: "Học phí", status: "pending" },
  { id: 4, student: "Vũ Đức Minh", amount: "4.200.000đ", date: "09/05/2026", type: "Học phí", status: "paid" },
  { id: 5, student: "Hoàng Thị Mai", amount: "3.800.000đ", date: "08/05/2026", type: "Học phí", status: "overdue" },
];

const NOTIFICATIONS_DATA = [
  { id: 1, title: "Học viên mới đăng ký", desc: "Bùi Nhật Linh đăng ký lớp Kids Starter A", time: "5 phút trước", type: "info", read: false },
  { id: 2, title: "Học phí quá hạn", desc: "Hoàng Thị Mai chưa đóng học phí tháng 5", time: "1 giờ trước", type: "warning", read: false },
  { id: 3, title: "Giáo viên xin nghỉ", desc: "Amanda Lee xin nghỉ từ 15/05 - 20/05", time: "2 giờ trước", type: "alert", read: false },
  { id: 4, title: "Lớp đã đầy", desc: "Teen Pre-Inter B đã đạt 16/18 học viên", time: "3 giờ trước", type: "info", read: true },
  { id: 5, title: "Bài kiểm tra sắp tới", desc: "Mid-term Test lớp Kids Elementary A ngày 20/05", time: "5 giờ trước", type: "info", read: true },
];

/* ═══════ SHARED UI COMPONENTS ═══════ */
const Avatar = ({ initials, size = 40, color, style = {} }) => {
  const bg = color || `hsl(${(initials||'AA').charCodeAt(0)*7+(initials||'AA').charCodeAt(1)*13}, 60%, 88%)`;
  const fg = color ? '#fff' : `hsl(${(initials||'AA').charCodeAt(0)*7+(initials||'AA').charCodeAt(1)*13}, 50%, 35%)`;
  return <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size*0.38, fontWeight: 700, flexShrink: 0, fontFamily: 'var(--font)', ...style }}>{initials}</div>;
};

const Badge = ({ children, variant = 'default', style = {} }) => {
  const colors = {
    default: { bg: 'var(--badge-bg)', color: 'var(--badge-color)' },
    success: { bg: 'var(--success-light)', color: 'var(--success-dark)' },
    warning: { bg: 'var(--warning-light)', color: 'var(--warning-dark)' },
    error: { bg: 'var(--error-light)', color: 'var(--error-dark)' },
    primary: { bg: 'var(--primary-light)', color: '#E55A2B' },
    info: { bg: 'var(--info-light)', color: 'var(--info-dark)' },
  };
  const c = colors[variant] || colors.default;
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: c.bg, color: c.color, whiteSpace: 'nowrap', ...style }}>{children}</span>;
};

const StatusBadge = ({ status }) => {
  const map = {
    active: { label: 'Đang học', variant: 'success' }, trial: { label: 'Học thử', variant: 'info' },
    paused: { label: 'Tạm nghỉ', variant: 'warning' }, inactive: { label: 'Nghỉ học', variant: 'error' },
    paid: { label: 'Đã thanh toán', variant: 'success' }, pending: { label: 'Chờ TT', variant: 'warning' },
    overdue: { label: 'Quá hạn', variant: 'error' }, available: { label: 'Trống', variant: 'success' },
    'in-use': { label: 'Đang dùng', variant: 'info' }, maintenance: { label: 'Bảo trì', variant: 'warning' },
    'on-leave': { label: 'Nghỉ phép', variant: 'warning' },
  };
  const m = map[status] || { label: status, variant: 'default' };
  return <Badge variant={m.variant}>{m.label}</Badge>;
};

const Card = ({ children, style = {}, className = '', onClick, hover = false, animate = false, delay = 0 }) => {
  const [hov, setHov] = useState(false);
  const [ref, inView] = useInView();
  return (
    <div ref={animate ? ref : undefined} onClick={onClick} className={className}
      onMouseEnter={() => { if(hover) setHov(true); }}
      onMouseLeave={() => { if(hover) setHov(false); }}
      style={{
        background: 'var(--card)', borderRadius: 16, padding: 20,
        boxShadow: hov ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        transition: 'box-shadow 0.25s, transform 0.2s, background 0.35s',
        cursor: onClick ? 'pointer' : 'default',
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
        border: '1px solid var(--border-light)',
        ...(animate ? {
          opacity: inView ? 1 : 0,
          animation: inView ? `slideUp 0.45s cubic-bezier(0.16,1,0.3,1) ${delay}ms both` : 'none',
        } : {}),
        ...style,
      }}>{children}</div>
  );
};

const Modal = ({ open, onClose, title, children, width = 520 }) => {
  if (!open) return null;
  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'var(--modal-backdrop)', backdropFilter: 'blur(6px)', transition: 'background 0.35s' }} onClick={onClose} />
      <div style={{
        position: 'relative', background: 'var(--card)', borderRadius: 20, width: '100%', maxWidth: width, maxHeight: '90vh',
        overflow: 'auto', boxShadow: 'var(--shadow-xl)', animation: 'modalIn 0.3s cubic-bezier(0.16,1,0.3,1)',
        border: '1px solid var(--border-light)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--card)', zIndex: 1, borderRadius: '20px 20px 0 0' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'var(--hover-bg)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-3)', transition: 'all 0.15s' }}><Icon name="x" size={18} /></button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>, document.body
  );
};

const Button = ({ children, variant = 'primary', size = 'md', icon, onClick, style = {}, disabled = false }) => {
  const variants = {
    primary: { bg: 'var(--primary)', color: '#fff', hoverBg: 'var(--primary-dark)', border: 'none' },
    secondary: { bg: 'var(--hover-bg)', color: 'var(--text-2)', hoverBg: 'var(--border)', border: '1px solid var(--border)' },
    outline: { bg: 'transparent', color: 'var(--primary)', hoverBg: 'var(--primary-light)', border: '1px solid var(--primary)' },
    ghost: { bg: 'transparent', color: 'var(--text-3)', hoverBg: 'var(--hover-bg)', border: 'none' },
    danger: { bg: 'var(--error-light)', color: '#DC2626', hoverBg: '#FECACA', border: 'none' },
  };
  const sizes = { sm: { p: '6px 12px', fs: 13 }, md: { p: '10px 18px', fs: 14 }, lg: { p: '12px 24px', fs: 15 } };
  const v = variants[variant]; const s = sizes[size];
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: s.p, fontSize: s.fs, fontWeight: 600, fontFamily: 'var(--font)', borderRadius: 12, border: v.border, background: disabled ? 'var(--border)' : (hov ? v.hoverBg : v.bg), color: disabled ? 'var(--text-4)' : v.color, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)', whiteSpace: 'nowrap', transform: hov && !disabled ? 'scale(0.97)' : 'scale(1)', ...style }}>
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}{children}
    </button>
  );
};

const Input = ({ label, value, onChange, placeholder, type = 'text', icon, style = {} }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
    {label && <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>{label}</label>}
    <div style={{ position: 'relative' }}>
      {icon && <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }}><Icon name={icon} size={16} /></div>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: icon ? '10px 14px 10px 38px' : '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, fontFamily: 'var(--font)', color: 'var(--text-1)', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', background: 'var(--input-bg)', boxSizing: 'border-box' }}
        onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.1)'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
      />
    </div>
  </div>
);

const Select = ({ label, value, onChange, options, style = {} }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
    {label && <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>{label}</label>}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, fontFamily: 'var(--font)', color: 'var(--text-1)', outline: 'none', background: 'var(--input-bg)', cursor: 'pointer', appearance: 'auto', boxSizing: 'border-box' }}>
      {options.map(o => <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>{typeof o === 'string' ? o : o.label}</option>)}
    </select>
  </div>
);

const EmptyState = ({ icon, title, desc, action }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: 'var(--text-4)' }}>
    <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--hover-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><Icon name={icon || 'book'} size={28} /></div>
    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>{title}</div>
    {desc && <div style={{ fontSize: 14, color: 'var(--text-4)', marginBottom: 16 }}>{desc}</div>}
    {action}
  </div>
);

const Tabs = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 4, background: 'var(--hover-bg)', padding: 4, borderRadius: 12, border: '1px solid var(--border-light)' }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{
        padding: '8px 16px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font)', cursor: 'pointer',
        transition: 'all 0.2s', background: active === t.id ? 'var(--card)' : 'transparent', color: active === t.id ? 'var(--primary)' : 'var(--text-3)',
        boxShadow: active === t.id ? 'var(--shadow-sm)' : 'none',
      }}>{t.label}{t.count != null && <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>({t.count})</span>}</button>
    ))}
  </div>
);

const PageHeader = ({ title, subtitle, actions }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24, animation: 'fadeIn 0.3s ease' }}>
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', margin: 0, lineHeight: 1.2 }}>{title}</h1>
      {subtitle && <p style={{ fontSize: 14, color: 'var(--text-3)', margin: '4px 0 0' }}>{subtitle}</p>}
    </div>
    {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
  </div>
);

const InfoRow = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--hover-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', flexShrink: 0, marginTop: 2 }}><Icon name={icon} size={14} /></div>
    <div><div style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 500 }}>{label}</div><div style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 600 }}>{value}</div></div>
  </div>
);

Object.assign(window, {
  ThemeContext, useTheme, ThemeProvider, useInView, useAnimatedNumber, FadeIn,
  Icon, ICON_PATHS, Avatar, Badge, StatusBadge, Card, Modal, Button, Input, Select,
  EmptyState, Tabs, PageHeader, InfoRow,
  STUDENTS_DATA, TEACHERS_DATA, CLASSES_DATA, ROOMS_DATA,
  REVENUE_MONTHLY, RECENT_PAYMENTS, NOTIFICATIONS_DATA,
});
