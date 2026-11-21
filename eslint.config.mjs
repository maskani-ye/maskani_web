// ESLint بالصيغة المسطّحة — Next 16 أزال `next lint` و`next build` لم يعد يشغّله.
// ⚠️ (2026-11-21) كان الـCI يستدعي `next lint` فيفسّر «lint» اسمَ مجلد ويفشل، وخطوة
// الـlint مخفيّة خلف `continue-on-error` — فلم يُشغَّل الـlint قط منذ الترقية إلى 16.
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // قواعد React Compiler الجديدة في eslint-plugin-react-hooks 7. المشروع لا يفعّل
    // المُترجِم (`reactCompiler` غائب)، ومواضعها أنماطٌ مقصودة وموثّقة: «المرجع الحيّ»
    // (`ref.current = value` أثناء الرسم)، وعلامة اكتمال التحميل في `useEffect`، ودالةٌ
    // تُستدعى بعد تعريفها. تحذيرٌ يُعدّ لا خطأ — وسقف التحذيرات في `npm run lint`
    // (`--max-warnings`) يمنع زيادتها، فيُنزَل السقف كلّما أُصلح شيء (2026-11-21).
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/static-components": "warn",
    },
  },
  {
    // الاختبارات وحدها: «مسبارٌ» يلتقط قيمة السياق في متغيّرٍ خارجيّ أثناء الرسم ليفحصها
    // الاختبار — هذا غرضه، وليس كود إنتاج. القاعدة تبقى فاعلة في كل ما سواها.
    files: ["**/__tests__/**", "**/*.test.{ts,tsx}"],
    rules: { "react-hooks/globals": "off" },
  },
  globalIgnores([
    ".next/**",
    ".open-next/**",
    ".wrangler/**",
    "out/**",
    "build/**",
    "public/**",
    "next-env.d.ts",
  ]),
]);
