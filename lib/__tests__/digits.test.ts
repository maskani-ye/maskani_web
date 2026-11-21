import { describe, expect, it, vi } from "vitest";
import { toEnglishDigits, withEnglishDigits } from "@/lib/digits";

describe("toEnglishDigits", () => {
  it("يحوّل الأرقام العربية-الهندية فيقرأها parseFloat", () => {
    expect(toEnglishDigits("٥٠٠٠")).toBe("5000");
    expect(parseFloat(toEnglishDigits("٥٠٠٠"))).toBe(5000);
    expect(toEnglishDigits("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789");
  });

  it("يحوّل الأرقام الفارسية ويقبل الخليط", () => {
    expect(toEnglishDigits("۰۱۲۳۴۵۶۷۸۹")).toBe("0123456789");
    expect(toEnglishDigits("١٢3۴")).toBe("1234");
  });

  it("الفاصلة العشرية العربية والفاصلة العربية تصيران نقطة", () => {
    expect(toEnglishDigits("٣٫٥")).toBe("3.5");
    expect(toEnglishDigits("٣،٥")).toBe("3.5");
    expect(parseFloat(toEnglishDigits("١٢٠٫٧٥"))).toBe(120.75);
  });

  it("لا يمسّ النصّ غير الرقميّ ويُعيد الفارغ كما هو", () => {
    expect(toEnglishDigits("شقة 3 غرف")).toBe("شقة 3 غرف");
    expect(toEnglishDigits("")).toBe("");
  });
});

describe("withEnglishDigits", () => {
  it("يمرّر القيمة إلى المعالج بعد التحويل", () => {
    const handler = vi.fn();
    withEnglishDigits(handler)({ target: { value: "٧٧٧" } });
    expect(handler).toHaveBeenCalledWith("777");
  });
});
