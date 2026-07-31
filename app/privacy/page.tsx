import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سياسة الخصوصية — مسكني",
  description:
    "سياسة خصوصية تطبيق ومنصّة مسكني: البيانات التي نجمعها، وكيف نستخدمها، وحقوقك.",
};

const UPDATED = "31 يوليو 2026";
const CONTACT = "business.zinon@gmail.com";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xl font-bold text-primary">{title}</h2>
      <div className="space-y-2 leading-relaxed text-[#1A1A1A]/90">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-cream px-5 py-12">
      <article className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm sm:p-10">
        <h1 className="mb-1 text-3xl font-extrabold text-primary">سياسة الخصوصية</h1>
        <p className="mb-8 text-sm text-[#1A1A1A]/60">آخر تحديث: {UPDATED}</p>

        <p className="mb-8 leading-relaxed text-[#1A1A1A]/90">
          تحترم منصّة <strong>مسكني</strong> خصوصيتك. توضّح هذه السياسة أنواع البيانات التي
          نجمعها عند استخدامك تطبيق مسكني والموقع، وكيف نستخدمها ونحميها. مسكني منصّة عقارية
          اجتماعية تربط أصحاب العقارات بالعملاء ومزوّدي الخدمات — <strong>بدون أي مدفوعات</strong>.
        </p>

        <Section title="١) البيانات التي نجمعها">
          <ul className="list-disc space-y-1 pr-5">
            <li>
              <strong>بيانات الحساب (عبر تسجيل الدخول بـ Google حصراً):</strong> الاسم، البريد
              الإلكتروني، والصورة الشخصية المرتبطة بحساب Google.
            </li>
            <li>
              <strong>بيانات الملف الشخصي:</strong> رقم الهاتف، المدينة، نبذة تعريفية، وصورة
              يختار المستخدم إضافتها.
            </li>
            <li>
              <strong>المحتوى الذي تنشره:</strong> الإعلانات، الخدمات، الطلبات، الشكاوى، التعليقات،
              التقييمات، والصور المرفوعة معها.
            </li>
            <li>
              <strong>الموقع الجغرافي:</strong> إحداثيات العقار عند إضافته على الخريطة (بإذنك).
            </li>
            <li>
              <strong>الوسائط:</strong> الصور والرسائل الصوتية التي ترسلها داخل المحادثات.
            </li>
            <li>
              <strong>رمز الإشعارات (FCM):</strong> معرّف الجهاز لإرسال إشعارات Firebase.
            </li>
            <li>
              <strong>بيانات تقنية:</strong> نوع الجهاز ونظام التشغيل لأغراض التشغيل والأمان.
            </li>
          </ul>
        </Section>

        <Section title="٢) كيف نستخدم بياناتك">
          <ul className="list-disc space-y-1 pr-5">
            <li>إنشاء حسابك وتمكينك من نشر الإعلانات والخدمات والطلبات.</li>
            <li>عرض إعلاناتك وملفك العام لبقية المستخدمين (طبيعة المنصّة الاجتماعية).</li>
            <li>تمكين المراسلة المباشرة والتقييمات والمتابعة بين المستخدمين.</li>
            <li>إرسال إشعارات ذات صلة (عروض، رسائل، تفاعلات) — ويمكنك كتمها لكل فئة.</li>
            <li>عرض العقارات على الخريطة وتحسين تجربة البحث والفلترة.</li>
          </ul>
        </Section>

        <Section title="٣) مشاركة البيانات">
          <p>
            <strong>لا نبيع بياناتك الشخصية.</strong> بعض بياناتك (الاسم، الصورة، المدينة،
            الإعلانات، رقم التواصل الذي تدرجه في إعلانك) تظهر علناً للمستخدمين الآخرين لأن مسكني
            منصّة اجتماعية. نستعين بمزوّدي خدمات موثوقين لتشغيل التطبيق فقط:
          </p>
          <ul className="list-disc space-y-1 pr-5">
            <li><strong>Google</strong> — تسجيل الدخول والخرائط.</li>
            <li><strong>Firebase (Google)</strong> — إرسال الإشعارات.</li>
            <li><strong>Cloudflare R2</strong> — تخزين الصور والوسائط.</li>
            <li>خوادم الاستضافة الخاصة بنا لتشغيل الخدمة.</li>
          </ul>
        </Section>

        <Section title="٤) الاحتفاظ بالبيانات وحذفها">
          <p>
            نحتفظ ببياناتك ما دام حسابك نشطاً. يمكنك تعديل أو حذف إعلاناتك ومحتواك في أي وقت،
            كما يمكنك طلب <strong>حذف حسابك وبياناتك</strong> بالكامل عبر مراسلتنا على البريد أدناه،
            وسنستجيب خلال مدة معقولة.
          </p>
        </Section>

        <Section title="٥) حقوقك">
          <p>
            لك الحق في الوصول إلى بياناتك وتصحيحها أو حذفها، وسحب إذن الموقع أو الإشعارات من
            إعدادات جهازك في أي وقت.
          </p>
        </Section>

        <Section title="٦) أمان البيانات">
          <p>
            نستخدم المصادقة عبر Google وتوكنات آمنة ونقل مُشفّر (HTTPS) لحماية بياناتك. لا توجد
            بوابة دفع في مسكني، ولا نجمع أي بيانات بطاقات بنكية.
          </p>
        </Section>

        <Section title="٧) خصوصية الأطفال">
          <p>
            مسكني غير موجّه للأطفال دون السن القانونية، ولا نجمع بياناتهم عن قصد.
          </p>
        </Section>

        <Section title="٨) التواصل معنا">
          <p>
            لأي استفسار حول الخصوصية أو لطلب حذف بياناتك، راسلنا على:{" "}
            <a href={`mailto:${CONTACT}`} className="font-semibold text-primary underline">
              {CONTACT}
            </a>
          </p>
        </Section>

        <p className="mt-10 border-t border-black/10 pt-6 text-sm text-[#1A1A1A]/60">
          © {new Date().getFullYear()} مسكني — جميع الحقوق محفوظة.
        </p>
      </article>
    </main>
  );
}
