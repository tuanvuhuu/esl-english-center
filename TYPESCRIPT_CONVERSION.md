# TypeScript Conversion Guide

## Hoàn Thành (✅)

- ✅ `tsconfig.json` - Cấu hình TypeScript
- ✅ `vite.config.ts` - Config Vite
- ✅ `src/index.tsx` - Entry point
- ✅ `src/App.tsx` - App component
- ✅ `src/config/routers.ts` - Router definitions
- ✅ `src/config/index.ts` - Config barrel export
- ✅ `src/hooks/useTheme.ts` - Theme hook
- ✅ `src/hooks/useInView.ts` - InView hook
- ✅ `src/hooks/useAnimatedNumber.ts` - AnimatedNumber hook
- ✅ `src/hooks/useTweaks.ts` - Tweaks hook
- ✅ `src/hooks/index.ts` - Hooks barrel export
- ✅ `src/context/ThemeContext.tsx` - Theme context
- ✅ `src/utils/constants.ts` - Constants
- ✅ `src/utils/formatters.ts` - Formatters
- ✅ `src/utils/validators.ts` - Validators
- ✅ `src/utils/animations.ts` - Animations
- ✅ `src/utils/index.ts` - Utils barrel export
- ✅ `src/components/common/Icon.tsx` - Icon component

## Còn Lại (~45 files)

### Components Common (13 files)
- `Avatar.jsx` → `Avatar.tsx`
- `Badge.jsx` → `Badge.tsx`
- `Button.jsx` → `Button.tsx`
- `Card.jsx` → `Card.tsx`
- `EmptyState.jsx` → `EmptyState.tsx`
- `FadeIn.jsx` → `FadeIn.tsx`
- `InfoRow.jsx` → `InfoRow.tsx`
- `Input.jsx` → `Input.tsx`
- `Modal.jsx` → `Modal.tsx`
- `PageHeader.jsx` → `PageHeader.tsx`
- `Select.jsx` → `Select.tsx`
- `Tabs.jsx` → `Tabs.tsx`
- `StatusBadge.jsx` → `StatusBadge.tsx`

### Components Layout (2 files)
- `Header.jsx` → `Header.tsx`
- `Sidebar.jsx` → `Sidebar.tsx`

### Components Charts (3 files)
- `AreaChart.jsx` → `AreaChart.tsx`
- `BarChart.jsx` → `BarChart.tsx`
- `DonutChart.jsx` → `DonutChart.tsx`

### Pages (~27 files)
Tất cả các pages folder cần:
- `Page.jsx` → `Page.tsx`
- Sub-components `.jsx` → `.tsx`
- `index.js` → `index.ts`

## Cách Chuyển Đổi Nhanh

### Cách 1: Sử dụng IDE (Recommended)
1. Mở project trong VS Code
2. Cài extension "TypeScript Convert": `ctrl+shift+x` → tìm "TypeScript Convert"
3. Chọn file → `Cmd/Ctrl + Shift + P` → "Convert to TypeScript"

### Cách 2: Batch Rename + Manual Fix
```bash
# Rename tất cả .jsx → .tsx
find src/components -name "*.jsx" -type f -exec sh -c 'mv "$1" "${1%.jsx}.tsx"' _ {} \;
find src/pages -name "*.jsx" -type f -exec sh -c 'mv "$1" "${1%.jsx}.tsx"' _ {} \;

# Rename tất cả index.js → index.ts
find src -name "index.js" -type f -exec sh -c 'mv "$1" "${1%.js}.ts"' _ {} \;
```

Sau đó fix type errors bằng tay.

### Cách 3: Dùng AI (ChatGPT)
1. Copy nội dung file .jsx
2. Paste vào ChatGPT
3. Prompt: "Convert this React .jsx to TypeScript .tsx with proper prop types and interfaces"
4. Copy kết quả vào file .tsx mới

## TypeScript Conversion Patterns

### Component Props
```typescript
// Before (JS)
const Button = ({ label, onClick, variant = 'primary' }) => { ... }

// After (TS)
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const Button = ({ label, onClick, variant = 'primary' }: ButtonProps) => { ... }
```

### Hooks
```typescript
// Before (JS)
export const useMyHook = () => {
  const [value, setValue] = useState();
  return [value, setValue];
}

// After (TS)
export const useMyHook = (): [string, (v: string) => void] => {
  const [value, setValue] = useState<string>('');
  return [value, setValue];
}
```

### Data Types
```typescript
// constants.ts types
interface NavItem {
  id: string;
  label: string;
  icon: string;
  section?: string;
}

export const NAV_ITEMS: NavItem[] = [...]
```

## Update package.json (if needed)

Thêm TypeScript dev dependency nếu chưa có:
```bash
npm install --save-dev typescript
```

## Verification
```bash
# Check TypeScript errors
npx tsc --noEmit

# Run dev server
npm run dev
```

## Thứ tự Chuyển Đổi Recommended
1. ✅ Core files (config, hooks, utils, context)
2. Components common (từ đơn giản đến phức tạp)
3. Components layout
4. Components charts
5. Pages (Dashboard, Students, Teachers, Classes, etc.)

**Tổng Estimated Time**: 30-60 phút (với IDE tool hoặc batch script)
