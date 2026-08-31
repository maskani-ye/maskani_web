import { createMarketSection } from "@/lib/marketSection";
import PropertiesListClient from "@/app/properties/PropertiesListClient";

/**
 * عقارات السوق — تُبنى من مصنع أقسام السوق.
 *
 * ⚠️ **لا تنسخ هيكل الصفحة هنا**: `revalidate` وقاعدة `noindex` للسوق الفارغ
 * و`generateStaticParams` كلّها في `lib/marketSection` — تعديلها هناك يسري على
 * الأقسام الأربعة دفعةً واحدة. ما يخصّ هذا القسم وحده: عنوانه ووصفه ومكوّنه.
 */
const section = createMarketSection({
  slug: "properties",
  title: (m) => `عقارات للبيع والإيجار في ${m.nameAr}`,
  description: (m, cities) => `شقق وفلل وأراضٍ للبيع والإيجار في ${m.nameAr} — ${cities} وغيرها. تواصل مباشر مع صاحب العقار بلا عمولة.`,
  render: () => <PropertiesListClient />,
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
