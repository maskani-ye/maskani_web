# maskani_web — Next.js 14 Web App

## نظرة عامة

Next.js 14 App Router + TypeScript + Tailwind CSS + RTL عربي — **لوحة الإدارة فقط**

> هذا التطبيق مخصص للـ Admin فقط. لا توجد ميزات للمستخدمين العاديين هنا — كل ميزات المستخدم في Flutter.

## تشغيل المشروع

```bash
cd maskani_web
npm install
npm run dev       # http://localhost:3000
npm run build
npm run lint
```

---

## القواعد الصارمة — يجب اتباعها دائماً

### 1. الترقيم الصفحي
```ts
// ✅ صحيح — offset/limit دائماً
api.get('/listings/', { params: { offset: 0, limit: 20 } })
api.get('/listings/', { params: { offset: 20, limit: 20 } })  // الصفحة التالية

// ❌ خطأ
api.get('/listings/', { params: { page: 2 } })
```

### 2. مكوّن Badge
```tsx
// ✅ صحيح — variant فقط، لا يوجد size prop
<Badge variant="success|warning|error|info|default">نص</Badge>

// ❌ خطأ
<Badge color="green">        // لا يوجد color prop
<Badge size="sm">            // لا يوجد size prop
```

### 3. طلبات API
```ts
// ✅ دائماً عبر lib/api.ts
import api from '@/lib/api'
const res = await api.get('/endpoint/')

// ❌ خطأ
fetch('/api/...')
axios.create(...)   // بدون استخدام api.ts
```

### 4. الألوان والتصميم
```tsx
// ✅ Tailwind classes فقط — لا inline styles
className="text-primary bg-cream"

// Design tokens
primary = #2D6A4F    // أخضر زيتوني
gold    = #D4A017    // ذهبي
cream   = #F8F6F0    // خلفية
```

---

## هيكل الملفات

```
maskani_web/
├── app/
│   ├── layout.tsx            # RTL + Cairo font + AuthProvider
│   ├── globals.css           # Tailwind + glass utilities
│   ├── auth/                 # login + register
│   └── admin/                # لوحة الإدارة (كل شيء هنا)
│       ├── layout.tsx        # Sidebar + Header
│       ├── page.tsx          # Dashboard — إحصائيات
│       ├── users/            # إدارة المستخدمين
│       ├── listings/         # إدارة الإعلانات
│       ├── fraud-reports/    # إدارة الشكاوي
│       ├── requests/         # عرض الطلبات
│       └── services/         # عرض مزودي الخدمات
├── components/
│   ├── ui/                   # Button, Input, Select, Badge, Card, StarRating
│   └── layout/               # Sidebar, Header
├── context/AuthContext.tsx   # Auth state global
├── lib/
│   ├── api.ts                # Axios + JWT auto-refresh interceptor
│   ├── auth.ts               # token helpers (localStorage)
│   └── utils.ts              # cn(), formatPrice(), label maps
└── types/index.ts            # كل TypeScript interfaces
```

---

## Auth Flow

1. تخزين JWT في `localStorage` عبر `lib/auth.ts`
2. Axios interceptor في `lib/api.ts` يُضيف `Authorization: Bearer <token>` تلقائيًا
3. عند 401 — يُحاول refresh تلقائيًا ثم يُعيد الطلب الأصلي
4. عند فشل الـ refresh — `clearTokens()` + redirect لـ `/auth/login`
5. `AuthContext` يوفر `{ user, login, register, logout, refreshUser }`
6. Admin middleware: كل صفحات `/admin/*` تتحقق من `role === 'admin'`

---

## مكونات UI

```tsx
// Button
<Button variant="primary|secondary|outline|ghost|danger" size="sm|md|lg" loading={...}>

// Input
<Input label="..." error="..." hint="..." startIcon={<Icon/>} />

// Select
<Select label="..." options={[{value, label}]} error="..." />

// Badge — variant فقط، لا color ولا size
<Badge variant="success|warning|error|info|default">نص</Badge>

// StarRating
<StarRating value={4} interactive onChange={(v) => ...} />

// Card
<Card className="...">...</Card>
```

---

## Sidebar Navigation

```ts
// ترتيب ثابت — لا تغيير
[
  { href: '/admin',              label: 'لوحة التحكم',    icon: LayoutDashboard },
  { href: '/admin/users',        label: 'المستخدمون',     icon: Users },
  { href: '/admin/listings',     label: 'الإعلانات',      icon: Home },
  { href: '/admin/fraud-reports',label: 'الشكاوي',        icon: AlertTriangle },
  { href: '/admin/requests',     label: 'طلبات العملاء',  icon: FileText },
  { href: '/admin/services',     label: 'مزودو الخدمات',  icon: Briefcase },
]
```

---

## API Endpoints المستخدمة (Admin فقط)

```ts
// Dashboard
GET  /api/v1/admin/stats/

// Users
GET  /api/v1/admin/users/          // ?offset=&limit=&search=
PATCH /api/v1/admin/users/{id}/    // تعديل role, is_verified, is_service_provider

// Listings
GET  /api/v1/admin/listings/       // ?offset=&limit=
PATCH /api/v1/admin/listings/{id}/ // تغيير status

// Fraud Reports
GET  /api/v1/admin/fraud-reports/  // ?offset=&limit=&status=
PATCH /api/v1/admin/fraud-reports/{id}/ // status: pending|verified|rejected

// Requests (عرض فقط)
GET  /api/v1/requests/             // ?offset=&limit=

// Services (عرض فقط)
GET  /api/v1/services/             // ?offset=&limit=
```

---

## CSS Utilities

```css
.glass { backdrop-filter: blur(12px); background: rgba(255,255,255,0.85); }
.card-shadow { box-shadow: 0 4px 24px rgba(45,106,79,0.08); }
```

---

## ملاحظات مهمة

- `dir="rtl"` على `<html>` — كل المكونات RTL by default
- Font: Cairo من Google Fonts
- أغلب الصفحات Client Components (لا Server Components معقدة)
- Recharts للرسوم البيانية في Dashboard
- لا توجد ميزات للمستخدم العادي — التطبيق Flutter فقط
- لا بوابة دفع بأي شكل
