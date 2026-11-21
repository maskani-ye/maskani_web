import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CURRENCIES,
  CURRENCY_LABELS,
  CURRENCY_SYMBOLS,
  DEFAULT_CURRENCY,
  PRICE_ON_REQUEST,
  cn,
  formatDate,
  formatNumber,
  formatPrice,
  formatRelativeTime,
  propertyTypeName,
} from "@/lib/utils";

const classes = (s: string) => s.split(/\s+/).filter(Boolean);

describe("cn — مقاسات السُلّم الطباعيّ ليست ألواناً", () => {
  it("text-body لا يبتلع text-white (عطل الزرّ الأسود على أسود)", () => {
    const out = classes(cn("bg-primary text-white px-4", "text-body"));
    expect(out).toContain("text-white");
    expect(out).toContain("text-body");
  });

  it("كل مقاسٍ من السُلّم يتعايش مع لون النصّ", () => {
    for (const size of ["hero", "display", "h1", "h2", "h3", "body-lg", "body", "caption", "micro", "price", "price-sm"]) {
      const out = classes(cn("text-ink", `text-${size}`));
      expect(out, size).toEqual(["text-ink", `text-${size}`]);
    }
  });

  it("مقاسان متتاليان: الأخير يفوز، ولونان: الأخير يفوز", () => {
    expect(cn("text-body", "text-caption")).toBe("text-caption");
    expect(cn("text-white", "text-ink")).toBe("text-ink");
    expect(cn("text-body", "text-sm")).toBe("text-sm");
  });

  it("يتجاهل القيم الشرطية الكاذبة", () => {
    expect(cn("a", false && "b", null, undefined, { c: true, d: false })).toBe("a c");
  });
});

describe("formatNumber", () => {
  it("أرقام عربية-هندية بإقليمٍ مثبّت في الخادم أيضاً (لا عدم تطابق ترطيب)", () => {
    expect(formatNumber(1234)).toBe("١٬٢٣٤");
    expect(formatNumber("1500.5")).toBe("١٬٥٠٠٫٥");
    expect(formatNumber(0)).toBe("٠");
  });

  it("الفارغ وغير الرقميّ نصٌّ فارغ لا NaN", () => {
    for (const v of [null, undefined, "", "abc", Number.NaN]) expect(formatNumber(v)).toBe("");
  });

  it("يمرّر خيارات Intl", () => {
    expect(formatNumber(1.236, { maximumFractionDigits: 1 })).toBe("١٫٢");
  });
});

describe("formatPrice", () => {
  it("غياب السعر أو تعذّر قراءته = «السعر عند التواصل»", () => {
    for (const v of [null, undefined, "", "abc"]) expect(formatPrice(v, "SAR")).toBe(PRICE_ON_REQUEST);
  });

  it("الصفر سعرٌ لا غياب", () => {
    expect(formatPrice(0, "SAR")).not.toBe(PRICE_ON_REQUEST);
    expect(formatPrice(0, "SAR")).toContain("٠");
  });

  it("العملة الفارغة تقع على YER ولا ترمي، وحالة الأحرف لا تهمّ", () => {
    expect(formatPrice(150000)).toBe(formatPrice(150000, "YER"));
    expect(formatPrice(150000, "")).toBe(formatPrice(150000, "YER"));
    expect(formatPrice(150000, "sar")).toBe(formatPrice(150000, "SAR"));
  });

  it("بلا كسور، والسعر النصّي يُقرأ رقماً", () => {
    expect(formatPrice("150000.6", "SAR")).toBe(formatPrice(150001, "SAR"));
    expect(formatPrice(1500, "USD")).toBe("$1,500");
  });

  it("رمز عملةٍ غير صالح لـIntl يسقط إلى رقمٍ ورمز بلا استثناء", () => {
    expect(formatPrice(1, "ABCD")).toMatch(/ABCD$/);
  });
});

describe("formatDate / formatRelativeTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("تاريخ بالعربية: يوم وشهر وسنة", () => {
    expect(formatDate("2026-01-15T12:00:00Z")).toBe("15 يناير 2026");
  });

  it("الزمن النسبيّ بلاحقة عربية", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-21T12:00:00Z"));
    expect(formatRelativeTime("2026-11-21T09:00:00Z")).toMatch(/^منذ .*ساعات/);
  });
});

describe("propertyTypeName", () => {
  it("الكائن المتداخل من الـAPI يُرجع name_ar", () => {
    expect(propertyTypeName({ id: 3, name_ar: "مستودع", icon: "x" })).toBe("مستودع");
  });

  it("المعرّف القديم يُترجم، والمجهول يمرّ كما هو", () => {
    expect(propertyTypeName("apartment")).toBe("شقة");
    expect(propertyTypeName("warehouse")).toBe("warehouse");
  });

  it("لا يُرسم كائنٌ أو رقمٌ أبداً", () => {
    for (const v of [null, undefined, 7, { id: 1 }, []]) expect(propertyTypeName(v)).toBe("—");
  });
});

describe("قائمة العملات", () => {
  it("كل عملة لها رمز واسم، واليمن أوّلاً وهو الافتراضي", () => {
    expect(CURRENCIES[0].value).toBe(DEFAULT_CURRENCY);
    for (const c of CURRENCIES) {
      expect(c.symbol).toBe(CURRENCY_SYMBOLS[c.value]);
      expect(c.label).toBe(CURRENCY_LABELS[c.value]);
    }
    expect(new Set(CURRENCIES.map((c) => c.value)).size).toBe(Object.keys(CURRENCY_LABELS).length);
  });
});
