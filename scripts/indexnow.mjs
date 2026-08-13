// إخطار محرّكات البحث بالصفحات الجديدة فور النشر (بروتوكول IndexNow).
// يدعمه Bing وYandex وSeznam — جوجل لا يدعمه، لكنّ فهرسة بينغ السريعة تُنتج
// إشارات (زيارات وروابط) تنفع الاكتشاف عمومًا، والتكلفة صفر.
// جوجل ألغى نقطة ping لخرائط المواقع سنة 2023، فلا بديل آليّاً عنده.
const KEY = "649ffdbdce4e27e3f931bf67d94f4cf4";
const HOST = "maskani.homes";

const res = await fetch(`https://${HOST}/sitemap.xml`);
const xml = await res.text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).slice(0, 10000);
if (!urls.length) {
  console.error("خريطة الموقع فارغة — أُلغي الإخطار");
  process.exit(0);
}

const body = { host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls };
const r = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(body),
});
console.log(`IndexNow: ${r.status} — أُرسل ${urls.length} رابطًا`);
