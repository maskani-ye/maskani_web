"use client";

import { useState, useEffect } from "react";
import { NUMERIC_LOCALE } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { Bell, UsersGroupRounded, Shield, Settings } from "@solar-icons/react";

// ─── Constants ────────────────────────────────────────────────────────────────

const TARGETS: { value: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "all",                label: "كل المستخدمين",  icon: UsersGroupRounded },
  { value: "admins",             label: "المشرفون",       icon: Shield },
  { value: "service_providers",  label: "مزودو الخدمة",   icon: Settings },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminBroadcastPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [title, setTitle]   = useState("");
  const [body, setBody]     = useState("");
  const [target, setTarget] = useState("all");
  const [sending, setSending] = useState(false);

  // ── auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) router.push("/");
  }, [user, authLoading, router]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) { toast.error("العنوان والمحتوى مطلوبان"); return; }
    setSending(true);
    try {
      const res = await api.post<{ message: string; count: number }>(
        ep.admin.broadcast, { title, body, target }
      );
      toast.success(`تم إرسال التعميم إلى ${res.data.count.toLocaleString(NUMERIC_LOCALE)} مستخدم`);
      setTitle("");
      setBody("");
      setTarget("all");
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSending(false); }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <PageHeader icon={<Bell />} title="تعميم جماعي"
          subtitle="إرسال إشعار لكل المستخدمين أو لشريحة محددة" />
      </div>

      <Card className="space-y-5">
        <Input
          label="عنوان الإشعار"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="مثال: تحديث جديد في المنصة"
          required
        />

        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-body font-semibold text-muted-700">
            محتوى الإشعار <span className="text-danger-500 mr-1">*</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="اكتب نص الإشعار هنا..."
            rows={4}
            className="w-full border border-muted-200 rounded-xl px-4 py-3 text-body text-ink placeholder-muted transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
          />
        </div>

        {/* Target segment */}
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-body font-semibold text-muted-700">الفئة المستهدفة</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {TARGETS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTarget(value)}
                className={`flex items-center gap-2 h-11 px-3 rounded-xl border text-body font-semibold transition-colors ${
                  target === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted-200 text-muted-600 hover:bg-muted-50"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSend} loading={sending} disabled={!title.trim() || !body.trim()}>
            <Bell className="h-4 w-4" /> إرسال التعميم
          </Button>
        </div>
      </Card>

      <p className="text-caption text-muted text-center mt-4">
        يُرسَل الإشعار داخل التطبيق وعبر إشعارات الدفع (FCM) للأجهزة المسجّلة.
      </p>
    </div>
  );
}
