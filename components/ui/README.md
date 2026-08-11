# نظام التصميم — العناصر المشتركة (`components/ui`)

مصدر واحد لكل عناصر الواجهة. **كل صفحة تَرِث من هنا — ممنوع تكرار ترويسة/تحميل/فراغ/بطاقة/ترقيم في الصفحات.**
التوكنات (ألوان/ظلال/طباعة) في `tailwind.config.ts` + `lib/theme.ts` (مصدر JS) + `app/globals.css`.

## عناصر التركيب (Layout)
- **`PageContainer`** — حاوية الصفحة (عرض أقصى + تباعد). `size="sm|md|lg"`.
- **`PageHeader`** — ترويسة موحّدة (أيقونة-صندوق + عنوان + وصف + `actions`). تُصدَّر أيضاً كـ`AdminPageHeader`.
- **`Toolbar`** — شريط بحث/فلاتر داخل بطاقة.
- **`DataList<T>`** — قائمة تتكفّل بالتحميل (skeleton) + الفراغ (`EmptyState`) + الصفوف. `card`/`gridClassName` للعرض الشبكي.
- **`Pagination`** — ترقيم offset/limit (السابق/التالي).

## الأوّليّات (Primitives)
`Button · Input · Select · PhoneField · MoneyInput · Badge · Card · StatCard · ChartCard ·
EmptyState · Skeleton (+SkeletonText) · ConfirmDialog · Dialog · Drawer · DataTable ·
StarRating · ShareButton · IconPicker`

## النمط الموحّد لأي صفحة قائمة
```tsx
<PageContainer>
  <PageHeader icon={<Icon />} title="…" subtitle={`${total} عنصر`} actions={<Button>…</Button>} />
  <Toolbar><Input …/><Select …/></Toolbar>
  <DataList items={rows} loading={loading} keyOf={r=>r.id}
    empty={{ icon: Icon, title: "لا نتائج" }}
    renderItem={(r)=><EntityCard item={r} variant="row" />} />
  <Pagination offset={offset} limit={LIMIT} total={total} onChange={setOffset} />
</PageContainer>
```
