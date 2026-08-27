"use client";

import { useState, useEffect, useCallback } from "react";
import { NUMERIC_LOCALE } from "@/lib/utils";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Stars, AddCircle, TrashBinMinimalistic, Pen, Refresh, ChartSquare, CheckCircle, ServerSquare, Play, Gift, DangerTriangle } from "@solar-icons/react";
import { toast } from "sonner";

interface AIKey {
  id: number; name: string; provider: string; masked_key: string; base_url: string;
  default_model: string; is_active: boolean; last_used_at: string | null;
  last_error: string; last_error_at: string | null;
}
interface Provider {
  id: number; name: string; slug: string; base_url: string; default_model: string;
  simple_model: string; sensitive_model: string;
  is_active: boolean; order: number; keys_count: number;
}
interface RemoteUsage {
  ok: boolean; error?: string;
  key?: { label?: string; usage?: number; limit?: number | null; limit_remaining?: number | null; is_free_tier?: boolean };
  credits?: { total_credits?: number; total_usage?: number; remaining?: number | null };
}
interface TestResult {
  ok: boolean; provider?: string; model?: string; reply?: string;
  error?: string; error_type?: string; elapsed_ms?: number;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}
interface CatalogEntry {
  slug: string; name: string; base_url: string; default_model: string;
  free_quota: string; keys_url: string; openai_compatible: boolean;
  registered: boolean; has_key: boolean;
}
interface LocalStats { total_requests: number; success: number; error: number; total_tokens: number; last_24h: number; by_task: { task_name: string; n: number; tokens: number }[] }
interface Tiers { simple_model: string; sensitive_model: string; tasks: { name: string; description: string; sensitive: boolean; tier: string; model: string }[] }

const emptyKey = { name: "", provider: "openrouter", api_key: "", default_model: "" };
const emptyProv = { name: "", slug: "", base_url: "", default_model: "", simple_model: "", sensitive_model: "", is_active: true };

const money = (v: number | null | undefined) => (typeof v === "number" ? `$${v.toFixed(4)}` : "—");
const fmt = (n: number) => n.toLocaleString(NUMERIC_LOCALE);

export default function AdminAIPage() {
  const [keys, setKeys] = useState<AIKey[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [local, setLocal] = useState<LocalStats | null>(null);
  const [tiers, setTiers] = useState<Tiers | null>(null);
  const [loading, setLoading] = useState(true);
  const [localLoading, setLocalLoading] = useState(false);

  // محرّر المفتاح
  const [editing, setEditing] = useState<AIKey | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyKey });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AIKey | null>(null);
  const [busy, setBusy] = useState(false);
  // إحصائيات مفتاح مفرد
  const [statsKey, setStatsKey] = useState<AIKey | null>(null);
  const [statsData, setStatsData] = useState<RemoteUsage | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  // محرّر المزوّد
  const [provEditing, setProvEditing] = useState<Provider | null>(null);
  const [provOpen, setProvOpen] = useState(false);
  const [provForm, setProvForm] = useState({ ...emptyProv });
  const [provSaving, setProvSaving] = useState(false);
  const [provDelete, setProvDelete] = useState<Provider | null>(null);

  // اختبار النموذج النشط
  const [testPrompt, setTestPrompt] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  // كتالوج المزوّدين المجّانيين
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [k, p, c] = await Promise.all([
        api.get<AIKey[]>(ep.admin.aiKeys),
        api.get<Provider[]>(ep.admin.aiProviders),
        api.get<CatalogEntry[]>(ep.admin.aiProvidersCatalog),
      ]);
      setKeys(Array.isArray(k.data) ? k.data : []);
      setProviders(Array.isArray(p.data) ? p.data : []);
      setCatalog(Array.isArray(c.data) ? c.data : []);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);

  const fetchLocal = useCallback(async () => {
    setLocalLoading(true);
    try {
      const res = await api.get<{ local: LocalStats; tiers: Tiers }>(ep.admin.aiUsage);
      setLocal(res.data.local);
      setTiers(res.data.tiers);
    } catch { /* إضافي */ }
    finally { setLocalLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); fetchLocal(); }, [fetchAll, fetchLocal]);

  const activeKey = keys.find((k) => k.is_active) || null;
  const provName = (slug: string) => providers.find((p) => p.slug === slug)?.name || slug;

  // ── مفاتيح ──
  const openStats = useCallback(async (key: AIKey) => {
    setStatsKey(key); setStatsData(null); setStatsLoading(true);
    try {
      const res = await api.get<RemoteUsage>(ep.admin.aiKeyUsage(key.id));
      setStatsData(res.data);
    } catch (err) { setStatsData({ ok: false, error: getErrorMessage(err) }); }
    finally { setStatsLoading(false); }
  }, []);

  const openNew = () => { setEditing(null); setForm({ ...emptyKey, provider: providers[0]?.slug || "openrouter" }); setOpen(true); };
  const openEdit = (k: AIKey) => { setEditing(k); setForm({ name: k.name, provider: k.provider, api_key: "", default_model: k.default_model }); setOpen(true); };
  const setF = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) { toast.error("الاسم مطلوب"); return; }
    if (!editing && !form.api_key.trim()) { toast.error("المفتاح مطلوب"); return; }
    setSaving(true);
    try {
      const payload: Record<string, string> = { name: form.name.trim(), provider: form.provider, default_model: form.default_model.trim() };
      if (form.api_key.trim()) payload.api_key = form.api_key.trim();
      if (editing) await api.patch(ep.admin.aiKey(editing.id), payload);
      else await api.post(ep.admin.aiKeys, payload);
      toast.success(editing ? "تم حفظ المفتاح" : "تمت إضافة المفتاح");
      setOpen(false); fetchAll();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const setActive = async (k: AIKey) => {
    try {
      await api.post(ep.admin.aiKeySetActive(k.id));
      toast.success(`«${k.name}» صار المفتاح النشط`);
      fetchAll();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await api.delete(ep.admin.aiKey(deleteTarget.id));
      setDeleteTarget(null);
      toast.success("تم حذف المفتاح");
      fetchAll();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setBusy(false); }
  };

  // ── مزوّدون ──
  const openNewProv = () => { setProvEditing(null); setProvForm({ ...emptyProv, order: providers.length } as typeof emptyProv); setProvOpen(true); };
  const openEditProv = (p: Provider) => { setProvEditing(p); setProvForm({ name: p.name, slug: p.slug, base_url: p.base_url, default_model: p.default_model, simple_model: p.simple_model, sensitive_model: p.sensitive_model, is_active: p.is_active }); setProvOpen(true); };
  const setPF = <K extends keyof typeof provForm>(k: K, v: (typeof provForm)[K]) => setProvForm((p) => ({ ...p, [k]: v }));

  const saveProv = async () => {
    if (!provForm.name.trim()) { toast.error("اسم المزوّد مطلوب"); return; }
    setProvSaving(true);
    try {
      const payload = { name: provForm.name.trim(), slug: provForm.slug.trim(), base_url: provForm.base_url.trim(), default_model: provForm.default_model.trim(), simple_model: provForm.simple_model.trim(), sensitive_model: provForm.sensitive_model.trim(), is_active: provForm.is_active };
      if (provEditing) await api.patch(ep.admin.aiProvider(provEditing.id), payload);
      else await api.post(ep.admin.aiProviders, payload);
      toast.success(provEditing ? "تم حفظ المزوّد" : "تمت إضافة المزوّد");
      setProvOpen(false); fetchAll();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setProvSaving(false); }
  };

  /**
   * يختبر النموذج النشط بنداء حقيقي.
   *
   * ⚠️ **الخطأ نتيجةٌ لا فشل**: الخادم يعيد 200 بـ`ok:false` ورسالة، فلا نعرض
   * «تعذّر الاتصال» — بل السبب نفسه («النموذج لم يعد متاحاً»، «تجاوزت الحصّة»)،
   * وهو الغرض كلّه من الحقل.
   */
  const runTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      const res = await api.post<TestResult>(ep.admin.aiTestActive,
        testPrompt.trim() ? { prompt: testPrompt.trim() } : {});
      setTestResult(res.data);
      if (res.data.ok) toast.success(`النموذج يعمل — ${res.data.model}`);
      else toast.error("النموذج لم يستجب");
    } catch (err) {
      setTestResult({ ok: false, error: getErrorMessage(err) });
    } finally { setTesting(false); }
  };

  const confirmDeleteProv = async () => {
    if (!provDelete) return;
    setBusy(true);
    try {
      await api.delete(ep.admin.aiProvider(provDelete.id));
      setProvDelete(null);
      toast.success("تم حذف المزوّد");
      fetchAll();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader icon={<Stars />} title="الذكاء الاصطناعي" subtitle="إدارة المزوّدين والمفاتيح وتفاصيل الاستخدام"
        actions={<Button onClick={openNew}><AddCircle className="h-4 w-4" /> مفتاح جديد</Button>} />

      {/* ── المفتاح النشط الآن — بارز جداً ── */}
      {activeKey ? (
        <div className="rounded-2xl border-2 border-primary bg-primary/5 p-5">
          <div className="flex items-center gap-2 text-primary font-bold mb-2">
            <CheckCircle className="h-5 w-5" /> المفتاح المُستخدَم الآن
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-lg font-extrabold text-gray-900">{activeKey.name}</span>
            <Badge variant="info">{provName(activeKey.provider)}</Badge>
            <span dir="ltr" className="font-mono text-xs bg-white px-2 py-1 rounded border border-primary/20">{activeKey.masked_key}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">هذا هو المفتاح الذي تعمل به المنصّة فعلياً. لتبديله، اضغط «تفعيل» على مفتاح آخر في القائمة أدناه.</p>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 text-amber-800 text-sm">
          ⚠️ لا يوجد مفتاح نشط — أضِف مفتاحاً وفعّله لبدء استخدام الذكاء الاصطناعي.
        </div>
      )}

      {/* ── اختبار النموذج النشط ── */}
      <div className="bg-white rounded-2xl shadow-card p-5">
        <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-1">
          <Play className="h-5 w-5 text-primary" /> اختبار النموذج النشط
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          نداء حقيقي بالمفتاح النشط — يكشف المفتاح الميّت أو معرّف النموذج المتقاعد
          قبل أن يصطدم به المستخدم. اتركه فارغاً لاستخدام سؤال تجريبي.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input value={testPrompt} onChange={(e) => setTestPrompt(e.target.value)}
            placeholder="اكتب سؤالاً للنموذج (اختياري)" className="flex-1"
            onKeyDown={(e) => { if (e.key === "Enter" && !testing) runTest(); }} />
          <Button onClick={runTest} loading={testing} disabled={!activeKey}>
            <Play className="h-4 w-4" /> شغّل الاختبار
          </Button>
        </div>

        {testResult && (
          <div className={`mt-4 rounded-xl border p-4 ${testResult.ok ? "border-green-200 bg-green-50/60" : "border-red-200 bg-red-50/60"}`}>
            <div className="flex items-center gap-2 flex-wrap text-sm font-bold mb-2">
              {testResult.ok
                ? <><CheckCircle className="h-4 w-4 text-green-600" /><span className="text-green-700">النموذج يعمل</span></>
                : <><DangerTriangle className="h-4 w-4 text-red-500" /><span className="text-red-600">فشل الاختبار</span></>}
              {testResult.model && <span dir="ltr" className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border">{testResult.model}</span>}
              {typeof testResult.elapsed_ms === "number" &&
                <span className="text-xs font-normal text-gray-500">{fmt(Math.round(testResult.elapsed_ms))} م.ث</span>}
              {testResult.usage?.total_tokens != null &&
                <span className="text-xs font-normal text-gray-500">{fmt(testResult.usage.total_tokens)} رمزاً</span>}
            </div>
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {testResult.ok ? testResult.reply : testResult.error}
            </p>
          </div>
        )}
      </div>

      {/* ── إحصاء طلبات المنصّة ── */}
      {local && (
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><ChartSquare className="h-5 w-5 text-primary" /> إحصاء طلبات المنصّة</h2>
            <button onClick={fetchLocal} disabled={localLoading} title="تحديث" className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-primary/10 flex items-center justify-center">
              <Refresh className={`h-4 w-4 text-gray-500 ${localLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Stat label="إجمالي الطلبات" value={fmt(local.total_requests)} />
            <Stat label="ناجحة" value={fmt(local.success)} tone="green" />
            <Stat label="فاشلة" value={fmt(local.error)} tone={local.error ? "red" : "default"} />
            <Stat label="إجمالي التوكنات" value={fmt(local.total_tokens)} />
            <Stat label="آخر 24 ساعة" value={fmt(local.last_24h)} />
          </div>
        </div>
      )}

      {/* ── توزيع النماذج (استراتيجية مختلطة) ── */}
      {tiers && (
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h2 className="font-bold text-gray-900 mb-1">توزيع النماذج (مختلط)</h2>
          <p className="text-xs text-gray-400 mb-4">المهام البسيطة تعمل بنموذج مجاني، والحسّاسة بنموذج مدفوع — توفيراً للتكلفة. النماذج التالية مأخوذة من <b>المزوّد النشط</b> (تُضبط لكل مزوّد في قسم «المزوّدون» أدناه، لأن المعرّفات تختلف بينها).</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl border border-green-100 bg-green-50/50 p-3">
              <p className="text-xs text-green-700 font-semibold mb-1">🆓 المهام البسيطة → مجاني</p>
              <p dir="ltr" className="font-mono text-xs text-gray-700 text-left break-all">{tiers.simple_model}</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
              <p className="text-xs text-amber-700 font-semibold mb-1">💳 المهام الحسّاسة → مدفوع</p>
              <p dir="ltr" className="font-mono text-xs text-gray-700 text-left break-all">{tiers.sensitive_model}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {tiers.tasks.map((t) => (
              <div key={t.name} className="flex items-center gap-2 text-sm py-1.5 border-b border-gray-50 last:border-0">
                <span className="font-semibold text-gray-800" dir="ltr">{t.name}</span>
                <Badge variant={t.sensitive ? "warning" : "success"}>{t.sensitive ? "مدفوع" : "مجاني"}</Badge>
                <span className="text-xs text-gray-400 truncate flex-1 text-left" dir="ltr">{t.model}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── قائمة المفاتيح ── */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100"><h2 className="font-bold text-gray-900">المفاتيح</h2></div>
        {loading ? (
          <div className="divide-y divide-gray-100">{[0, 1].map((i) => <div key={i} className="h-16 bg-gray-50 animate-pulse m-3 rounded-xl" />)}</div>
        ) : keys.length === 0 ? (
          <div className="py-16 text-center text-gray-400"><Stars className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>لا مفاتيح بعد — أضِف أول مفتاح</p></div>
        ) : (
          <div className="p-3 space-y-2">
            {keys.map((key) => (
              <div key={key.id} className={`flex items-center gap-4 p-3.5 rounded-xl transition-colors ${key.is_active ? "border-2 border-primary bg-primary/5" : "border border-gray-100 hover:bg-gray-50/70"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 text-sm">{key.name}</h3>
                    {key.is_active
                      ? <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-primary px-2 py-0.5 rounded-full"><CheckCircle className="h-3.5 w-3.5" /> نشط الآن</span>
                      : <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">غير نشط</span>}
                    <Badge variant="info">{provName(key.provider)}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 flex-wrap">
                    <span dir="ltr" className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{key.masked_key || "—"}</span>
                    {key.last_used_at && <span>آخر استخدام: {new Date(key.last_used_at).toLocaleDateString("ar")}</span>}
                  </div>
                  {!key.is_active && key.last_error && <p className="text-xs text-red-500 mt-1 line-clamp-1" title={key.last_error}>توقّف: {key.last_error}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {!key.is_active && (
                    <button onClick={() => setActive(key)} className="text-xs font-bold px-3 h-9 rounded-lg bg-primary text-white hover:bg-primary/90 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> تفعيل
                    </button>
                  )}
                  <button onClick={() => openStats(key)} title="الإحصائيات" className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-primary/10 flex items-center justify-center"><ChartSquare className="h-4 w-4 text-gray-500" /></button>
                  <button onClick={() => openEdit(key)} title="تعديل" className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-primary/10 flex items-center justify-center"><Pen className="h-4 w-4 text-gray-500" /></button>
                  <button onClick={() => setDeleteTarget(key)} title="حذف" className="w-9 h-9 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center"><TrashBinMinimalistic className="h-4 w-4 text-red-500" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── المزوّدون ── */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><ServerSquare className="h-5 w-5 text-primary" /> المزوّدون</h2>
          <Button size="sm" variant="outline" onClick={openNewProv}><AddCircle className="h-4 w-4" /> مزوّد جديد</Button>
        </div>
        {providers.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">لا مزوّدون بعد</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {providers.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-gray-50/70 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 text-sm">{p.name}</h3>
                    <span dir="ltr" className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{p.slug}</span>
                    {p.keys_count > 0 && <Badge variant="info">{p.keys_count} مفتاح</Badge>}
                    {!p.is_active && <Badge variant="default">معطّل</Badge>}
                  </div>
                  <p dir="ltr" className="text-xs text-gray-400 mt-1 truncate text-left">{p.base_url || "عنوان API الافتراضي (OpenRouter)"}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => openEditProv(p)} title="تعديل" className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-primary/10 flex items-center justify-center"><Pen className="h-4 w-4 text-gray-500" /></button>
                  <button onClick={() => setProvDelete(p)} title="حذف" className="w-9 h-9 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center"><TrashBinMinimalistic className="h-4 w-4 text-red-500" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">
        المزوّدون متوافقون مع OpenAI — يكفي تحديد «عنوان API» لكلٍّ (اختياري؛ يُستخدم عنوان OpenRouter عند تركه فارغاً).
        كل مفتاح يختار مزوّده من القائمة. المفتاح النشط (واحد فقط) هو ما تعمل به المنصّة. لا يُعرض المفتاح كاملاً بعد الحفظ.
      </p>

      {/* محرّر المفتاح */}
      <Dialog open={open} onClose={() => setOpen(false)} title={editing ? "تعديل المفتاح" : "مفتاح جديد"}>
        <div className="space-y-4">
          <Input label="الاسم (وصف مميّز)" value={form.name} onChange={(e) => setF("name", e.target.value)} required />
          <Select label="المزوّد" options={providers.map((p) => ({ value: p.slug, label: p.name }))} value={form.provider} onChange={(e) => setF("provider", e.target.value)} />
          <Input label={editing ? "المفتاح (اتركه فارغاً للإبقاء على الحالي)" : "المفتاح (API Key)"} value={form.api_key} onChange={(e) => setF("api_key", e.target.value)} dir="ltr" type="password" placeholder="sk-..." />
          <Input label="النموذج الافتراضي (اختياري — يُورَّث من المزوّد)" value={form.default_model} onChange={(e) => setF("default_model", e.target.value)} dir="ltr" placeholder="openai/gpt-4o-mini" />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setOpen(false)}>إلغاء</Button>
            <Button fullWidth loading={saving} onClick={save}>{editing ? "حفظ" : "إضافة"}</Button>
          </div>
        </div>
      </Dialog>

      {/* محرّر المزوّد */}
      <Dialog open={provOpen} onClose={() => setProvOpen(false)} title={provEditing ? "تعديل المزوّد" : "مزوّد جديد"}>
        <div className="space-y-4">
          <Input label="اسم المزوّد" value={provForm.name} onChange={(e) => setPF("name", e.target.value)} required placeholder="OpenRouter" />
          <Input label="المعرّف (slug) — اتركه فارغاً للتوليد الآلي" value={provForm.slug} onChange={(e) => setPF("slug", e.target.value)} dir="ltr" />
          <Input label="عنوان API (اختياري)" value={provForm.base_url} onChange={(e) => setPF("base_url", e.target.value)} dir="ltr" placeholder="https://openrouter.ai/api/v1" />
          <Input label="النموذج الافتراضي (اختياري)" value={provForm.default_model} onChange={(e) => setPF("default_model", e.target.value)} dir="ltr" placeholder="openai/gpt-4o-mini" />
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-3">
            <p className="text-xs text-gray-500">نماذج الاستراتيجية المختلطة لهذا المزوّد (معرّفات النماذج تختلف بين المزوّدين). اتركها فارغة لاستخدام النموذج الافتراضي أعلاه.</p>
            <Input label="🆓 نموذج المهام البسيطة (مجاني)" value={provForm.simple_model} onChange={(e) => setPF("simple_model", e.target.value)} dir="ltr" placeholder="google/gemma-4-26b-a4b-it:free" />
            <Input label="💳 نموذج المهام الحسّاسة (مدفوع)" value={provForm.sensitive_model} onChange={(e) => setPF("sensitive_model", e.target.value)} dir="ltr" placeholder="openai/gpt-4o-mini" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={provForm.is_active} onChange={(e) => setPF("is_active", e.target.checked)} className="rounded" />
            <span className="text-sm text-gray-700">مُفعّل</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setProvOpen(false)}>إلغاء</Button>
            <Button fullWidth loading={provSaving} onClick={saveProv}>{provEditing ? "حفظ" : "إضافة"}</Button>
          </div>
        </div>
      </Dialog>

      {/* إحصائيات مفتاح */}
      <Dialog open={!!statsKey} onClose={() => setStatsKey(null)} title={statsKey ? `إحصائيات: ${statsKey.name}` : ""}>
        {statsLoading ? (
          <div className="py-8 text-center text-gray-400"><Refresh className="h-6 w-6 mx-auto animate-spin" /><p className="mt-2 text-sm">جارٍ الجلب…</p></div>
        ) : !statsData ? null : !statsData.ok ? (
          <p className="text-sm text-red-500 py-4 text-center">تعذّر الجلب: {statsData.error}</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="الاستهلاك" value={money(statsData.key?.usage)} tone="primary" />
              <Stat label="الحدّ" value={statsData.key?.limit == null ? "غير محدود" : money(statsData.key?.limit)} />
              <Stat label="المتبقّي للمفتاح" value={statsData.key?.limit_remaining == null ? "—" : money(statsData.key?.limit_remaining)} tone="green" />
              <Stat label="رصيد الحساب المتبقّي" value={money(statsData.credits?.remaining)} />
            </div>
            <div className="text-xs text-gray-500 space-y-1 border-t border-gray-100 pt-3">
              <div className="flex justify-between"><span>إجمالي رصيد الحساب</span><span dir="ltr" className="tabular-nums">{money(statsData.credits?.total_credits)}</span></div>
              <div className="flex justify-between"><span>إجمالي الاستهلاك</span><span dir="ltr" className="tabular-nums">{money(statsData.credits?.total_usage)}</span></div>
              <div className="flex justify-between"><span>الطبقة المجانية</span><span>{statsData.key?.is_free_tier ? "نعم" : "لا"}</span></div>
            </div>
            <Button variant="outline" fullWidth onClick={() => statsKey && openStats(statsKey)}><Refresh className="h-4 w-4" /> تحديث</Button>
          </div>
        )}
      </Dialog>

      {/* ── مزوّدون بحصص مجانية ── */}
      {catalog.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" /> مزوّدون بحصّة مجانية
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              الحصص إرشادية وتتغيّر — راجع صفحة المزوّد قبل الاعتماد عليها. أضِف المفتاح من «مفتاح جديد» بنفس المعرّف.
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {catalog.map((c) => (
              <div key={c.slug} className="flex items-start gap-4 p-4 hover:bg-gray-50/70 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 text-sm">{c.name}</h3>
                    <span dir="ltr" className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{c.slug}</span>
                    {c.has_key ? <Badge variant="success">له مفتاح</Badge>
                      : c.registered ? <Badge variant="warning">مسجَّل بلا مفتاح</Badge>
                      : <Badge variant="default">غير مسجَّل</Badge>}
                    {!c.openai_compatible && <Badge variant="info">واجهة خاصّة</Badge>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{c.free_quota}</p>
                  <p dir="ltr" className="font-mono text-[11px] text-gray-400 mt-1 text-left break-all">{c.default_model}</p>
                </div>
                <a href={c.keys_url} target="_blank" rel="noopener noreferrer"
                  className="shrink-0 text-xs font-bold px-3 h-9 rounded-lg bg-gray-50 hover:bg-primary/10 text-primary flex items-center">
                  احصل على مفتاح
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteTarget} icon={<TrashBinMinimalistic className="h-6 w-6 text-red-500" />}
        title="حذف المفتاح؟"
        message={deleteTarget ? `«${deleteTarget.name}»${deleteTarget.is_active ? " — هذا المفتاح النشط! ستحتاج تفعيل مفتاح آخر." : " — لا يمكن التراجع."}` : ""}
        variant="danger" confirmLabel="حذف" loading={busy} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />

      <ConfirmDialog open={!!provDelete} icon={<TrashBinMinimalistic className="h-6 w-6 text-red-500" />}
        title="حذف المزوّد؟"
        message={provDelete ? `«${provDelete.name}»${provDelete.keys_count > 0 ? ` — يملك ${provDelete.keys_count} مفتاحاً، لن يُحذف حتى تنقلها.` : " — لا يمكن التراجع."}` : ""}
        variant="danger" confirmLabel="حذف" loading={busy} onConfirm={confirmDeleteProv} onCancel={() => setProvDelete(null)} />
    </div>
  );
}

function Stat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "primary" | "green" | "red" }) {
  const color = tone === "primary" ? "text-primary" : tone === "green" ? "text-green-600" : tone === "red" ? "text-red-500" : "text-gray-900";
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}
