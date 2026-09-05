import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * صورة المشاركة — تُولَّد من الكود لا من ملفٍّ مرسوم.
 *
 * ⚠️ **الصورة الثابتة انفصلت عن العلامة مرّتين ولم يُلاحَظ.** `public/og.webp`
 * رُسمت في أغسطس فبقيت بالبنفسجيّ القديم بعد توحيد اللون، **وبقيت تقول «المنصّة
 * العقارية الاجتماعية في اليمن»** بعد أن صارت المنصّة ستّة أسواق. وهي أوّل ما
 * يراه من تصله رابطٌ في واتساب أو تويتر — أكثر سطحٍ ظهوراً وأقلّه مراجعةً،
 * لأنّها **صورة**: لا `grep` يقرأ نصّها ولا حارس يقيس لونها.
 *
 * توليدها من الكود يربطها بالثيم: يتغيّر اللون في مكانٍ واحد فتتبعه.
 */
export const alt = "مسكني — منصّة عقارية في ستّة أسواق عربية";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#050536";
const PRIMARY = "#171539";
const GOLD = "#FFC107";

/**
 * سطرٌ عربيّ في `satori`.
 *
 * ⚠️ **`satori` لا يطبّق ثنائية الاتّجاه** — لا `dir="rtl"` ولا
 * `direction: rtl` يغيّران شيئاً: الكلمات تُصفّ يساراً‑يميناً دائماً، فتُقرأ
 * الجملة مقلوبة («عربية أسواق ستّة في عقارية منصّة»). ولن يُلاحَظ في مراجعة
 * كود — الجملة سليمة في المصدر ومقلوبة في الصورة وحدها.
 *
 * فالكلمات تُرصف صراحةً بـ`row-reverse` بدل قلب النصّ في المصدر: النصّ يبقى
 * مقروءاً لمن يحرّره، والصفّ هو من ينعكس.
 */
function Rtl({ text, style }: { text: string; style: React.CSSProperties }) {
  return (
    <div style={{ display: "flex", flexDirection: "row-reverse", gap: 10, ...style }}>
      {text.split(" ").map((w, i) => <span key={i}>{w}</span>)}
    </div>
  );
}

export default async function Image() {
  const dir = join(process.cwd(), "app", "og-fonts");
  const [bold, regular] = await Promise.all([
    readFile(join(dir, "Plex-Bold.ttf")),
    readFile(join(dir, "Plex-Regular.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: `linear-gradient(135deg, ${PRIMARY} 0%, ${INK} 100%)`,
          fontFamily: "Plex", position: "relative", direction: "rtl",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, background: GOLD }} />
        {/* رمز المنزل — نفس رسم أيقونة التطبيق، مسارٌ لا صورة فلا ينفصل */}
        <div style={{
          width: 132, height: 132, borderRadius: 999, background: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 34,
        }}>
          <svg width="74" height="74" viewBox="0 0 24 24" fill="none"
               stroke={PRIMARY} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.5 9.5 12 3l8.5 6.5V19a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V9.5Z" />
            <path d="M9.5 17h5" />
          </svg>
        </div>
        <div style={{ fontSize: 92, fontWeight: 700, color: "#fff", letterSpacing: "-2px" }}>مسكني</div>
        <Rtl text="منصّة عقارية في ستّة أسواق عربية"
             style={{ fontSize: 38, color: "rgba(255,255,255,0.88)", marginTop: 10 }} />
        <Rtl text="بيع · إيجار · خدمات · طلبات"
             style={{ fontSize: 30, color: GOLD, marginTop: 26 }} />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Plex", data: bold, weight: 700, style: "normal" },
        { name: "Plex", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
