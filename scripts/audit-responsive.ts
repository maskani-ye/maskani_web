/**
 * حارس الاستجابة — يقيس الصفحات الحيّة على ثمانية مقاسات ويفشل عند أي تمرير
 * أفقيّ أو تراكب بطاقات.
 *
 * ⚠️ لماذا حارسٌ حيّ لا تحليلٌ ساكن: الفيض الأفقيّ لا يكشفه المترجم ولا
 * `grep` — يظهر فقط عند رسم الصفحة بعرضٍ معيّن. وقياس 2026-08-24 وجد ثلاثة
 * أعطال حقيقية اثنان منها أقدم من الرئيسية ويصيبان **كل صفحات المنصّة**:
 *   • الشريط العلوي يتحوّل لتخطيط سطح المكتب عند 768 ولا يتّسع → فائض 114px.
 *   • شريحة عنوان مقال بعرض 20rem على شاشة 320 → فائض 32px.
 *   • بطاقة ختامية بصفٍّ أفقيّ لا يتقلّص → فائض 28px تحت 400px.
 *
 * ودرسٌ ثانٍ: `max-w-full` وحده لا يُقلّص عنصر flex — `min-width:auto`
 * الافتراضية تمنعه، فيلزم `min-w-0`. إصلاحٌ ظننتُه صحيحاً رفع الفيض من 32
 * إلى 129 بكسل.
 *
 * التشغيل: npx tsx scripts/audit-responsive.ts [url]
 * يتطلّب Playwright + Chrome. لا يعمل ضمن `prebuild` (يحتاج موقعاً حيّاً)،
 * فشغّله بعد كل نشر يمسّ التخطيط.
 */
import { chromium } from "playwright";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = process.argv[2] || "https://maskani.homes";

/**
 * ⚠️ **الفحص يشمل المنصّة لا صفحةً واحدة.** كان يقيس الرئيسية وحدها، فمرّت
 * أعطال استجابة في الأقسام والتفاصيل بلا أن يراها أحد — والشكوى جاءت من
 * المستخدم لا من الحارس. هذه المسارات تغطّي كل نمط تخطيط عندنا.
 */
const PATHS = process.argv[3]
  ? [process.argv[3]]
  : ["/", "/ye", "/ye/properties", "/ye/services", "/ye/requests", "/ye/jobs",
     "/blog", "/offices", "/location"];

const SIZES: Array<[string, number, number, boolean]> = [
  ["هاتف صغير", 320, 640, true],
  ["هاتف", 390, 844, true],
  ["هاتف كبير", 430, 932, true],
  ["لوحي رأسي", 768, 1024, true],
  ["لوحي أفقي", 1024, 768, false],
  ["لابتوب", 1280, 800, false],
  ["سطح مكتب", 1440, 900, false],
  ["عريض", 1920, 1080, false],
];

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME });
  let failed = false;

  for (const path of PATHS) {
  const URL = BASE + path;
  for (const [name, w, h, mobile] of SIZES) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      locale: "ar",
      isMobile: mobile,
    });
    // مدينة محفوظة: بدونها يحجب المنتقي الإجباري الصفحة فلا يُقاس شيء.
    await ctx.addInitScript(() => {
      localStorage.setItem(
        "maskani_selected_country",
        JSON.stringify({ id: 1, code: "YE", name_ar: "اليمن" }),
      );
      localStorage.setItem(
        "maskani_selected_city",
        JSON.stringify({ id: "5", name: "إب" }),
      );
    });

    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 90000 });
    // تمرير كامل: الأقسام المؤجّلة (الخريطة/الصور) لا تُرسَم قبل ظهورها.
    const H = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < H; y += 600) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(180);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(700);

    const r = await page.evaluate(() => {
      const de = document.documentElement;
      const hScroll = de.scrollWidth - de.clientWidth;
      const cards = [...document.querySelectorAll("article")];
      let overlap = 0;
      for (let i = 0; i < cards.length; i++) {
        for (let j = i + 1; j < cards.length; j++) {
          const a = cards[i].getBoundingClientRect();
          const c = cards[j].getBoundingClientRect();
          if (
            a.width && c.width &&
            a.left < c.right - 2 && c.left < a.right - 2 &&
            a.top < c.bottom - 2 && c.top < a.bottom - 2
          ) overlap++;
        }
      }
      return { hScroll, overlap };
    });

    const ok = r.hScroll <= 0 && r.overlap === 0;
    if (!ok) failed = true;
    console.log(
      `${ok ? "✅" : "❌"} ${name.padEnd(11)} ${String(w).padStart(4)}px  تمرير أفقي=${r.hScroll}  تراكب=${r.overlap}`,
    );
    await ctx.close();
  }

  }
  await browser.close();

  if (failed) {
    console.error("\n✗ الاستجابة مكسورة — تمرير أفقيّ أو تراكب على مقاس واحد أو أكثر.");
    process.exit(1);
  }
  console.log(`\n✅ ${SIZES.length} مقاسات — صفر تمرير أفقيّ وصفر تراكب`);

}

main();
