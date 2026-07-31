import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سياسة الخصوصية — مسكني",
  description:
    "سياسة خصوصية تطبيق ومنصّة مسكني: البيانات التي نجمعها، وكيف نستخدمها، وحقوقك.",
};

// يُعاد التوليد كل ساعة حتى تنعكس تعديلات لوحة الإدارة على المحتوى.
export const revalidate = 3600;

const API =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://api.maskani.homes/api/v1";

type LegalDoc = { slug: string; title: string; body: string; updated_at: string };

async function getPrivacy(): Promise<LegalDoc | null> {
  try {
    const res = await fetch(`${API}/legal/privacy/`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as LegalDoc;
  } catch {
    return null;
  }
}

export default async function PrivacyPolicyPage() {
  const doc = await getPrivacy();

  return (
    <main dir="rtl" className="min-h-screen bg-cream px-5 py-12">
      <article className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm sm:p-10">
        <h1 className="mb-1 text-3xl font-extrabold text-primary">
          {doc?.title || "سياسة الخصوصية"}
        </h1>
        {doc?.updated_at && (
          <p className="mb-8 text-sm text-[#1A1A1A]/60">
            آخر تحديث: {new Date(doc.updated_at).toLocaleDateString("ar")}
          </p>
        )}

        {doc ? (
          <div
            className="legal-body space-y-3 leading-relaxed text-[#1A1A1A]/90"
            dangerouslySetInnerHTML={{ __html: doc.body }}
          />
        ) : (
          <p className="text-[#1A1A1A]/70">
            تعذّر تحميل سياسة الخصوصية حالياً. يُرجى المحاولة لاحقاً.
          </p>
        )}

        <p className="mt-10 border-t border-black/10 pt-6 text-sm text-[#1A1A1A]/60">
          © {new Date().getFullYear()} مسكني — جميع الحقوق محفوظة.
        </p>
      </article>

      {/* تنسيق محتوى الـHTML القادم من الباك اند */}
      <style>{`
        .legal-body h2 { color: #2D6A4F; font-weight: 700; font-size: 1.25rem; margin: 1.5rem 0 0.5rem; }
        .legal-body ul { list-style: disc; padding-inline-start: 1.25rem; }
        .legal-body li { margin: 0.25rem 0; }
        .legal-body a { color: #2D6A4F; text-decoration: underline; font-weight: 600; }
        .legal-body strong { font-weight: 700; }
      `}</style>
    </main>
  );
}
