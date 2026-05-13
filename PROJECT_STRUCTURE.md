# ESL English Center - Project Structure Guide

## ✅ Hoàn thành

### Cấu trúc thư mục
- ✅ `public/` - Entry point HTML
- ✅ `src/` - Source code chính
- ✅ `src/data/` - Mock data (JSON format)
- ✅ `src/hooks/` - Custom React hooks (useTheme, useInView, useAnimatedNumber, useTweaks)
- ✅ `src/context/` - React Context (ThemeContext)
- ✅ `src/utils/` - Utilities (formatters, validators, constants, animations)
- ✅ `src/styles/` - Global CSS (variables, themes, animations)
- ✅ `src/components/common/` - UI components (Icon, Avatar, Badge, Button, Card, Input, Modal, Select, Tabs, FadeIn, EmptyState, PageHeader, InfoRow)
- ✅ `src/components/layout/` - Layout structure
- ✅ `src/components/charts/` - Chart components
- ✅ `src/pages/` - Page views

### Config Files
- ✅ `package.json` - Dependencies & scripts
- ✅ `vite.config.js` - Vite configuration
- ✅ `.gitignore` - Git ignore file
- ✅ `README.md` - Project documentation

### Entry Points
- ✅ `src/index.jsx` - React root
- ✅ `src/App.jsx` - Main App component (skeleton)
- ✅ `public/index.html` - HTML entry

---

## 📋 TODO - Để hoàn thành

### Phase 1: Extract & Refactor Components (Ưu tiên cao)

#### 1.1 Layout Components (src/components/layout/) ✅
- ✅ **Sidebar.jsx** - Navigation, collapse, logo, user profile
- ✅ **Header.jsx** - Search, dark mode, notifications, user
- ✅ Full mobile/desktop responsiveness

#### 1.2 Chart Components (src/components/charts/) ✅
- ✅ **AreaChart.jsx** - Animated area chart with gradient
- ✅ **BarChart.jsx** - Bar chart with animations
- ✅ **DonutChart.jsx** - Donut/pie chart with animations

### Phase 2: Page Components (src/pages/)

#### 2.1 Dashboard Page
- [ ] **pages/Dashboard/Dashboard.jsx** (từ esl-dashboard.jsx)
- [ ] **pages/Dashboard/components/StatCard.jsx**
- [ ] **pages/Dashboard/components/TodaySchedule.jsx**
- [ ] **pages/Dashboard/components/RecentActivity.jsx**
- [ ] **pages/Dashboard/components/QuickActions.jsx**
- [ ] **pages/Dashboard/components/StudentDistribution.jsx**
- [ ] **pages/Dashboard/components/RevenueChart.jsx**

#### 2.2 Students Management
- [ ] **pages/Students/Students.jsx** (fromesi-management.jsx lines 4-143)
- [ ] **pages/Students/StudentTable.jsx**
- [ ] **pages/Students/StudentGrid.jsx**
- [ ] **pages/Students/StudentDetail.jsx**
- [ ] **pages/Students/AddStudentModal.jsx**

#### 2.3 Teachers Management
- [ ] **pages/Teachers/Teachers.jsx** (from esl-management.jsx lines 169-233)
- [ ] **pages/Teachers/TeacherCard.jsx**

#### 2.4 Classes Management
- [ ] **pages/Classes/Classes.jsx** (from esl-management.jsx lines 235-316)
- [ ] **pages/Classes/ClassCard.jsx**

#### 2.5 Other Pages
- [ ] **pages/Schedule/Schedule.jsx** (from esl-pages.jsx lines 4-77)
- [ ] **pages/Finance/Finance.jsx** (from esl-pages.jsx lines 79-130)
- [ ] **pages/Rooms/Rooms.jsx** (from esl-pages.jsx lines 132-154)
- [ ] **pages/Attendance/Attendance.jsx** (from esl-pages.jsx lines 156-208)
- [ ] **pages/Tests/Tests.jsx** (from esl-pages.jsx lines 210-250)
- [ ] **pages/Reports/Reports.jsx** (from esl-pages.jsx lines 252-273)
- [ ] **pages/Notifications/Notifications.jsx** (from esl-pages.jsx lines 275-304)
- [ ] **pages/Settings/Settings.jsx** (from esl-pages.jsx lines 306-365)
- [ ] **pages/Settings/SettingToggle.jsx**

### Phase 3: Update App.jsx
- [ ] Implement proper routing (React Router)
- [ ] Connect all page components
- [ ] Pass data correctly from store/context

### Phase 4: Testing & Optimization
- [ ] Test all pages and features
- [ ] Verify dark mode works correctly
- [ ] Check responsive design (mobile/tablet/desktop)
- [ ] Performance optimization
- [ ] Animation smoothness

### Phase 5: API Integration (Optional - Future)
- [ ] Replace mock data with API calls
- [ ] Implement real authentication
- [ ] Add error handling & loading states
- [ ] Implement data caching

---

## 🔄 Refactoring Pattern

Mỗi component cần tuân theo mẫu:

```jsx
// Import dependencies
import { useState, useEffect } from 'react';
import { useTheme } from '../hooks';
import { Card, Button } from '../components/common';
import { CONSTANT } from '../utils/constants';

// Import styles from global.css - no local CSS needed

// Component
export const ComponentName = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);
  
  return (
    <div style={{ /* inline styles using var(--*) variables */ }}>
      {/* Component JSX */}
    </div>
  );
};
```

### Key Points:
- ✅ Inline styles (không tạo file CSS riêng)
- ✅ Sử dụng CSS variables (var(--primary), var(--text-1), etc)
- ✅ Import từ common components
- ✅ Dùng data từ src/data/index.js
- ✅ Dùng formatters, validators từ utils

---

## 🎯 Next Steps

### Immediate (Week 1)
1. ✅ Create **Sidebar.jsx** and **Header.jsx** - DONE!
2. ✅ Create **Chart Components** (Area, Bar, Donut) - DONE!
3. ✅ Setup App.jsx with routing skeleton - DONE!
4. Create **Dashboard** page with all components
5. Create **Students** page
6. Implement actual page content

### Short-term (Week 2)
5. Create remaining pages (Teachers, Classes, etc)
6. Test all features and dark mode
7. Optimize responsive design

### Medium-term (Week 3+)
8. Add real API integration
9. Implement authentication
10. Add error handling & validations
11. Performance optimization

---

## 📚 File Reference

### To Extract From:
- `esl-app.jsx` - Sidebar, Header, PageTransition
- `esl-dashboard.jsx` - Dashboard page & components
- `esl-management.jsx` - Students, Teachers, Classes
- `esl-pages.jsx` - Schedule, Finance, Attendance, Tests, Reports, Notifications, Settings
- `esl-shared.jsx` - Already extracted (components, hooks, context)
- `tweaks-panel.jsx` - Optional dev tool

### Already Created:
- Data files (students.json, teachers.json, etc)
- Hooks (useTheme, useInView, useAnimatedNumber, useTweaks)
- Context (ThemeContext)
- Utils (formatters, validators, constants, animations)
- Common components (all 13 components)
- Global styles (variables.css, themes.css, animations.css)

---

## 🔑 Key Variables Available

From `src/utils/constants.js`:
```javascript
NAV_ITEMS     // Navigation menu items
BOTTOM_NAV    // Bottom navigation
LEVEL_COLORS  // Color codes for levels
STATUS_MAP    // Status badge mappings
```

From `src/styles/`:
```css
--primary, --primary-dark, --primary-light
--success, --success-dark, --success-light
--error, --error-dark, --error-light
--warning, --warning-dark, --warning-light
--info, --info-dark, --info-light
--text-1, --text-2, --text-3, --text-4
--bg, --card, --border, --header, --sidebar
--shadow-sm, --shadow-md, --shadow-lg, --shadow-xl
```

---

## 💡 Tips

1. **Reuse Data**: Import from `src/data/index.js` rather than copying
2. **Use Formatters**: Use functions from `src/utils/formatters.js` for dates, currency, etc
3. **Consistent Styling**: Always use CSS variables, never hardcode colors
4. **Animation**: Use `<FadeIn>` component for entrance animations
5. **Responsive**: Test on mobile (768px breakpoint) during development

---

## 📞 Support

Refer to:
- `README.md` for project overview
- Component files in `src/components/common/` for API examples
- `src/data/*.json` for data structure
- Original files (esl-*.jsx) for component logic

