import { describe, expect, it } from "vitest";
import { jsonLdHtml } from "@/lib/jsonLd";

// فاصلا السطر يُبنيان برقمهما — كتابتهما حرفياً داخل تعبيرٍ نمطي تكسره.
const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);

describe("jsonLdHtml", () => {
  it("لا يُخرج ما يُغلق وسم script ويبقى JSON مطابقاً", () => {
    const evil = { name: "</script><script>alert(1)</script>", note: `a & b <!-- ${LS} ${PS}` };
    const out = jsonLdHtml(evil);
    for (const bad of ["<", ">", "&", LS, PS]) expect(out).not.toContain(bad);
    expect(JSON.parse(out)).toEqual(evil);
  });
});
