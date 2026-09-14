/**
 * حارس: لا صفحة مُخبوزة كـ404 في الإخراج.
 *
 * ⚠️ **بُني الموقع مرّةً و٥١٩ من ٨٥٩ صفحة حيّ فيه ٤٠٤ — ولم يُنبّه شيء.**
 * سبب ذلك أنّ البناء تجاوز سقف طلبات الواجهة (٣٠٠/دقيقة) فردّت ٤٢٩، ففسّرت
 * الصفحة الردّ «غير موجود» واستدعت `notFound()`، فحُفظ ٤٠٤ في الإخراج نفسه.
 * نجح `npm run build` وطبع «✓»، وكان سيُنشر موقعٌ ينقصه ستّون بالمئة من
 * أعمق طبقات فهرسته. الفشل الصامت لا يُكتشف بالنظر — يُقاس.
 *
 * يقرأ ملفّات `.meta` في `.next/server/app` ويفشل إن وجد فيها `status: 404`.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = ".next/server/app";

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith(".meta")) out.push(p);
  }
  return out;
}

const metas = walk(ROOT);
if (metas.length === 0) {
  console.log("… لا إخراج مُولَّداً مسبقاً — تخطٍّ (بناء لم يقع بعد).");
  process.exit(0);
}

// صفحة `_not-found` نفسها ٤٠٤ بطبيعتها — هي الصفحة التي تُعرض لكل رابطٍ مفقود.
const baked404 = metas.filter((m) => {
  if (m.endsWith("/_not-found.meta")) return false;
  try {
    return JSON.parse(readFileSync(m, "utf8")).status === 404;
  } catch {
    return false;
  }
});

if (baked404.length > 0) {
  console.error(`✗ صفحات مُخبوزة كـ404: ${baked404.length} من ${metas.length}`);
  for (const f of baked404.slice(0, 10)) {
    console.error(`   ${f.replace(ROOT + "/", "")}`);
  }
  if (baked404.length > 10) console.error(`   … و${baked404.length - 10} غيرها`);
  console.error(
    "   السبب الأرجح: خنق الواجهة (429) أثناء البناء فُسِّر «غير موجود».",
  );
  console.error("   الصفحة يجب أن ترفع الخطأ لا أن تستدعي notFound() عليه.");
  process.exit(1);
}

console.log(`✓ لا صفحة مُخبوزة كـ404 (${metas.length} صفحة مفحوصة)`);
