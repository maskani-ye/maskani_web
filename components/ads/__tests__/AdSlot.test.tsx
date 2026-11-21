// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({ pathname: "/" as string | null }));
vi.mock("next/navigation", () => ({ usePathname: () => h.pathname }));

import { AdSlot } from "@/components/ads/AdSlot";
import { AD_CLIENT } from "@/lib/ads";

const SLOT = "1234567890";

beforeEach(() => {
  h.pathname = "/";
  delete window.adsbygoogle;
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("AdSlot — متى لا يُعرض شيء", () => {
  it("لا وحدة ولا دفع إلى adsbygoogle حين hasContent=false (شاشة فارغة أو قيد التحميل)", () => {
    const { container } = render(<AdSlot slot={SLOT} hasContent={false} />);
    expect(container.innerHTML).toBe("");
    expect(window.adsbygoogle).toBeUndefined();
  });

  it("لا وحدة بلا معرّف شريحة (متغيّر البيئة فارغ)", () => {
    for (const slot of [undefined, ""]) {
      const { container } = render(<AdSlot slot={slot} />);
      expect(container.innerHTML).toBe("");
      cleanup();
    }
    expect(window.adsbygoogle).toBeUndefined();
  });

  it("لا وحدة على المسارات خارج قائمة السماح ولو بمحتوى", () => {
    for (const path of ["/ye", "/ye/properties", "/properties/12", "/blogger", "/toolsx", "/admin", null]) {
      h.pathname = path;
      const { container } = render(<AdSlot slot={SLOT} />);
      expect(container.querySelector("ins"), String(path)).toBeNull();
      cleanup();
    }
  });

  it("لا وحدة حين تُطفأ الإعلانات صراحةً من البيئة", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADS_ENABLED", "false");
    vi.resetModules();
    const { AdSlot: Fresh } = await import("@/components/ads/AdSlot");
    const { container } = render(<Fresh slot={SLOT} />);
    expect(container.innerHTML).toBe("");
    expect(window.adsbygoogle).toBeUndefined();
  });
});

describe("AdSlot — مسار مؤهَّل بمحتوى", () => {
  it("يعرض <ins class=adsbygoogle> بمعرّف الناشر والشريحة ويدفع طلباً واحداً", () => {
    for (const path of ["/", "/tools", "/tools/mortgage", "/blog/some-article"]) {
      h.pathname = path;
      delete window.adsbygoogle;
      const { container } = render(<AdSlot slot={SLOT} />);
      const ins = container.querySelector("ins.adsbygoogle");
      expect(ins, path).not.toBeNull();
      expect(ins!.getAttribute("data-ad-client")).toBe(AD_CLIENT);
      expect(ins!.getAttribute("data-ad-slot")).toBe(SLOT);
      expect(ins!.getAttribute("data-ad-format")).toBe("auto");
      expect(ins!.hasAttribute("data-ad-layout")).toBe(false);
      expect(window.adsbygoogle).toEqual([{}]);
      cleanup();
    }
  });

  it("يُظهر كلمة «إعلان» افتراضياً ويخفيها بـlabel=false، ويمرّر layout والصيغة", () => {
    const { container, rerender } = render(<AdSlot slot={SLOT} />);
    expect(container.textContent).toContain("إعلان");

    rerender(<AdSlot slot={SLOT} label={false} layout="in-article" format="fluid" />);
    expect(container.textContent).not.toContain("إعلان");
    const ins = container.querySelector("ins.adsbygoogle")!;
    expect(ins.getAttribute("data-ad-layout")).toBe("in-article");
    expect(ins.getAttribute("data-ad-format")).toBe("fluid");
  });

  it("إعادة التصيير لا تكرّر الدفع، ووصول المحتوى بعد التحميل يدفع مرّة واحدة", () => {
    const { container, rerender } = render(<AdSlot slot={SLOT} hasContent={false} />);
    expect(container.querySelector("ins")).toBeNull();
    expect(window.adsbygoogle).toBeUndefined();

    rerender(<AdSlot slot={SLOT} hasContent />);
    expect(container.querySelector("ins.adsbygoogle")).not.toBeNull();
    rerender(<AdSlot slot={SLOT} hasContent className="x" />);
    expect(window.adsbygoogle).toEqual([{}]);
  });

  it("حاجب إعلانات يرمي عند الدفع لا يُسقط الصفحة", () => {
    window.adsbygoogle = {
      push: () => {
        throw new Error("blocked");
      },
    } as unknown as unknown[];
    const { container } = render(<AdSlot slot={SLOT} />);
    expect(container.querySelector("ins.adsbygoogle")).not.toBeNull();
  });
});
