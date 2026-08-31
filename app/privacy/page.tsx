import { LegalPage } from "@/components/legal/LegalPage";
import { NUMERIC_LOCALE } from "@/lib/utils";
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
    <LegalPage
      title={doc?.title || "سياسة الخصوصية"}
      updatedAt={doc?.updated_at ? new Date(doc.updated_at).toLocaleDateString(NUMERIC_LOCALE) : undefined}
    >

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
    </LegalPage>
  );
}
