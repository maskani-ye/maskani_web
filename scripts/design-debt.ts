/**
 * ترتيب الدَّين التصميميّ بالملفّ — أين يقع لا كم يبلغ.
 *
 * ⚠️ `audit-design-system` يعطي **مجموعاً** فيقول «١٬٠٠٤ مقاساً خارج السُلَّم»
 * ولا يقول أين. والمجموع لا يُصلَح، الملفّات تُصلَح. هذا يرتّبها.
 *
 * ⚠️ **والعدّ لا يرى «مشوّهاً»**: بطاقات الخدمة والطلبات كانت ٠ من ١٠ ولا
 * تخالف الحارس في شيء — تخطيطها كان الخلل لا مقاساتها. فهذا الترتيب يختار
 * **ما يُنظَر إليه** لا ما يُصلَح آلياً.
 */
import { readFileSync, globSync } from "node:fs";

const SIGNALS: Array<[string, RegExp, number]> = [
  ["مقاس خارج السُلَّم", /\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl)\b/g, 1],
  ["رماديّ Tailwind", /\btext-gray-(400|500|600|700|800|900)\b/g, 1],
  ["خلفية رمادية", /\bbg-gray-(50|100|200|300)\b/g, 1],
  ["حدّ رماديّ", /\bborder-gray-(100|200|300)\b/g, 1],
  ["ظلّ قديم (shadow-card)", /\bshadow-card(-hover)?\b/g, 2],
  ["رقم سحريّ", /\[\d+px\]/g, 1],
];

const rows = globSync("{app,components}/**/*.tsx")
  .map((f) => {
    const src = readFileSync(f, "utf8");
    const hits = SIGNALS.map(([name, re, w]) => {
      const n = (src.match(re) ?? []).length;
      return { name, n, score: n * w };
    }).filter((h) => h.n > 0);
    const score = hits.reduce((a, h) => a + h.score, 0);
    // الكثافة أهمّ من العدد الخام: ملفٌّ من 80 سطراً فيه 20 مخالفة أسوأ من
    // ملفٍّ من 900 سطر فيه 30.
    const lines = src.split("\n").length;
    return { f, score, lines, density: +(score / lines * 100).toFixed(1), hits };
  })
  .filter((r) => r.score > 0)
  .sort((a, b) => b.score - a.score);

const top = Number(process.argv[2] ?? 20);
console.log(`ملفّات فيها دَين: ${rows.length} · مجموع النقاط: ${rows.reduce((a, r) => a + r.score, 0)}\n`);
console.log("النقاط  الكثافة  الملفّ");
for (const r of rows.slice(0, top)) {
  console.log(
    `${String(r.score).padStart(6)}  ${String(r.density).padStart(6)}%  ${r.f}\n` +
    `                 ${r.hits.map((h) => `${h.name}×${h.n}`).join(" · ")}`,
  );
}
