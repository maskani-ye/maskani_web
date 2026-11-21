/**
 * حارس: كل وحدة منطق في الويب لها ملفّ اختبار.
 *
 * ⚠️ سببه (2026-11-21): لم يكن للويب اختبار واحد ولا مشغّل. فكُتبت ٢٠٠+ اختبار،
 * وهذا الحارس يمنع أن تولد وحدةٌ جديدة في `lib/` أو `context/` أو الوسيط بلا اختبار.
 *
 * القاعدة: `<dir>/<name>.ts(x)` ← `<dir>/__tests__/<name>.test.ts(x)`
 * (والوسيط في الجذر ← `__tests__/middleware.test.ts`).
 *
 * الاستثناء **مكتوبٌ بسببه** لا صامت: ثوابت بلا منطق، أو أغلفة لواجهات المتصفّح/SDK
 * لا يُختبر فيها إلا المكتبة نفسها. وحدةٌ مستثناة تكتسب منطقاً تخرج من القائمة.
 *
 *     npx tsx scripts/audit-tests.ts
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const EXEMPT: Record<string, string> = {
  "lib/appDownload.ts": "ثوابت روابط التنزيل",
  "lib/endpoints.ts": "خريطة مسارات الـAPI — ثوابت",
  "lib/neighborhoods.ts": "ثابت عتبة واحد",
  "lib/theme.ts": "رموز الألوان — ثوابت",
  "lib/toolsMeta.ts": "بيانات الأدوات الوصفية — ثوابت",
  "lib/firebase.ts": "تهيئة Firebase SDK — غلاف بلا منطق",
  "lib/imageCompression.ts": "غلاف لمكتبة ضغط تعمل على Canvas المتصفّح",
};

const modules = [
  ...["lib", "context"].flatMap((dir) =>
    readdirSync(dir)
      .filter((f) => /\.(ts|tsx)$/.test(f) && !f.endsWith(".d.ts"))
      .map((f) => join(dir, f)),
  ),
  "middleware.ts",
];

const missing: string[] = [];
let tested = 0;
for (const mod of modules) {
  if (EXEMPT[mod]) continue;
  const name = mod.split("/").pop()!.replace(/\.(ts|tsx)$/, "");
  const dir = mod.includes("/") ? mod.slice(0, mod.lastIndexOf("/")) : "";
  const candidates = [".test.ts", ".test.tsx"].map((ext) => join(dir, "__tests__", name + ext));
  if (candidates.some(existsSync)) tested++;
  else missing.push(mod);
}

// استثناءٌ لوحدةٍ حُذفت يُزال — لا قائمة تتراكم.
const stale = Object.keys(EXEMPT).filter((m) => !existsSync(m));

if (missing.length || stale.length) {
  if (missing.length) console.error(`✗ وحدات بلا اختبار (${missing.length}):\n  ${missing.join("\n  ")}`);
  if (stale.length) console.error(`✗ استثناءات لوحدات لم تعد موجودة: ${stale.join(", ")}`);
  process.exit(1);
}
console.log(`✅ كل وحدات المنطق مُختبرة (${tested}) — ومستثنى بسببه ${Object.keys(EXEMPT).length}`);
