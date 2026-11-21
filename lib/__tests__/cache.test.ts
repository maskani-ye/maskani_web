import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiCache, withCache } from "@/lib/cache";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-21T10:00:00Z"));
  apiCache.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("apiCache", () => {
  it("المفتاح الغائب null والمخزَّن يُقرأ", () => {
    expect(apiCache.get("x")).toBeNull();
    apiCache.set("x", { a: 1 }, 1000);
    expect(apiCache.get("x")).toEqual({ a: 1 });
  });

  it("يبقى صالحاً حتى لحظة انتهائه بالضبط ثم يزول", () => {
    apiCache.set("k", "v", 1000);
    vi.advanceTimersByTime(1000);
    expect(apiCache.get("k")).toBe("v");
    vi.advanceTimersByTime(1);
    expect(apiCache.get("k")).toBeNull();
  });

  it("invalidate يحذف بالبادئة وحدها", () => {
    apiCache.set("admin_users?offset=0", 1, 1000);
    apiCache.set("admin_users?offset=20", 2, 1000);
    apiCache.set("admin_stats", 3, 1000);
    apiCache.invalidate("admin_users");
    expect(apiCache.get("admin_users?offset=0")).toBeNull();
    expect(apiCache.get("admin_users?offset=20")).toBeNull();
    expect(apiCache.get("admin_stats")).toBe(3);
  });
});

describe("withCache", () => {
  it("يجلب مرّة واحدة خلال العمر ثم يعيد الجلب بعد انتهائه", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce("first").mockResolvedValueOnce("second");
    expect(await withCache("s", 60_000, fetcher)).toBe("first");
    expect(await withCache("s", 60_000, fetcher)).toBe("first");
    expect(fetcher).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(60_001);
    expect(await withCache("s", 60_000, fetcher)).toBe("second");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("القيم الكاذبة (0 · '' · false) تُخزَّن ولا يُعاد جلبها", async () => {
    for (const [key, value] of [["zero", 0], ["empty", ""], ["no", false]] as const) {
      const fetcher = vi.fn().mockResolvedValue(value);
      await withCache(key, 1000, fetcher);
      expect(await withCache(key, 1000, fetcher)).toBe(value);
      expect(fetcher).toHaveBeenCalledTimes(1);
    }
  });

  it("الفشل لا يُخزَّن — المحاولة التالية تجلب من جديد", async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new Error("503")).mockResolvedValueOnce("ok");
    await expect(withCache("f", 1000, fetcher)).rejects.toThrow("503");
    expect(await withCache("f", 1000, fetcher)).toBe("ok");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
