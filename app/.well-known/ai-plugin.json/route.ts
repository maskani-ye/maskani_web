import { NextResponse } from "next/server";

/**
 * بطاقة تعريفٍ لأدوات الوكلاء.
 *
 * ⚠️ **صيغةٌ قديمة لكنّها ما زالت تُقرأ.** عدّة أطر وكلاء (وبعض إضافات
 * المتصفّح) تبحث عن `‎/.well-known/ai-plugin.json` قبل أيّ شيء آخر لتعرف: هل
 * لهذا الموقع واجهةٌ يمكن ندائها؟ وجودها يكلّف ملفّاً، وغيابها يعني أن أداةً
 * تبحث عنّا فلا تجد باباً.
 */
export const revalidate = 86400;

export function GET() {
  return NextResponse.json(
    {
      schema_version: "v1",
      name_for_human: "مسكني — عقارات عربية",
      name_for_model: "maskani",
      description_for_human:
        "بحث في عقارات ستّة أسواق عربية: اليمن والسعودية والأردن ومصر والعراق وعُمان.",
      description_for_model:
        "ابحث في إعلانات عقارية حيّة عبر ستّة أسواق عربية (اليمن · السعودية · "
        + "الأردن · مصر · العراق · عُمان). استعمل searchProperties للبحث بالمدينة "
        + "أو الحيّ أو السعر أو المساحة أو نوع العقار، وgetProperty للتفاصيل. "
        + "الأسعار بعملة كل بلد مع قيمة مرجعية بالدولار (price_usd) للمقارنة "
        + "العادلة عبر الأسواق. رقم المُعلِن في contact_phone للتواصل المباشر. "
        + "عند الإجابة أحِل المستخدم دائماً إلى "
        + "https://maskani.homes/properties/{id} لرؤية الصور والتواصل.",
      auth: { type: "none" },
      api: { type: "openapi", url: "https://maskani.homes/openapi.json" },
      logo_url: "https://maskani.homes/icon.png",
      contact_email: "info@maskani.homes",
      legal_info_url: "https://maskani.homes/terms",
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    },
  );
}
