import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { getErrorMessage, getErrorStatus } from "@/lib/api";

/** خطأ axios بردٍّ كما يرسله الخادم — الشكل الموحّد {message, fields}. */
function axiosError(status: number, data: unknown): AxiosError {
  const headers = new AxiosHeaders();
  return new AxiosError("Request failed", "ERR_BAD_RESPONSE", { headers }, null, {
    status, statusText: "", headers: {}, config: { headers }, data,
  });
}

describe("getErrorStatus", () => {
  it("يُرجع رمز الحالة من خطأ axios، وnull لخطأ الشبكة أو غير axios", () => {
    expect(getErrorStatus(axiosError(403, {}))).toBe(403);
    const network = new AxiosError("Network Error", "ERR_NETWORK");
    expect(getErrorStatus(network)).toBeNull();
    expect(getErrorStatus(new Error("x"))).toBeNull();
    expect(getErrorStatus("نصّ")).toBeNull();
  });
});

describe("getErrorMessage", () => {
  it("يقدّم `message` الخادم على الحقول", () => {
    const e = axiosError(400, { message: "لا يمكنك مراسلة هذا المستخدم.", fields: [{ field: "x", message: "y" }] });
    expect(getErrorMessage(e)).toBe("لا يمكنك مراسلة هذا المستخدم.");
  });

  it("بلا message يجمع أخطاء الحقول — كانت الرسالة null فيظهر «خطأ غير متوقع»", () => {
    const e = axiosError(400, {
      message: null,
      fields: [{ field: "phone", message: "مستخدم من قبل" }, { field: "city", message: "مطلوب" }],
    });
    expect(getErrorMessage(e)).toBe("phone: مستخدم من قبل | city: مطلوب");
  });

  it("يقع على رسالة عامّة لخطأ بلا جسم مفهوم أو لغير axios", () => {
    expect(getErrorMessage(axiosError(500, "<html>"))).toBe("حدث خطأ غير متوقع");
    expect(getErrorMessage(axiosError(400, { message: null, fields: [] }))).toBe("حدث خطأ غير متوقع");
    expect(getErrorMessage(new Error("boom"))).toBe("حدث خطأ غير متوقع");
  });
});
