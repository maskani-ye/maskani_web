import { describe, expect, it } from "vitest";
import { getServiceIcon, ICON_KEYS } from "@/lib/serviceIcons";

describe("getServiceIcon", () => {
  it("يطبّع مفتاح الإدارة: مسافات وشرطات سفلية وحالة أحرف", () => {
    const sofa = getServiceIcon("sofa");
    expect(getServiceIcon("  Living Room ")).toBe(sofa);
    expect(getServiceIcon("LIVING_ROOM")).toBe(sofa);
    expect(getServiceIcon("living-room")).toBe(sofa);
  });

  it("المرادفات تؤدّي إلى الأيقونة نفسها", () => {
    expect(getServiceIcon("bathroom")).toBe(getServiceIcon("wc"));
    expect(getServiceIcon("budget")).toBe(getServiceIcon("wallet"));
  });

  it("الغائب والمجهول يقعان على الأيقونة الافتراضية لا على undefined", () => {
    const fallback = getServiceIcon(null);
    expect(fallback).toBeTruthy();
    expect(getServiceIcon(undefined)).toBe(fallback);
    expect(getServiceIcon("")).toBe(fallback);
    expect(getServiceIcon("مفتاح-لا-يوجد")).toBe(fallback);
  });

  it("كل مفتاح تعرضه لوحة الإدارة له أيقونة غير الافتراضية", () => {
    const fallback = getServiceIcon(null);
    // «widget» هو الأيقونة الافتراضية نفسها (DEFAULT_ICON = Widget) فمساواته لها مقصودة.
    const missing = ICON_KEYS.filter((k) => getServiceIcon(k) === fallback && k !== "widget");
    expect(missing).toEqual([]);
  });
});
