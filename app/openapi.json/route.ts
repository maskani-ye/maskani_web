import { NextResponse } from "next/server";

/**
 * وصفٌ آليّ لواجهة القراءة — العقد الذي يقرأه الوكيل قبل أن ينادينا.
 *
 * ⚠️ **`llms.txt` يشرح للبشر، وهذا يشرح للآلة.** المساعد الذي يملك أدوات
 * (ChatGPT بأفعاله · وكلاء LangChain · MCP) لا يقرأ نصّاً ليبني طلباً — يقرأ
 * وصفاً مُهيكلاً يعرف منه المسارات والمعاملات وشكل الردّ. وبدونه إمّا لا
 * ينادينا أصلاً، أو يخمّن المعاملات فيخطئ ثمّ يستنتج أنّ الواجهة معطوبة.
 *
 * ⚠️ **وهو للقراءة وحدها.** لا مسار كتابةٍ هنا ولا مصادقة: الوكيل يبحث ويقتبس
 * ويحيل إلى صفحةٍ عندنا، ولا ينشر باسم أحد.
 */
export const revalidate = 86400;

const API = "https://api.maskani.homes/api/v1";
const SITE = "https://maskani.homes";

const MARKETS = ["YE", "SA", "JO", "EG", "IQ", "OM"];

const paginated = (itemsRef: string) => ({
  type: "object",
  properties: {
    count: { type: "integer", description: "إجمالي النتائج المطابقة" },
    next: { type: "string", nullable: true, description: "رابط الصفحة التالية" },
    previous: { type: "string", nullable: true },
    results: { type: "array", items: { $ref: itemsRef } },
  },
});

const COMMON = [
  { name: "limit", in: "query", schema: { type: "integer", maximum: 100, default: 20 },
    description: "عدد النتائج (السقف 100)" },
  { name: "offset", in: "query", schema: { type: "integer", default: 0 },
    description: "الإزاحة — الترقيم بـoffset لا بـpage" },
  { name: "country", in: "query", schema: { type: "string", enum: MARKETS },
    description: "رمز الدولة ISO — يحصر النتائج في سوقٍ واحد" },
];

export function GET() {
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "مسكني — واجهة القراءة العامّة",
      version: "1.0.0",
      description:
        "بحثٌ حيّ في عقارات وخدمات وطلبات ستّة أسواق عربية (اليمن · السعودية · "
        + "الأردن · مصر · العراق · عُمان). بلا مفتاح ولا تسجيل، قراءةٌ فقط. "
        + "كل عنصر يحمل `id` تُبنى منه صفحته: "
        + `${SITE}/properties/{id}`,
      contact: { url: `${SITE}/contact` },
    },
    servers: [{ url: API }],
    paths: {
      "/properties/": {
        get: {
          operationId: "searchProperties",
          summary: "بحث العقارات",
          description:
            "يدعم الفلترة بالمدينة والحيّ والنوع والعرض والسعر والمساحة والغرف. "
            + "السعر يُفسَّر بالعملة المُرسَلة ثمّ يُقارَن بقيمةٍ مرجعية بالدولار، "
            + "فالمقارنة عادلة عبر الأسواق.",
          parameters: [
            ...COMMON,
            { name: "search", in: "query", schema: { type: "string" },
              description: "بحث نصّي في العنوان والوصف والحيّ والعنوان" },
            { name: "city", in: "query", schema: { type: "integer" },
              description: "معرّف المدينة — من /cities/" },
            { name: "neighborhood_ref", in: "query", schema: { type: "integer" },
              description: "معرّف الحيّ — من /cities/neighborhoods/?city=" },
            { name: "offer_type", in: "query",
              schema: { type: "string", enum: ["sale", "rent_monthly", "rent_yearly"] } },
            { name: "property_type", in: "query", schema: { type: "integer" },
              description: "معرّف نوع العقار — من /properties/property-types/" },
            { name: "price_min", in: "query", schema: { type: "number" } },
            { name: "price_max", in: "query", schema: { type: "number" } },
            { name: "price_currency", in: "query",
              schema: { type: "string", enum: ["YER", "YEA", "SAR", "JOD", "EGP", "IQD", "OMR", "USD"] },
              description: "عملة الحدّين أعلاه (الافتراضي YER)" },
            { name: "area_min", in: "query", schema: { type: "number" } },
            { name: "area_max", in: "query", schema: { type: "number" } },
            { name: "rooms_min", in: "query", schema: { type: "integer" } },
            { name: "ordering", in: "query",
              schema: { type: "string",
                        enum: ["-created_at", "price", "-price", "area", "-area", "-views_count"] } },
          ],
          responses: {
            200: { description: "نتائج مطابقة",
                   content: { "application/json": { schema: paginated("#/components/schemas/Property") } } },
          },
        },
      },
      "/properties/{id}/": {
        get: {
          operationId: "getProperty",
          summary: "تفاصيل عقار",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
          responses: { 200: { description: "العقار",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Property" } } } } },
        },
      },
      "/cities/": {
        get: {
          operationId: "listCities",
          summary: "مدن سوقٍ ما مع عدد عقاراتها",
          parameters: [{ name: "country", in: "query", schema: { type: "string", enum: MARKETS } }],
          responses: { 200: { description: "المدن" } },
        },
      },
      "/cities/neighborhoods/": {
        get: {
          operationId: "listNeighborhoods",
          summary: "أحياء مدينة",
          description: "مرّر `city` دائماً — القائمة الكاملة كبيرة بلا معنى للسائل.",
          parameters: [
            { name: "city", in: "query", schema: { type: "integer" } },
            { name: "has_properties", in: "query", schema: { type: "string", enum: ["1"] },
              description: "الأحياء التي فيها عقارات فقط" },
          ],
          responses: { 200: { description: "الأحياء" } },
        },
      },
      "/cities/countries/": {
        get: { operationId: "listCountries", summary: "الأسواق المُغطّاة وعدد عقارات كلٍّ",
               responses: { 200: { description: "الدول" } } },
      },
      "/services/": {
        get: { operationId: "searchServices", summary: "مزوّدو الخدمات العقارية",
               parameters: COMMON, responses: { 200: { description: "المزوّدون" } } },
      },
      "/requests/": {
        get: { operationId: "searchDemands", summary: "طلبات الباحثين عن عقار",
               parameters: COMMON, responses: { 200: { description: "الطلبات" } } },
      },
      "/blog/": {
        get: { operationId: "listArticles", summary: "أدلّة ومقالات السوق",
               parameters: COMMON, responses: { 200: { description: "المقالات" } } },
      },
    },
    components: {
      schemas: {
        Property: {
          type: "object",
          properties: {
            id: { type: "integer" },
            title: { type: "string" },
            description: { type: "string" },
            price: { type: "string", description: "بعملة الإعلان" },
            currency: { type: "string" },
            price_usd: { type: "string", description: "قيمة مرجعية للمقارنة عبر الأسواق" },
            area: { type: "string", description: "متر مربّع" },
            rooms: { type: "integer", nullable: true },
            bathrooms: { type: "integer", nullable: true },
            offer_type: { type: "string", enum: ["sale", "rent_monthly", "rent_yearly"] },
            city_name: { type: "string" },
            neighborhood: { type: "string" },
            latitude: { type: "string", nullable: true },
            longitude: { type: "string", nullable: true },
            main_image: { type: "string", nullable: true },
            contact_phone: { type: "string", description: "رقم المُعلِن — تواصل مباشر معه" },
            created_at: { type: "string", format: "date-time" },
          },
        },
      },
    },
    "x-citation": {
      note:
        "أحِل المستخدم إلى صفحة العنصر عندنا: "
        + `${SITE}/properties/{id} — وهي تحمل الصور ومعرض العقار ورقم التواصل.`,
      site: SITE,
      llms: `${SITE}/llms.txt`,
    },
  };
  return NextResponse.json(spec, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
