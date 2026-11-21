import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type FetchRetry = typeof import("@/lib/fetchRetry").fetchRetry;

let fetchRetry: FetchRetry;
const fetchMock = vi.fn();

const res = (status: number) => new Response(null, { status });

/** وعدٌ يُحسَم يدوياً — لقياس التزامن والطلبات معلّقة. */
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

beforeEach(async () => {
  vi.useFakeTimers();
  vi.resetModules(); // عدّاد التزامن وطابوره حالةٌ على مستوى الوحدة
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("INTERNAL_API_TOKEN", "");
  vi.spyOn(AbortSignal, "timeout").mockImplementation(() => new AbortController().signal);
  vi.spyOn(console, "warn").mockImplementation(() => {});
  ({ fetchRetry } = await import("@/lib/fetchRetry"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("fetchRetry — إعادة المحاولة", () => {
  it("النجاح من أوّل مرّة بلا انتظار", async () => {
    fetchMock.mockResolvedValueOnce(res(200));
    const r = await fetchRetry("https://api/x");
    expect(r?.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("429 يُعاد بعد 1.5 ثانية لا قبلها", async () => {
    fetchMock.mockResolvedValueOnce(res(429)).mockResolvedValueOnce(res(200));
    const p = fetchRetry("https://api/x");
    await vi.advanceTimersByTimeAsync(1499);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect((await p)?.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("التراجع يتضاعف: 1.5 ثم 3 ثم 6 ثوانٍ", async () => {
    fetchMock
      .mockResolvedValueOnce(res(503))
      .mockResolvedValueOnce(res(502))
      .mockResolvedValueOnce(res(500))
      .mockResolvedValueOnce(res(200));
    const p = fetchRetry("https://api/x");
    const calls: number[] = [];
    for (const step of [1500, 3000, 6000]) {
      await vi.advanceTimersByTimeAsync(step - 1);
      calls.push(fetchMock.mock.calls.length);
      await vi.advanceTimersByTimeAsync(1);
    }
    expect(calls).toEqual([1, 2, 3]);
    expect((await p)?.status).toBe(200);
  });

  it("بعد استنفاد المحاولات يُرجع آخر ردّ خطأ (لا null) ليراه الحارس", async () => {
    fetchMock.mockResolvedValue(res(500));
    const p = fetchRetry("https://api/x", undefined, 3);
    await vi.advanceTimersByTimeAsync(60_000);
    expect((await p)?.status).toBe(500);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("404 و400 جوابٌ نهائيّ بلا إعادة", async () => {
    for (const status of [404, 400, 401]) {
      fetchMock.mockReset();
      fetchMock.mockResolvedValueOnce(res(status));
      expect((await fetchRetry("https://api/x"))?.status).toBe(status);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
  });

  it("خطأ الشبكة يُعاد، والسبب يُطبع مرّة واحدة، والاستنفاد = null", async () => {
    fetchMock.mockRejectedValue(Object.assign(new TypeError("fetch failed"), { cause: "ECONNRESET" }));
    const p = fetchRetry("https://api/x");
    await vi.advanceTimersByTimeAsync(60_000);
    expect(await p).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(vi.mocked(console.warn).mock.calls[0][0]).toContain("ECONNRESET");
  });

  it("كل محاولة بمهلة 20 ثانية، وانتهاء المهلة فشلٌ قابلٌ للإعادة", async () => {
    fetchMock
      .mockRejectedValueOnce(new DOMException("timed out", "TimeoutError"))
      .mockResolvedValueOnce(res(200));
    const p = fetchRetry("https://api/x");
    await vi.advanceTimersByTimeAsync(1500);
    expect((await p)?.status).toBe(200);
    expect(AbortSignal.timeout).toHaveBeenCalledWith(20_000);
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });
});

describe("fetchRetry — التوقيع الداخليّ", () => {
  it("يضيف X-Maskani-Internal مع إبقاء الترويسات والخيارات الأخرى", async () => {
    vi.stubEnv("INTERNAL_API_TOKEN", "s3cret");
    fetchMock.mockResolvedValueOnce(res(200));
    await fetchRetry("https://api/x", { headers: { Accept: "application/json" }, next: { revalidate: 3600 } });
    const init = fetchMock.mock.calls[0][1];
    expect(init.headers).toEqual({ Accept: "application/json", "X-Maskani-Internal": "s3cret" });
    expect(init.next).toEqual({ revalidate: 3600 });
  });

  it("بلا مفتاح لا تُضاف الترويسة", async () => {
    fetchMock.mockResolvedValueOnce(res(200));
    await fetchRetry("https://api/x", { headers: { Accept: "x" } });
    expect(fetchMock.mock.calls[0][1].headers).toEqual({ Accept: "x" });
  });
});

describe("fetchRetry — سقف التزامن", () => {
  it("ستّة طلبات معاً على الأكثر، والسابع ينتظر خانةً تفرغ", async () => {
    const pending = Array.from({ length: 10 }, () => deferred<Response>());
    pending.forEach((d) => fetchMock.mockImplementationOnce(() => d.promise));
    const all = pending.map((_, i) => fetchRetry(`https://api/${i}`));
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(6);

    pending[0].resolve(res(200));
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(7);

    pending.forEach((d) => d.resolve(res(200)));
    await vi.advanceTimersByTimeAsync(0);
    const out = await Promise.all(all);
    expect(fetchMock).toHaveBeenCalledTimes(10);
    expect(out.every((r) => r?.status === 200)).toBe(true);
  });

  it("ردّ 429 لا يخترق السقف: ستّة طلبات جارية على الأكثر طوال التراجع والإعادة", async () => {
    // كان فرع ٤٢٩ يحرّر الخانة ثم يزيد العدّاد يدوياً — قيست ذروة ٧ بتسعة مستدعين.
    let active = 0;
    let peak = 0;
    const track = (p: Promise<Response>) => {
      active++;
      peak = Math.max(peak, active);
      return p.finally(() => active--);
    };
    const pending = Array.from({ length: 9 }, () => deferred<Response>());
    fetchMock.mockImplementationOnce(() => track(Promise.resolve(res(429))));
    pending.forEach((d) => fetchMock.mockImplementationOnce(() => track(d.promise)));

    const all = pending.map((_, i) => fetchRetry(`https://api/p${i}`));
    await vi.advanceTimersByTimeAsync(0);
    expect(peak).toBeLessThanOrEqual(6);

    await vi.advanceTimersByTimeAsync(1500);           // انتهاء تراجع الطلب الأوّل
    pending.forEach((d) => d.resolve(res(200)));
    await vi.advanceTimersByTimeAsync(0);
    const out = await Promise.all(all);
    expect(peak).toBeLessThanOrEqual(6);
    expect(out.every((r) => r?.status === 200)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(10);       // تسعة + إعادة الأوّل
  });

  it("الفشل لا يُسرّب خانة: بعد أخطاء شبكة تبقى ستّة خانات عاملة", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    const failed = Array.from({ length: 6 }, (_, i) => fetchRetry(`https://api/f${i}`, undefined, 1));
    await vi.advanceTimersByTimeAsync(0);
    expect(await Promise.all(failed)).toEqual([null, null, null, null, null, null]);

    fetchMock.mockReset();
    const pending = Array.from({ length: 7 }, () => deferred<Response>());
    pending.forEach((d) => fetchMock.mockImplementationOnce(() => d.promise));
    const next = pending.map((_, i) => fetchRetry(`https://api/n${i}`));
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(6);
    pending.forEach((d) => d.resolve(res(200)));
    await vi.advanceTimersByTimeAsync(0);
    await Promise.all(next);
  });
});
