import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "حمّل تطبيق مسكني",
  description: "انضم لبرنامج الاختبار وحمّل تطبيق مسكني على أندرويد بثلاث خطوات.",
};

// روابط برنامج الاختبار المغلق (مجموعة عامة كمختبرين).
const GROUP_JOIN = "https://groups.google.com/g/maskani-testers";
const OPT_IN = "https://play.google.com/apps/testing/ar.dev.maskani";
const STORE = "https://play.google.com/store/apps/details?id=ar.dev.maskani";

const STEPS = [
  {
    n: "1",
    title: "انضم لمجموعة المختبرين",
    desc: "اضغط «Join group» بحسابك على Google (خطوة لمرّة واحدة).",
    cta: "انضمّ للمجموعة",
    href: GROUP_JOIN,
  },
  {
    n: "2",
    title: "فعّل الوصول للاختبار",
    desc: "افتح صفحة الاختبار واضغط «Become a tester».",
    cta: "تفعيل الاختبار",
    href: OPT_IN,
  },
  {
    n: "3",
    title: "حمّل من Google Play",
    desc: "بعد التفعيل، حمّل مسكني مباشرةً من المتجر.",
    cta: "تحميل من Play",
    href: STORE,
  },
];

export default function DownloadPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-3xl overflow-hidden card-shadow">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="مسكني" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">حمّل تطبيق مسكني</h1>
        <p className="text-gray-500 mt-2">
          التطبيق حالياً في الاختبار المغلق — أكمل الخطوات الثلاث مرّة واحدة لتثبيته.
        </p>
      </div>

      <div className="space-y-4">
        {STEPS.map((s) => (
          <div key={s.n} className="bg-white rounded-2xl card-shadow p-5 flex items-start gap-4">
            <div className="w-9 h-9 shrink-0 rounded-full bg-primary text-white font-bold flex items-center justify-center">
              {s.n}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900">{s.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 rounded-xl bg-primary/10 text-primary font-semibold text-sm px-4 py-2 hover:bg-primary/15"
              >
                {s.cta} ↗
              </a>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-400 mt-8">
        تأكّد من استخدام نفس حساب Google في الخطوات الثلاث. نسخة iOS قريباً.
      </p>
    </div>
  );
}
