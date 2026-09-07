/**
 * قابلية الفهرسة — يفحص ما نرسله إلى جوجل بأنفسنا.
 *
 * ⚠️ **خريطة الموقع عهدٌ لا قائمة.** كل رابطٍ فيها يقول لجوجل «افهرس هذا»،
 * فإن ردّ تحويلاً أو `noindex` أو خطأ خادم أو أشار بـ`canonical` إلى غيره،
 * فنحن من أهدر ميزانية الزحف ثمّ اشتكى من عدم الفهرسة. الأسباب الخمسة التي
 * أبلغت عنها Search Console كلّها من هذا الصنف: **تناقضٌ بين ما نرسله وما
 * نخدمه**، لا عطلٌ عند جوجل.
 *
 *   node scripts/audit-indexability.mjs [عدد العيّنة لكل نمط=6]
 */
const BASE = process.env.AUDIT_BASE || "https://maskani.homes";
const PER = Number(process.argv[2] || 6);

const xml = await (await fetch(`${BASE}/sitemap.xml`)).text();
// ⚠️ **الخريطة تحمل عناوين الإنتاج دائماً** (`SITE_URL` مثبَّت فيها). فقياسٌ
// على بناءٍ محلّي كان يفحص الإنتاج ويعلن أنّ إصلاحي لم ينجح — والإصلاح ناجح
// والمقياس هو من نظر إلى المكان الخطأ. نُحوّل كل رابطٍ إلى القاعدة المفحوصة.
const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => new URL(new URL(m[1]).pathname, BASE).href);
console.log(`روابط الخريطة: ${locs.length}`);

// نمطُ المسار — نفحص عيّنةً من كل نمط بدل آلاف الروابط المتشابهة
const shape = (u) => {
  const p = new URL(u).pathname;
  const seg = p.split("/").filter(Boolean);
  return "/" + seg.map((s, i) => (i === 0 ? s : "*")).join("/");
};
const groups = new Map();
for (const u of locs) {
  const k = shape(u);
  if (!groups.has(k)) groups.set(k, []);
  if (groups.get(k).length < PER) groups.get(k).push(u);
}
const sample = [...groups.values()].flat();
console.log(`أنماط: ${groups.size} · عيّنة مفحوصة: ${sample.length}\n`);

const robots = await (await fetch(`${BASE}/robots.txt`)).text();
const disallow = robots.split("\n")
  .filter((l) => /^disallow:/i.test(l.trim()))
  .map((l) => l.split(":")[1]?.trim()).filter(Boolean);

const blocked = (u) => {
  const p = new URL(u).pathname;
  return disallow.some((d) => d !== "/" && p.startsWith(d));
};

const problems = { redirect: [], noindex: [], canonical: [], server: [], robots: [] };

for (const u of sample) {
  if (blocked(u)) { problems.robots.push(`${u}  ← محظور في robots.txt`); continue; }
  let res;
  try {
    res = await fetch(u, { redirect: "manual" });
  } catch (e) {
    problems.server.push(`${u}  ← تعذّر: ${String(e).slice(0, 40)}`);
    continue;
  }
  if (res.status >= 300 && res.status < 400) {
    problems.redirect.push(`${u}  → ${res.status} ${res.headers.get("location")}`);
    continue;
  }
  if (res.status >= 500) { problems.server.push(`${u}  ← ${res.status}`); continue; }
  if (res.status >= 400) { problems.server.push(`${u}  ← ${res.status}`); continue; }
  const html = await res.text();
  if (/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html)) {
    problems.noindex.push(`${u}  ← noindex`);
    continue;
  }
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  if (m) {
    // ⚠️ **المقارنة بالمسار لا بالمضيف.** القانونيّة تحمل مضيف الإنتاج دائماً،
    // فالفحص على بناءٍ محلّي يراها «مختلفة» ويبلّغ عن تسعةٍ وستّين عطلاً وهمياً.
    // ما يهمّ: هل تشير الصفحة إلى **نفسها** أم إلى صفحةٍ أخرى؟
    const canon = new URL(m[1], u).pathname.replace(/\/$/, "") || "/";
    const self = new URL(u).pathname.replace(/\/$/, "") || "/";
    if (canon !== self) {
      problems.canonical.push(`${u}\n        canonical → ${canon}`);
    }
  }
}

const LABEL = {
  redirect: "صفحة تتضمّن إعادة توجيه",
  noindex: 'مستثناة بعلامة "noindex"',
  canonical: "نسخة طبق الأصل — القانونيّة تشير إلى غيرها",
  server: "خطأ خادم أو 4xx",
  robots: "محظورة بـrobots.txt",
};
let total = 0;
for (const [k, list] of Object.entries(problems)) {
  if (!list.length) continue;
  total += list.length;
  console.log(`✗ ${LABEL[k]} — ${list.length}`);
  list.slice(0, 8).forEach((x) => console.log(`     ${x}`));
  console.log();
}
console.log(total ? `❌ ${total} رابطاً في الخريطة لا يُفهرَس كما هو`
                  : "✅ كل رابطٍ في العيّنة قابلٌ للفهرسة");
