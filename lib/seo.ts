// أدوات SEO مركزية — بيانات وصفية للأقسام + بيانات منظّمة (JSON-LD) قابلة لإعادة
// الاستخدام. الهدف: تكافؤ مع أكبر المنصّات العقارية في الظهور بنتائج البحث.
import type { Metadata } from "next";

export const SITE_URL = "https://maskani.homes";
export const SITE_NAME = "مسكني";

// ─── بيانات وصفية لكل قسم (تُستهلَك من app/<section>/layout.tsx) ────────────────
type SectionKey = "properties" | "services" | "requests" | "jobs" | "reports";

const SECTIONS: Record<
  SectionKey,
  { title: string; description: string; keywords: string[] }
> = {
  properties: {
    title: "شقق وأراضٍ للبيع والإيجار في اليمن — تواصل مباشر",
    // بلا مبالغة عددية («آلاف العقارات») — الوعد الكاذب يرفع النقرة ثم يرفع
    // الارتداد، وجوجل يقيس الاثنين. الوعد هنا هو ما نملكه فعلاً: رقم المالك.
    description:
      "شقق وفلل وأراضٍ ومحلات في صنعاء وعدن وتعز وإب وكل المحافظات — بالسعر والصور والموقع على الخريطة، ورقم صاحب العقار مباشرةً بلا وسيط ولا عمولة.",
    keywords: [
      "عقارات اليمن", "شقق للبيع", "شقق للإيجار", "فلل للبيع", "أراضي للبيع",
      "محلات تجارية", "عقارات صنعاء", "عقارات عدن", "عقارات تعز", "عقارات",
    ],
  },
  services: {
    title: "مقاولون وسبّاكون وكهربائيون في اليمن — أرقام مباشرة",
    description:
      "تحتاج مقاولاً أو سبّاكاً أو كهربائياً؟ تواصل مباشرةً برقم المزوّد في محافظتك، وشاهد تقييمات من تعاملوا معه ومعرض أعماله قبل أن تتّفق — بلا وسيط وبلا عمولة.",
    keywords: [
      "خدمات عقارية", "مقاول", "سبّاك", "كهربائي", "دهّان", "مصمم ديكور",
      "نقل عفش", "صيانة منازل", "خدمات بناء اليمن",
    ],
  },
  requests: {
    title: "تبحث عن شقة أو أرض؟ انشر طلبك وتصلك العروض",
    description:
      "بدل أن تبحث في مئات الإعلانات، اكتب ما تريده وميزانيتك ومدينتك — وأصحاب العقارات المطابقة هم من يتواصلون معك. مجّاناً وبلا عمولة.",
    keywords: [
      "طلبات عقارية", "مطلوب شقة", "مطلوب أرض", "مطلوب للإيجار",
      "أبحث عن عقار", "طلب عقار اليمن",
    ],
  },
  jobs: {
    title: "اطلب خدمة بناء أو صيانة — قارن العروض واختر",
    description:
      "اكتب ما تحتاجه وميزانيتك، فيصلك عرض من أكثر من مقاول أو فنّي في محافظتك. قارن الأسعار والتقييمات قبل أن تلتزم بأحد.",
    keywords: [
      "طلب خدمة", "طلبات خدمات عقارية", "عروض مقاولين", "طلب صيانة",
      "طلب ديكور", "خدمات اليمن",
    ],
  },
  reports: {
    title: "تحقّق قبل أن تدفع — بلاغات الاحتيال العقاري في اليمن",
    description:
      "قبل أن تُسلّم مبلغاً أو توقّع عقداً، ابحث في بلاغات موثّقة كتبها من وقعوا في عمليات نصب عقاري باليمن — وشارك تجربتك لحماية غيرك.",
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
    properties: "العقارات",
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
        text: "نعم، إنشاء الحساب ونشر العقارات وتصفّح العقارات والتواصل مع أصحابها مجاني بالكامل، ولا توجد أي عمولات أو مدفوعات على المنصّة.",
      },
    },
    {
      "@type": "Question",
      name: "كيف أضيف عقاراً عقارياً؟",
      acceptedAnswer: {
        "@type": "Answer",
        text: "سجّل الدخول عبر حساب Google، ثم اضغط «أضف عقاراً» واملأ تفاصيل العقار (النوع، السعر، المساحة، المدينة) مع الصور وتحديد الموقع على الخريطة — وينشر عقارك مباشرة.",
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

// ─── JSON-LD لمقال المدونة (BlogPosting) — لبطاقات نتائج غنيّة ─────────────────
export function blogPosting(a: {
  title: string; slug: string; excerpt: string; image?: string | null;
  published?: string | null; updated?: string | null; author?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.title,
    description: a.excerpt,
    image: a.image ? [a.image] : [`${SITE_URL}/og.webp`],
    ...(a.published ? { datePublished: a.published } : {}),
    dateModified: a.updated || a.published || undefined,
    author: { "@type": "Organization", name: a.author || SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/og.webp` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${a.slug}` },
  };
}
