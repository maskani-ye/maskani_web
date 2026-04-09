# maskani_web — Next.js 14 Web App

## نظرة عامة

Next.js 14 App Router + TypeScript + Tailwind CSS + RTL عربي

## تشغيل المشروع

```bash
cd maskani_web
npm install
npm run dev       # http://localhost:3000
npm run build
npm run lint
```

## هيكل الملفات

```
maskani_web/
├── app/
│   ├── layout.tsx            # RTL + Cairo font + AuthProvider
│   ├── globals.css           # Tailwind + glass utilities
│   ├── (main)/               # الصفحات العامة (Navbar + Footer)
│   │   ├── page.tsx          # الصفحة الرئيسية
│   │   ├── listings/         # قائمة + تفاصيل الإعلانات
│   │   ├── fraud-reports/    # الشكاوي + إنشاء شكوى
│   │   ├── requests/         # طلبات العملاء
│   │   ├── services/         # مزودو الخدمات
│   │   └── admin/            # لوحة الإدارة
│   └── auth/                 # login + register
├── components/
│   ├── ui/                   # Button, Input, Select, Badge, Card, StarRating
│   └── layout/               # Navbar, Footer
├── context/AuthContext.tsx   # Auth state global
├── lib/
│   ├── api.ts                # Axios + JWT auto-refresh
│   ├── auth.ts               # token helpers
│   └── utils.ts              # cn(), formatPrice(), label maps
└── types/index.ts            # كل TypeScript interfaces
```

## التصميم

| اللون | القيمة | الاستخدام |
|-------|--------|-----------|
| primary | `#2D6A4F` | الأخضر الزيتوني — الرئيسي |
| gold | `#D4A017` | الذهبي — السعر والمميز |
| cream | `#F8F6F0` | خلفية الصفحات |

```css
/* خدع CSS */
.glass { backdrop-filter: blur(12px); background: rgba(255,255,255,0.85); }
.card-shadow { box-shadow: 0 4px 24px rgba(45,106,79,0.08); }
```

## Auth Flow

1. تخزين JWT في `localStorage` عبر `lib/auth.ts`
2. Axios interceptor يُضيف `Authorization: Bearer <token>` تلقائيًا
3. عند 401 — يُحاول refresh تلقائيًا ثم يُعيد الطلب الأصلي
4. عند فشل الـ refresh — `clearTokens()` + redirect لـ `/auth/login`
5. `AuthContext` يوفر `{ user, login, register, logout, refreshUser }`

## مكونات UI

```tsx
// Button
<Button variant="primary|secondary|outline|ghost|danger" size="sm|md|lg" loading={...}>

// Input
<Input label="..." error="..." hint="..." startIcon={<Icon/>} />

// Select
<Select label="..." options={[{value, label}]} error="..." />

// Badge
<Badge color="green|yellow|red|blue|purple|gray">

// StarRating
<StarRating value={4} interactive onChange={(v) => ...} />
```

## صفحة الإعلانات

- فلترة بـ: نوع العقار، نوع العرض، المدينة، السعر (min/max)، المساحة، الغرف، المميزات
- مفضلة: toggle بدون تسجيل → يُعيد توجيه لـ login
- تفاصيل: معرض صور (AnimatePresence)، مواصفات grid، تواصل مباشر

## ملاحظات

- `dir="rtl"` على `<html>` — كل المكونات RTL by default
- Font: Cairo من Google Fonts
- لا Server Components معقدة — أغلب الصفحات Client Components
- Recharts للرسوم البيانية في Admin
