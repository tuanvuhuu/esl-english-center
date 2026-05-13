# 🚀 Quick Start Guide

## 📦 Installation & Running

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# Opens at http://localhost:5173
```

---

## 🎯 Project Status

✅ **FOUNDATION READY** - All core components, hooks, utilities, and styling complete!

### What Works Now:
- Sidebar navigation with collapse
- Header with search, dark mode, notifications
- Chart components (animated)
- 14 reusable UI components
- Dark/Light theme switching
- Responsive design (mobile/desktop)
- Mock data loaded

### What to Build Next:
1. Dashboard page (using DashboardPlaceholder as template)
2. Students, Teachers, Classes pages
3. Other feature pages
4. Wire up actual data from src/data/*.json

---

## 📝 How to Extract Pages from Old Code

### Pattern for Every Page:

```jsx
// Example: Extract Students page
// From: esl-management.jsx lines 4-143
// To: src/pages/Students/Students.jsx

import { useState } from 'react';
import { Card, Button, PageHeader, Badge } from '../../components';
import { STUDENTS_DATA } from '../../data';
import { LEVEL_COLORS, STATUS_MAP } from '../../utils/constants';

export const StudentsView = () => {
  const [students] = useState(STUDENTS_DATA);
  const [search, setSearch] = useState('');
  
  // ... rest of component logic from esl-management.jsx
  // Keep inline styles - no CSS files needed
  // Use var(--primary), var(--text-1), etc for colors
  
  return (
    <div>
      <PageHeader 
        title="Quản lý học viên" 
        subtitle={`${students.length} học viên`}
        actions={<Button icon="plus">Thêm học viên</Button>}
      />
      {/* Page content */}
    </div>
  );
};

export default StudentsView;
```

### Key Rules:
1. ✅ Keep inline styles - no local CSS
2. ✅ Use CSS variables: `var(--primary)`, `var(--text-1)`, etc
3. ✅ Import from `./../../components`
4. ✅ Import data from `../../data`
5. ✅ Use formatters from `../../utils`
6. ✅ Keep all animations inline

---

## 🎨 Component Import Examples

### Common Components:
```jsx
import {
  Icon,
  Avatar,
  Badge,
  StatusBadge,
  Button,
  Card,
  Input,
  Modal,
  Select,
  Tabs,
  FadeIn,
  PageHeader,
  InfoRow,
  EmptyState,
} from '../../components';
```

### Layout:
```jsx
import { Sidebar, Header } from '../../components';
```

### Charts:
```jsx
import { AreaChart, BarChart, DonutChart } from '../../components';
```

### Hooks:
```jsx
import { useTheme, useInView, useAnimatedNumber, useTweaks } from '../../hooks';
```

### Data:
```jsx
import {
  STUDENTS_DATA,
  TEACHERS_DATA,
  CLASSES_DATA,
  ROOMS_DATA,
  RECENT_PAYMENTS,
  NOTIFICATIONS_DATA,
  REVENUE_MONTHLY,
} from '../../data';
```

### Utils:
```jsx
import {
  NAV_ITEMS,
  LEVEL_COLORS,
  STATUS_MAP,
  formatDate,
  formatCurrency,
  validateEmail,
} from '../../utils';
```

---

## 🎯 Next Steps (Prioritized)

### Step 1: Create Dashboard Page (2-3 hours)
**File:** `src/pages/Dashboard/Dashboard.jsx`

Extract from: `esl-dashboard.jsx` (all content)

Sub-components needed:
- `StatCard.jsx` - lines 92-117
- `TodaySchedule.jsx` - lines 120-163
- `RecentActivity.jsx` - lines 166-197
- `QuickActions.jsx` - lines 200-228
- `StudentDistribution.jsx` - lines 231-255
- `RevenueChart.jsx` - lines 258-282

These use: AreaChart, BarChart, DonutChart, Card, Badge, Icon

---

### Step 2: Create Students Management (2-3 hours)
**File:** `src/pages/Students/Students.jsx`

Extract from: `esl-management.jsx` lines 4-143

Sub-components:
- `StudentTable.jsx` - Table view with filtering
- `StudentGrid.jsx` - Grid card view
- `StudentDetail.jsx` - Detail modal
- `AddStudentModal.jsx` - Add form

Uses: Card, Input, Select, Modal, Badge, Table, Button

---

### Step 3: Create Other Pages (5-6 hours total)
- Teachers (`esl-management.jsx` lines 169-233)
- Classes (`esl-management.jsx` lines 235-316)
- Schedule (`esl-pages.jsx` lines 4-77)
- Finance (`esl-pages.jsx` lines 79-130)
- Attendance (`esl-pages.jsx` lines 156-208)
- Tests, Reports, Notifications, Settings (rest of esl-pages.jsx)

---

## 🔧 Styling with CSS Variables

All colors already defined in `src/styles/variables.css`:

```jsx
// Colors
style={{ color: 'var(--primary)' }}           // #FF6B35
style={{ color: 'var(--text-1)' }}           // Main text
style={{ color: 'var(--text-3)' }}           // Muted text
style={{ background: 'var(--card)' }}        // Card background
style={{ borderColor: 'var(--border)' }}     // Borders
style={{ boxShadow: 'var(--shadow-lg)' }}    // Shadows

// Spacing
padding: 'var(--spacing-lg)'                  // 16px
gap: 'var(--spacing-md)'                      // 12px
borderRadius: 'var(--radius-md)'              // 12px

// Themes auto-switch based on data-theme attribute
// Set by: useTheme() hook
```

---

## 🌙 Dark Mode Already Works!

Just toggle with the button in Header:
```jsx
const { mode, toggle } = useTheme();
// mode = 'light' | 'dark'
```

All colors automatically switch. No additional code needed!

---

## 📊 Using Mock Data

```jsx
import { STUDENTS_DATA, CLASSES_DATA } from '../../data';

// STUDENTS_DATA is an array of 15 students
// Each with: id, name, age, level, className, parent, phone, email, status, etc

// CLASSES_DATA is an array of 10 classes
// Each with: id, name, level, teacher, schedule, students, maxStudents, etc

// Direct access:
const students = STUDENTS_DATA;
const filteredByLevel = STUDENTS_DATA.filter(s => s.level === 'A1');
```

---

## ✍️ Form Validation

```jsx
import { validateEmail, validatePhone, validateForm } from '../../utils';

// Single field validation
const isValid = validateEmail('user@example.com');

// Form validation
const { isValid, errors } = validateForm(
  { name: 'John', age: '25' },
  ['name', 'age']
);
```

---

## 🎬 Adding Animations

```jsx
import { FadeIn } from '../../components';

// Fade in on scroll
<FadeIn delay={0} direction="up">
  <div>Content here</div>
</FadeIn>

// Available directions: up, right, left, scale, none
```

For numbers:
```jsx
import { useAnimatedNumber } from '../../hooks';

const [ref, animatedValue] = useAnimatedNumber(245, 900); // duration ms
// animatedValue counts from 0 to 245 over 900ms
```

---

## 🔄 Component Reuse Examples

### Button
```jsx
<Button variant="primary" size="md" icon="plus" onClick={handleClick}>
  Thêm học viên
</Button>
// Variants: primary, secondary, outline, ghost, danger
// Sizes: sm, md, lg
```

### Card
```jsx
<Card hover animate delay={80} onClick={handleClick}>
  <div>Card content</div>
</Card>
```

### Badge
```jsx
<Badge variant="success">Active</Badge>
// Variants: default, success, warning, error, primary, info
```

### Input
```jsx
<Input
  label="Tên"
  value={name}
  onChange={setName}
  placeholder="Nhập tên..."
  icon="user"
/>
```

---

## 📱 Responsive Breakpoint

Mobile: `window.innerWidth < 768`

Used in:
- Sidebar (collapses on mobile)
- Header (hides search on mobile)
- App.jsx already handles this!

---

## ✅ Checklist for Each New Page

- [ ] Create folder: `src/pages/PageName/`
- [ ] Create `PageName.jsx` with page component
- [ ] Create sub-components in same folder
- [ ] Import from `../../components` and `../../data`
- [ ] Use CSS variables for colors
- [ ] Keep styles inline (no separate CSS)
- [ ] Add to App.jsx routing
- [ ] Test on mobile (768px)
- [ ] Test dark mode toggle
- [ ] Verify animations work

---

## 🎓 Learning Resources in Project

- **COMPONENTS_COMPLETED.md** - Full inventory of what exists
- **PROJECT_STRUCTURE.md** - Phase breakdown & TODO list
- **README.md** - Project overview
- Original files (esl-*.jsx) - See how it was built

---

## 💡 Tips & Tricks

1. **Always use `<FadeIn>` for list items** - Looks professional
2. **Use `<Card animate>` for sections** - Auto-animate on scroll
3. **Check colors in `variables.css`** - Never hardcode colors
4. **Copy inline styles from existing components** - Consistency
5. **Use formatters for dates/currency** - `formatDate()`, `formatCurrency()`
6. **Test dark mode after every page** - CSS vars handle it
7. **Mobile first** - Test on 375px first, then scale up

---

## 🚨 Common Mistakes to Avoid

❌ Don't import CSS files (no local stylesheets)
❌ Don't hardcode colors (use CSS variables)
❌ Don't forget mobile testing (768px)
❌ Don't recreate existing components (reuse!)
❌ Don't put styles in separate CSS (keep inline)

---

## 🎉 That's It!

The hardest part is done. Now just extract and wire up the pages.

**Estimated time to complete all pages:** 2-3 days of focused work

Good luck! 🚀
