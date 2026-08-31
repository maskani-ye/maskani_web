"use client";

/**
 * بدء محادثة مع طرفٍ آخر — منطقٌ واحد لكل الشاشات.
 *
 * ⚠️ **كان منسوخاً في خمسة ملفّات**: تفاصيل العقار، الخدمة، طلب العقار، طلب
 * الخدمة، وملفّ المستخدم. خمس نسخ لنفس النداء ونفس التعامل مع الخطأ ونفس
 * التوجيه — ومعنى ذلك أن تغيير مسار الشات أو شكل جسمه يحتاج خمسة تعديلات.
 *
 * ⚠️ **والحارس هنا ليس تجميلاً**: بلا `requireAuth` يقع النداء بلا توكن فيردّ
 * 401 ويُخرج المستخدم — لذلك يقع الفحص **قبل** الطلب لا بعده، وهو ما يجعل هذا
 * المنطق يستحقّ مكاناً واحداً يُراجَع فيه.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { useAuthGate } from "@/context/AuthGate";

export function useStartConversation() {
  const router = useRouter();
  const { requireAuth } = useAuthGate();
  const [starting, setStarting] = useState(false);

  /**
   * @param recipientId معرّف الطرف الآخر — بلا قيمة لا يُرسل شيء (العنصر لم
   *        يُحمَّل بعد)، فالحماية هنا لا في كل مستدعٍ.
   */
  const start = async (recipientId?: number | null, extra?: Record<string, unknown>) => {
    if (!requireAuth()) return;
    if (!recipientId) return;
    setStarting(true);
    try {
      const { data } = await api.post("/chat/conversations/", {
        recipient_id: recipientId,
        ...extra,
      });
      router.push(`/chat/${data.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setStarting(false);
    }
  };

  return { start, starting };
}

export default useStartConversation;
