import { describe, expect, it } from "vitest";
import { waHref, waMessage } from "@/lib/whatsapp";

describe("waMessage", () => {
  it("يحمل العنوان والسعر والمكان والرقم والرابط بهذا الترتيب", () => {
    const text = waMessage({
      kind: "العقار المعروض",
      title: "شقة ثلاث غرف",
      price: "٣٣٬٠٠٠ ج.م",
      place: "القاهرة — المعادي",
      ref: 42,
      url: "https://maskani.homes/eg/properties/42",
    });
    expect(text.split("\n")).toEqual([
      "السلام عليكم، أتواصل معك بخصوص العقار المعروض على مسكني:",
      "▪️ شقة ثلاث غرف",
      "٣٣٬٠٠٠ ج.م · القاهرة — المعادي",
      "رقم الإعلان: #42",
      "",
      "https://maskani.homes/eg/properties/42",
    ]);
  });

  it("الحقول الغائبة تُحذف بلا «غير محدّد» ولا null", () => {
    const text = waMessage({ title: null, price: null, place: "", ref: null, url: undefined });
    expect(text).toBe("السلام عليكم، أتواصل معك بخصوص الإعلان المعروض على مسكني:");
    expect(text).not.toMatch(/null|undefined|غير محدّد/);
  });

  it("السعر وحده أو المكان وحده بلا فاصل معلّق", () => {
    expect(waMessage({ place: "عدن" }).split("\n")[1]).toBe("عدن");
    expect(waMessage({ price: "100 $" }).split("\n")[1]).toBe("100 $");
  });

  it("الرسالة الطويلة تُبتر عند 900 حرف بعلامة حذف، وما دونها كامل", () => {
    const long = waMessage({ title: "س".repeat(2000) });
    expect(long).toHaveLength(900);
    expect(long.endsWith("…")).toBe(true);
    const short = waMessage({ title: "قصير" });
    expect(short.endsWith("…")).toBe(false);
  });
});

describe("waHref", () => {
  it("يُبقي أرقام الهاتف وحدها ويرمّز الرسالة كاملةً", () => {
    const ctx = { title: "أرض & فيلا؟", url: "https://maskani.homes/ye/properties/1?a=b" };
    const href = waHref("+967 777-123-456", ctx)!;
    const u = new URL(href);
    expect(u.origin + u.pathname).toBe("https://wa.me/967777123456");
    expect(u.searchParams.get("text")).toBe(waMessage(ctx));
  });

  it("لا زرّ لرقمٍ أقصر من ثمانية أرقام أو غائب", () => {
    expect(waHref("1234567", {})).toBeNull();
    expect(waHref("+-() ", {})).toBeNull();
    expect(waHref(null, {})).toBeNull();
    expect(waHref(undefined, {})).toBeNull();
    expect(waHref("12345678", {})).not.toBeNull();
  });
});
