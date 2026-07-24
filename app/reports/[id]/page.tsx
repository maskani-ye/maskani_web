"use client";

import { useState, useEffect, useCallback, type ComponentType } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  formatRelativeTime, fraudTypeLabels, reportStatusColors, reportStatusLabels,
} from "@/lib/utils";
import type { FraudReport, FraudComment } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ShieldWarning, Like, Dislike, ChatRound, User, Phone, MapPoint,
  AltArrowRight, DangerTriangle, Link as LinkIcon,
} from "@solar-icons/react";
import { toast } from "sonner";

const asIcon = (I: ComponentType<{ className?: string }>) => I;

export default function FraudReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [report, setReport] = useState<FraudReport | null>(null);
  const [comments, setComments] = useState<FraudComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [activeImage, setActiveImage] = useState(0);

  const loadReport = useCallback(() => {
    return api.get<FraudReport>(`/reports/${id}/`).then((r) => setReport(r.data));
  }, [id]);

  useEffect(() => {
    loadReport()
      .catch(() => toast.error("لم يتم العثور على البلاغ"))
      .finally(() => setLoading(false));
    api.get(`/reports/${id}/comments/`)
      .then((r) => setComments(r.data.results ?? r.data ?? []))
      .catch(() => {});
  }, [id, loadReport]);

  // isCredible=true → مصداقي، false → غير مصداقي، null → سحب التصويت
  const handleVote = async (isCredible: boolean | null) => {
    if (!user) { router.push("/auth/login"); return; }
    try {
      if (isCredible === null) {
        await api.delete(`/reports/${id}/vote/`);
        toast.success("تم سحب تصويتك");
      } else {
        await api.post(`/reports/${id}/vote/`, { is_credible: isCredible });
        toast.success("تم تسجيل تصويتك");
      }
      await loadReport();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const addComment = async () => {
    if (!user) { router.push("/auth/login"); return; }
    if (!comment.trim()) return;
    try {
      const { data } = await api.post(`/reports/${id}/comments/`, { text: comment });
      setComments((p) => [...p, data]);
      setComment("");
      toast.success("تم إضافة التعليق");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-56 w-full rounded-2xl" />
    </div>
  );

  if (!report) return (
    <div className="text-center py-20">
      <p className="text-gray-500 text-lg">البلاغ غير موجود</p>
      <Link href="/reports"><Button className="mt-4">العودة للشكاوي</Button></Link>
    </div>
  );

  const images = report.images ?? [];
  const myVote = report.my_vote; // true | false | null

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/reports" className="hover:text-primary">مجتمع الشكاوي</Link>
        <AltArrowRight className="h-3.5 w-3.5" />
        <span className="text-gray-700 font-medium line-clamp-1">{report.title}</span>
      </div>

      {/* Warning banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <DangerTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          هذا بلاغ تحذيري من المجتمع. تحقّق دائماً بنفسك قبل اتخاذ أي قرار.
        </p>
      </div>

      <div className="bg-white rounded-2xl card-shadow p-6">
        {/* Status + type */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge
            variant={report.status === "verified" ? "danger" : report.status === "pending" ? "warning" : "gray"}
          >
            {reportStatusLabels[report.status]}
          </Badge>
          <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
            {fraudTypeLabels[report.fraud_type]}
          </span>
          {report.city_name && <span className="text-xs text-gray-400 flex items-center gap-1"><MapPoint className="h-3.5 w-3.5" />{report.city_name}</span>}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">{report.title}</h1>

        {/* Accused */}
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
          <p className="text-sm font-semibold text-red-700 mb-1">المُبلَّغ عنه</p>
          <p className="text-gray-800 font-bold">{report.accused_name}</p>
          {report.accused_phone && (
            <a href={`tel:${report.accused_phone}`} className="flex items-center gap-1 text-sm text-gray-600 mt-1" dir="ltr">
              <Phone className="h-3.5 w-3.5" /> {report.accused_phone}
            </a>
          )}
          {report.accused_profile_link && (
            <a href={report.accused_profile_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary mt-1 hover:underline break-all">
              <LinkIcon className="h-3.5 w-3.5 flex-shrink-0" /> {report.accused_profile_link}
            </a>
          )}
        </div>

        {/* Details */}
        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line mb-4">{report.details}</p>

        {/* Images */}
        {images.length > 0 && (
          <div className="mb-4">
            <div className="rounded-2xl overflow-hidden bg-gray-100 mb-2">
              <img src={images[activeImage]?.image} alt="" className="w-full max-h-96 object-contain" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button key={img.id} onClick={() => setActiveImage(i)} className={`flex-shrink-0 w-16 h-14 rounded-xl overflow-hidden border-2 ${i === activeImage ? "border-primary" : "border-transparent"}`}>
                    <img src={img.image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
          <span>بلاغ من {report.reporter_name}</span>
          <span>•</span>
          <span>{formatRelativeTime(report.created_at)}</span>
          <span className="mr-auto font-bold text-gray-600">النقاط: {report.credibility_score > 0 ? "+" : ""}{report.credibility_score}</span>
        </div>

        {/* Voting */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => handleVote(myVote === true ? null : true)}
            className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl border transition-colors ${
              myVote === true ? "bg-green-600 text-white border-green-600" : "text-green-600 border-green-200 hover:bg-green-50"
            }`}
          >
            <Like className="h-4 w-4" /> مصداقي ({report.votes_credible})
          </button>
          <button
            onClick={() => handleVote(myVote === false ? null : false)}
            className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl border transition-colors ${
              myVote === false ? "bg-red-500 text-white border-red-500" : "text-red-500 border-red-200 hover:bg-red-50"
            }`}
          >
            <Dislike className="h-4 w-4" /> غير مصداقي ({report.votes_not_credible})
          </button>
        </div>
      </div>

      {/* Comments */}
      <div className="bg-white rounded-2xl card-shadow p-6 mt-6">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-1.5">
          <ChatRound className="h-5 w-5 text-primary" /> التعليقات ({comments.length})
        </h2>

        {user ? (
          <div className="flex gap-3 mb-5">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="أضف تعليقاً أو معلومة..."
              className="flex-1 h-10 border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <Button size="sm" onClick={addComment}>نشر</Button>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-gray-500">سجّل الدخول للتعليق</p>
            <Link href="/auth/login"><Button size="sm" variant="outline">تسجيل الدخول</Button></Link>
          </div>
        )}

        {comments.length === 0 ? (
          <EmptyState icon={asIcon(ChatRound)} title="لا توجد تعليقات بعد" />
        ) : (
          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {c.user_avatar ? <img src={c.user_avatar} className="w-full h-full object-cover" alt="" /> : <User className="h-4 w-4 text-primary" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-800">{c.user_name}</span>
                    <span className="text-xs text-gray-400">{formatRelativeTime(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-600">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
