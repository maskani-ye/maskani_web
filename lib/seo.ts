// أدوات SEO مركزية — بيانات وصفية للأقسام + بيانات منظّمة (JSON-LD) قابلة لإعادة
// الاستخدام. الهدف: تكافؤ مع أكبر المنصّات العقارية في الظهور بنتائج البحث.
import type { Metadata } from "next";

export const SITE_URL = "https://maskani.homes";
export const SITE_NAME = "مسكني";

// ─── بيانات وصفية لكل قسم (تُستهلَك من app/<section>/layout.tsx) ────────────────
type SectionKey = "listings" | "services" | "requests" | "jobs" | "reports";

const SECTIONS: Record<
  SectionKey,
  { title: string; description: string; keywords: string[] }
> = {
  listings: {
    title: "إعلانات عقارية في اليمن — بيع وإيجار شقق وفلل وأراضٍ",
    description:
      "تصفّح آلاف الإعلانات العقارية في اليمن: شقق وفلل وأراضٍ ومحلات للبيع والإيجار، مع فلترة بالمدينة والنوع والسعر والمساحة، وعرضها على الخريطة.",
    keywords: [
      "عقارات اليمن", "شقق للبيع", "شقق للإيجار", "فلل للبيع", "أراضي للبيع",
      "محلات تجارية", "عقارات صنعاء", "عقارات عدن", "عقارات تعز", "إعلانات عقارية",
    ],
  },
  services: {
    title: "خدمات عقارية — مقاولون وسبّاكون وكهربائيون ومصمّمون",
    description:
      "دليل مزوّدي الخدمات العقارية في اليمن: مقاولون، سبّاكون، كهربائيون، دهّانون، مصمّمو ديكور، ونقل عفش — مع تقييمات ومعرض أعمال وتواصل مباشر.",
    keywords: [
      "خدمات عقارية", "مقاول", "سبّاك", "كهربائي", "دهّان", "مصمم ديكور",
      "نقل عفش", "صيانة منازل", "خدمات بناء اليمن",
    ],
  },
  requests: {
    title: "طلبات عقارية — اعرض طلبك ليصلك أصحاب العقارات",
    description:
      "انشر طلبك العقاري (شراء أو استئجار) وحدّد ميزانيتك ومدينتك، ودع أصحاب العقارات يتواصلون معك بعروض مناسبة — بلا عمولات.",
    keywords: [
      "طلبات عقارية", "مطلوب شقة", "مطلوب أرض", "مطلوب للإيجار",
      "أبحث عن عقار", "طلب عقار اليمن",
    ],
  },
  jobs: {
    title: "طلبات خدمات — اطلب خدمة عقارية ويصلك المزوّدون",
    description:
      "اطلب أي خدمة عقارية (بناء، صيانة، ديكور، نقل) وحدّد ميزانيتك، ودع المزوّدين المؤهّلين يرسلون لك عروضهم مباشرة.",
    keywords: [
      "طلب خدمة", "طلبات خدمات عقارية", "عروض مقاولين", "طلب صيانة",
      "طلب ديكور", "خدمات اليمن",
    ],
  },
  reports: {
    title: "بلاغات الاحتيال العقاري — مجتمع لحماية المشترين",
    description:
      "قاعدة بلاغات مجتمعية عن الاحتيال العقاري في اليمن: تحقّق من النصّابين قبل التعامل، صوّت على مصداقية البلاغات، وأبلغ لحماية الآخرين.",
    keywords: [
      "احتيال عقاري", "نصب عقاري", "بلاغات احتيال", "تحذير عقاري",
      "نصّابون عقارات", "حماية المشترين",
    ],
  },
};

/// يبني كائن Metadata كامل لصفحة قسم (عنوان/وصف/كلمات/كانونيكال/Open Graph/تويتر).
export function sectionMetadata(key: SectionKey): Metadata {
  const s = SECTIONS[key];
  const url = `${SITE_URL}/${key}`;
  return {
    title: s.title,
    description: s.description,
    keywords: s.keywords,
    alternates: { canonical: `/${key}` },
    openGraph: {
      title: s.title,
      description: s.description,
      url,
      siteName: SITE_NAME,
      locale: "ar_AR",
      type: "website",
      images: [{ url: "/og.webp", width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: s.title,
      description: s.description,
      images: ["/og.webp"],
    },
  };
}

/// معرّف مدينة صديق لمحركات البحث من الاسم الإنجليزي (Sana'a → sanaa، Al Hudaydah → al-hudaydah).
export function citySlug(nameEn: string): string {
  return (nameEn || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function sectionLabel(key: SectionKey): string {
  return {
    listings: "الإعلانات",
    services: "الخدمات",
    requests: "الطلبات العقارية",
    jobs: "طلبات الخدمات",
    reports: "بلاغات الاحتيال",
  }[key];
}

// ─── بيانات منظّمة (JSON-LD) ───────────────────────────────────────────────────

/// مسار تنقّل (breadcrumbs) — يظهر كسلسلة مسار في نتائج بحث Google.
export function breadcrumbList(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}

/// قائمة عناصر (ItemList) لصفحة تجميعية — يساعد Google على فهم صفحات القوائم.
export function itemList(
  name: string,
  urls: string[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: urls.length,
    itemListElement: urls.map((u, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: u.startsWith("http") ? u : `${SITE_URL}${u}`,
    })),
  };
}

/// أسئلة شائعة (FAQPage) — يظهر كنتائج منسدلة (rich snippet) أسفل رابط الموقع.
export const homeFaq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "ما هي منصّة مسكني؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: "مسكني منصّة عقارية اجتماعية في اليمن تربط صاحب العقار بالعميل مباشرةً — بيع وإيجار للشقق والفلل والأراضي، وخدمات عقارية، وطلبات، ومجتمع لمكافحة الاحتيال العقاري. بلا عمولات.",
      },
    },
    {
      "@type": "Question",
      name: "هل استخدام مسكني مجاني؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: "نعم، إنشاء الحساب ونشر الإعلانات وتصفّح العقارات والتواصل مع أصحابها مجاني بالكامل، ولا توجد أي عمولات أو مدفوعات على المنصّة.",
      },
    },
    {
      "@type": "Question",
      name: "كيف أضيف إعلاناً عقارياً؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: "سجّل الدخول عبر حساب Google، ثم اضغط «أضف إعلاناً» واملأ تفاصيل العقار (النوع، السعر، المساحة، المدينة) مع الصور وتحديد الموقع على الخريطة — وينشر إعلانك مباشرة.",
      },
    },
    {
      "@type": "Question",
      name: "كيف أحمي نفسي من الاحتيال العقاري؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: "تصفّح قسم «بلاغات الاحتيال» للتحقّق من أي طرف قبل التعامل معه، وأبلغ عن أي محاولة نصب لتحذير بقية المستخدمين. يعتمد المجتمع نظام تصويت لتحديد مصداقية كل بلاغ.",
      },
    },
    {
      "@type": "Question",
      name: "في أي المدن تتوفّر عقارات على مسكني؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: "تغطّي مسكني مدن اليمن الرئيسية مثل صنعاء وعدن وتعز والحديدة وإب والمكلا وغيرها، مع إمكانية الفلترة حسب المدينة لعرض العقارات القريبة منك.",
      },
    },
  ],
};
