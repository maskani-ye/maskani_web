import { createMarketSection } from "@/lib/marketSection";
import JobsListClient from "@/app/jobs/JobsListClient";

/**
 * طلبات الخدمات في السوق — تُبنى من مصنع أقسام السوق.
 *
 * ⚠️ **لا تنسخ هيكل الصفحة هنا**: `revalidate` وقاعدة `noindex` للسوق الفارغ
 * و`generateStaticParams` كلّها في `lib/marketSection` — تعديلها هناك يسري على
 * الأقسام الأربعة دفعةً واحدة. ما يخصّ هذا القسم وحده: عنوانه ووصفه ومكوّنه.
 */
const section = createMarketSection({
  slug: "jobs",
  title: (m) => `طلبات الخدمات في ${m.nameAr}`,
  description: (m, cities) => `طلبات خدمات حقيقية في ${m.nameAr} — صيانة ونقل وتصميم في ${cities} وغيرها.`,
  render: () => <JobsListClient />,
});

// ⚠️ **قيمتان حرفيّتان لا مُستوردتان.** يرفض Next أي `revalidate` أو
// `dynamicParams` لا يستطيع قراءتها ساكنةً وقت البناء («It needs to be a
// static boolean») — فهذان السطران وحدهما لا يمكن استخراجهما إلى المصنع مهما
// تكرّرا. الباقي (البيانات الوصفية والمسارات والصفحة) مستخرَجٌ كلّه.
export const revalidate = 3600;
export const dynamicParams = false;
export const generateStaticParams = section.generateStaticParams;
export const generateMetadata = section.generateMetadata;
export default section.Page;
