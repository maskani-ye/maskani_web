// اختبارات الويب (Vitest) — كان المشروع بلا اختبار واحد ولا مشغّل (2026-11-21).
// البيئة الافتراضية node (منطق lib والوسيط)؛ ملفّ يحتاج DOM يعلن في أوّله:
//   // @vitest-environment jsdom
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", ".open-next/**"],
    restoreMocks: true,
  },
});
