"use client";

import { useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { Button } from "@/components/ui/Button";
import { CheckCircle, ClockCircle } from "@solar-icons/react";
import { toast } from "sonner";

/** «هل ما زال متاحًا؟» — يظهر لصاحب العقار حين يقترب انتهاء العرض.
 *
 *  يغلق حلقة الطزاجة من طرفيها: العقار المباع لا يبقى منشورًا شهرين، والعقار
 *  الحيّ لا ينطفئ صامتًا. القرار بضغطة واحدة — لا شاشة تحرير كاملة. */
export function AvailabilityPrompt({
  propertyId,
  expiresAt,
  onDone,
}: {
  propertyId: number;
  expiresAt?: string | null;
  onDone?: () => void;
}) {
  const [busy, setBusy] = useState<"confirm" | "sold" | null>(null);
  const [done, setDone] = useState(false);

  if (done || !expiresAt) return null;

  const daysLeft = Math.ceil(
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  // لا نزعج المالك إلا في آخر أسبوع — قبل ذلك لا قيمة للسؤال.
  if (daysLeft > 7) return null;

  const confirm = async () => {
    setBusy("confirm");
    try {
      await api.post(endpoints.confirmPropertyAvailability(propertyId));
      toast.success("شكرًا — تم تأكيد توفّر العقار");
      setDone(true);
      onDone?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const markSold = async () => {
    setBusy("sold");
    try {
      await api.patch(endpoints.propertyStatus(propertyId), { status: "sold_rented" });
      toast.success("تم تعليم العقار كمباع / مؤجَّر");
      setDone(true);
      onDone?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-gold/10 border border-gold/30 rounded-2xl p-4 mb-4">
      <p className="flex items-center gap-2 font-bold text-ink text-body">
        <ClockCircle className="h-4 w-4 text-gold" />
        هل ما زال هذا العقار متاحًا؟
      </p>
      <p className="text-caption text-muted-600 mt-1 mb-3">
        {daysLeft > 0
          ? `ينتهي عرضه خلال ${daysLeft} يوم. أكّد توفّره ليبقى ظاهرًا للباحثين.`
          : "انتهى عرضه. أكّد توفّره ليعود للظهور."}
      </p>
      <div className="flex gap-2">
        <Button onClick={confirm} loading={busy === "confirm"} disabled={busy !== null}>
          <CheckCircle className="h-4 w-4" /> نعم، ما زال متاحًا
        </Button>
        <Button variant="outline" onClick={markSold} loading={busy === "sold"} disabled={busy !== null}>
          تم البيع / التأجير
        </Button>
      </div>
    </div>
  );
}
