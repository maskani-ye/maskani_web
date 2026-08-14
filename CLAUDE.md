# maskani_web — Next.js 14 Web App

## نظرة عامة

Next.js 14 App Router + TypeScript + Tailwind CSS + RTL عربي — **تطبيق مستخدم عام + لوحة إدارة**

> تطبيق ويب كامل للمستخدمين العاديين (عقارات/خدمات/شكاوى/طلبات/شات) **ولوحة إدارة** لأصحاب `role === 'admin'`. تسجيل الدخول **بـ Google حصراً** للجميع، والتوكن **knox** (لا JWT).

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
api.get('/properties/', { params: { offset: 0, limit: 20 } })
api.get('/properties/', { params: { offset: 20, limit: 20 } })  // الصفحة التالية

// ❌ خطأ
api.get('/properties/', { params: { page: 2 } })
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
primary = #4F2396    // بنفسجي Gathern
gold    = #FFC107    // كهرماني (أكسنت)
cream   = #F6F6FB    // خلفية
ink     = #050536    // نصّ رئيسي (كحلي)
```

---

## هيكل الملفات

```
maskani_web/
├── app/
│   ├── layout.tsx            # RTL + Cairo font + AuthProvider
│   ├── globals.css           # Tailwind + glass utilities
│   ├── auth/                 # login + register
│   └── admin/                # لوحة الإدارة (role === 'admin') — مجمّعة حسب الوظيفة
│       ├── layout.tsx        # Sidebar (NAV_GROUPS) + Header
│       ├── page.tsx          # لوحة التحكم — إحصائيات
│       ├── analytics/        # التحليلات            [نظرة عامة]
│       ├── users/            # المستخدمون           [المستخدمون]
│       ├── verification/     # طلبات التوثيق        [المستخدمون]
│       ├── properties/         # العقارات            [العقارات]
│       ├── requests/         # طلبات عقارية         [العقارات]
│       ├── services/         # مزودو الخدمة         [الخدمات]
│       ├── jobs/             # طلبات الخدمة         [الخدمات]
│       ├── conversations/    # المحادثات            [التواصل]
│       ├── helpdesk/         # مركز المساعدة        [التواصل]
│       ├── broadcast/        # الإشعارات (بثّ جماعي) [التواصل]
│       ├── reports/          # البلاغات             [الرقابة والسلامة]
│       ├── flags/            # بلاغات المستخدمين    [الرقابة والسلامة]
│       ├── property-types/   # أنواع العقارات       [الإعدادات والبيانات]
│       ├── categories/       # أصناف الخدمات        [الإعدادات والبيانات]
│       ├── cities/           # المدن والدول         [الإعدادات والبيانات]
│       ├── infrastructure/    # الخدمات (12 مزوّداً)  [البنية والخدمات]
│       └── ai/                # الذكاء الاصطناعي     [البنية والخدمات]
├── components/
│   ├── ui/                   # Button, Input, Select, Badge, Card, StarRating
│   └── layout/               # Sidebar, Header
├── context/
│   ├── AuthContext.tsx       # Auth state global
│   ├── CityContext.tsx       # المدينة المختارة (localStorage)
│   └── CountryContext.tsx    # الدولة: كشف تلقائي مرّة واحدة ثم اختيار المستخدم
├── lib/
│   ├── api.ts                # Axios + knox Token interceptor (Authorization: Token, بلا refresh)
│   ├── auth.ts               # knox token cookie helpers (token واحد)
│   └── utils.ts              # cn(), formatPrice(), label maps
└── types/index.ts            # كل TypeScript interfaces
```

---

## Auth Flow (Google فقط + knox token — لا JWT)

1. تسجيل الدخول **بـ Google حصراً** للجميع (مستخدم + أدمن): زر Google (GIS) → `id_token` → `POST /auth/google/`. للمستخدم الجديد `needs_completion` → صفحة إكمال (هاتف + مدينة) → `POST /auth/google/complete/`. لا يوجد phone/password ولا register.
2. النجاح يعيد `{ token, user }` — التوكن **knox** يُخزَّن في كوكي واحد `token` عبر `lib/auth.ts` (`secure` + `sameSite: strict`، 30 يوماً).
3. Axios interceptor في `lib/api.ts` يُضيف `Authorization: Token <token>` تلقائيًا. **لا refresh** (توكن knox صالح 30 يوماً).
4. عند 401 — `clearToken()` + redirect لـ `/auth/login` (بلا محاولة تجديد).
5. `AuthContext` يوفر `{ user, loginWithGoogle, completeGoogle, logout, refreshUser }`.
6. الخروج: `POST /auth/logout/` (يحذف توكن knox) ثم مسح الكوكي.
7. Admin middleware: كل صفحات `/admin/*` تتحقق من `role === 'admin'`.

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

الشريط الجانبي (`app/admin/layout.tsx`) مجمّع حسب التخصّص/الوظيفة عبر `NAV_GROUPS`
(كل مجموعة `{ title, items }`، وكل عنصر `{ href, label, icon }`). القائمة المسطّحة
`NAV = NAV_GROUPS.flatMap(g => g.items)` تُشتقّ منها لتحديد العنصر النشط وعنوان الصفحة.
**نفس التقسيم مطبّق في تطبيق الإدارة (Flutter) على شاشة الهوم** (`dashboard_screen.dart`
عبر `_sections`) و`nav_items.dart` — أبقِهما متطابقين. الترتيب ثابت:

```ts
const NAV_GROUPS = [
  { title: 'نظرة عامة',          items: [ '/admin' لوحة التحكم, '/admin/analytics' التحليلات ] },
  { title: 'المستخدمون',         items: [ '/admin/users' المستخدمون, '/admin/verification' طلبات التوثيق ] },
  { title: 'العقارات',           items: [ '/admin/properties' العقارات, '/admin/requests' طلبات عقارية ] },
  { title: 'الخدمات',            items: [ '/admin/services' مزودو الخدمة, '/admin/jobs' طلبات الخدمة ] },
  { title: 'التواصل',            items: [ '/admin/conversations' المحادثات, '/admin/helpdesk' مركز المساعدة, '/admin/broadcast' الإشعارات ] },
  { title: 'الرقابة والسلامة',   items: [ '/admin/reports' البلاغات, '/admin/flags' بلاغات المستخدمين ] },
  { title: 'الإعدادات والبيانات', items: [ '/admin/property-types' أنواع العقارات, '/admin/categories' أصناف الخدمات, '/admin/cities' المدن والدول ] },
  { title: 'البنية والخدمات',    items: [ '/admin/infrastructure' الخدمات (12 مزوّداً بصفحة مقاييس لكل واحد), '/admin/ai' الذكاء الاصطناعي ] },
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

// Properties
GET  /api/v1/admin/properties/       // ?offset=&limit=
PATCH /api/v1/admin/properties/{id}/ // تغيير status

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

## تعدّد الدول

- `CountryProvider` يكشف الدولة **مرّة واحدة فقط** عند غياب اختيار محفوظ (`maskani_selected_country`)، ثم يفوز اختيار المستخدم دائماً — المغترب يتصفّح سوق بلده بلا أن يُعاد ضبطه كل زيارة.
- مُبدِّل الدولة في `Navbar` يظهر فقط حين تتجاوز الدول واحدة. تبديل الدولة يمسح المدينة المختارة.
- كل قائمة تمرّر `?country=<ISO>` (العقارات · الخدمات · الطلبات · طلبات الخدمة) وقوائم المدن كذلك.
- صفحة هبوط لكل دولة: `app/properties/country/[slug]/page.tsx` (+ خريطة الموقع + روابط الفوتر).

## الفيديو

`components/ui/YouTubePlayer.tsx` — مصغّرة وزرّ تشغيل، ولا يُحمَّل iframe إلّا عند النقر
(`youtube-nocookie`). يُستخدم في صفحات تفاصيل العقار/الخدمة/الطلبين، وحقل الإدخال في
نماذج النشر. صفحة العقار تُصدر `VideoObject` في البيانات المنظّمة.

## الرصد

Sentry مربوط عبر `instrumentation.ts` (خادم) و`instrumentation-client.ts` (متصفّح)
بمشروع `maskani-web`. عيّنة الأداء 10% ولا تُرسَل بيانات شخصية.

## ملاحظات مهمة

- `dir="rtl"` على `<html>` — كل المكونات RTL by default
- Font: Cairo من Google Fonts
- أغلب الصفحات Client Components (لا Server Components معقدة)
- Recharts للرسوم البيانية في Dashboard
- لا بوابة دفع بأي شكل
