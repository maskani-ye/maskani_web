"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow, ReactFlowProvider, Background, Controls, MiniMap, Handle, Position,
  MarkerType, useNodesState, useEdgesState, type Node, type Edge, type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Link from "next/link";
import { api, getErrorMessage } from "@/lib/api";
import { endpoints as ep } from "@/lib/endpoints";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { AddCircle, Diskette, Play, Server, TrashBinMinimalistic, Routing, Star } from "@solar-icons/react";
import { toast } from "sonner";

// ── الأنواع ──────────────────────────────────────────────────────────────────
interface HdAction {
  id: string; name: string; method: string; url_template: string;
  headers: Record<string, unknown>; query_template: Record<string, unknown>; body_template: Record<string, unknown>;
  auth_as_user: boolean; timeout_ms: number; confirm_required: boolean; confirm_template: string;
  success_message: string; error_message: string; result_list_path: string; result_item_map: Record<string, unknown>;
  is_active: boolean;
}
interface HdButton {
  id: string; label: string; style: string; icon: string; sort_order: number;
  target_node: string | null; action: string | null; is_item_action: boolean; roles: string[]; is_active: boolean;
}
interface HdNode {
  id: string; key: string; title: string; body: string; node_type: string; is_start: boolean;
  list_action: string | null; pos_x: number; pos_y: number; roles: string[]; is_active: boolean; buttons: HdButton[];
}
type FlowData = { node: HdNode };

const NODE_TYPES = [
  { value: "message", label: "رسالة + أزرار" },
  { value: "list", label: "قائمة ديناميكية" },
  { value: "handoff", label: "تحويل لموظّف" },
  { value: "end", label: "إنهاء" },
];
const TYPE_COLOR: Record<string, string> = {
  message: "#403B9B", list: "#FFC107", handoff: "#8b5cf6", end: "#6b7280",
};

let _tmp = 1;
const tmpId = (p: string) => `${p}-tmp-${_tmp++}`;

// ── عقدة مخصّصة ───────────────────────────────────────────────────────────────
function FlowNodeBox({ data, selected }: { data: FlowData; selected: boolean }) {
  const n = data.node;
  const color = TYPE_COLOR[n.node_type] || "#403B9B";
  return (
    <div className={`rounded-xl bg-white border-2 shadow-sm min-w-[210px] ${selected ? "ring-2 ring-primary" : ""}`}
      style={{ borderColor: color }}>
      <Handle type="target" position={Position.Left} style={{ background: color, width: 10, height: 10 }} />
      <div className="px-3 py-2 rounded-t-[10px] text-white flex items-center gap-1.5" style={{ background: color }}>
        {n.is_start && <Star className="h-3.5 w-3.5" />}
        <span className="text-xs font-bold flex-1 truncate">{n.title || n.key}</span>
        <span className="text-[10px] opacity-80">{NODE_TYPES.find((t) => t.value === n.node_type)?.label}</span>
      </div>
      {n.body && <p className="px-3 py-1.5 text-[11px] text-gray-500 line-clamp-2">{n.body}</p>}
      <div className="px-2 pb-2 pt-1 space-y-1">
        {n.buttons.length === 0 && <p className="text-[10px] text-gray-300 px-1">لا أزرار</p>}
        {n.buttons.map((b) => (
          <div key={b.id} className="relative rounded-lg bg-gray-50 border border-gray-200 px-2 py-1 text-[11px] text-gray-700 flex items-center gap-1">
            <span className="flex-1 truncate">{b.label || "—"}</span>
            {b.action && <span className="text-[9px] bg-gold/15 text-gold-700 px-1 rounded">⚡</span>}
            {b.is_item_action && <span className="text-[9px] bg-primary/10 text-primary px-1 rounded">عنصر</span>}
            <Handle type="source" position={Position.Right} id={b.id}
              style={{ background: color, width: 9, height: 9, right: -13 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
const nodeTypes = { flow: FlowNodeBox };

// ── الصفحة ────────────────────────────────────────────────────────────────────
function FlowEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<FlowData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [actions, setActions] = useState<HdAction[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  const rebuildEdges = useCallback((ns: Node<FlowData>[]) => {
    const es: Edge[] = [];
    ns.forEach((rn) => rn.data.node.buttons.forEach((b) => {
      if (b.target_node) es.push({
        id: `e-${b.id}`, source: rn.id, sourceHandle: b.id, target: b.target_node,
        markerEnd: { type: MarkerType.ArrowClosed }, style: { strokeWidth: 1.5 },
      });
    }));
    setEdges(es);
  }, [setEdges]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ nodes: HdNode[]; actions: HdAction[] }>(ep.admin.helpdeskGraph);
      const rns: Node<FlowData>[] = res.data.nodes.map((n) => ({
        id: n.id, type: "flow", position: { x: n.pos_x, y: n.pos_y }, data: { node: n },
      }));
      setNodes(rns);
      setActions(res.data.actions);
      rebuildEdges(rns);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [setNodes, rebuildEdges]);

  useEffect(() => { load(); }, [load]);

  // تحديث عقدة في الحالة
  const patchNode = useCallback((id: string, patch: Partial<HdNode>) => {
    setNodes((ns) => {
      const next = ns.map((rn) => rn.id === id ? { ...rn, data: { node: { ...rn.data.node, ...patch } } } : rn);
      rebuildEdges(next);
      return next;
    });
  }, [setNodes, rebuildEdges]);

  // توصيل زرّ بعقدة (سحب)
  const onConnect = useCallback((c: Connection) => {
    setNodes((ns) => {
      const next = ns.map((rn) => {
        if (rn.id !== c.source) return rn;
        const buttons = rn.data.node.buttons.map((b) => b.id === c.sourceHandle ? { ...b, target_node: c.target } : b);
        return { ...rn, data: { node: { ...rn.data.node, buttons } } };
      });
      rebuildEdges(next);
      return next;
    });
  }, [setNodes, rebuildEdges]);

  const addNode = () => {
    const id = tmpId("node");
    const n: HdNode = {
      id, key: "", title: "عقدة جديدة", body: "", node_type: "message", is_start: false,
      list_action: null, pos_x: 60, pos_y: 60, roles: [], is_active: true, buttons: [],
    };
    setNodes((ns) => [...ns, { id, type: "flow", position: { x: 60, y: 60 }, data: { node: n } }]);
    setSelId(id);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        nodes: nodes.map((rn) => ({
          ...rn.data.node,
          pos_x: rn.position.x, pos_y: rn.position.y,
          buttons: rn.data.node.buttons.map((b, i) => ({ ...b, sort_order: i })),
        })),
      };
      await api.put(ep.admin.helpdeskGraph, payload);
      toast.success("تم حفظ الفلو");
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const selNode = useMemo(() => nodes.find((n) => n.id === selId)?.data.node ?? null, [nodes, selId]);
  const nodeOptions = useMemo(() => nodes.map((n) => ({ value: n.id, label: n.data.node.title || n.data.node.key || n.id.slice(0, 6) })), [nodes]);
  const actionOptions = useMemo(() => [{ value: "", label: "— بلا إجراء —" }, ...actions.map((a) => ({ value: a.id, label: a.name }))], [actions]);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* شريط الأدوات */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-white flex-wrap">
        <div className="flex items-center gap-1.5 font-bold text-gray-800"><Routing className="h-5 w-5 text-primary" /> محرّر الفلو</div>
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={addNode}><AddCircle className="h-4 w-4" /> عقدة</Button>
        <Button size="sm" variant="outline" onClick={() => setActionsOpen(true)}><Server className="h-4 w-4" /> الإجراءات ({actions.length})</Button>
        <Link href="/help" target="_blank"><Button size="sm" variant="outline"><Play className="h-4 w-4" /> معاينة</Button></Link>
        <Button size="sm" loading={saving} onClick={save}><Diskette className="h-4 w-4" /> حفظ</Button>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* اللوحة */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">جارٍ التحميل…</div>
          ) : (
            <ReactFlow
              nodes={nodes} edges={edges} nodeTypes={nodeTypes}
              onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
              onSelectionChange={({ nodes: sn }) => setSelId(sn[0]?.id ?? null)}
              fitView proOptions={{ hideAttribution: true }} dir="ltr">
              <Background />
              <Controls />
              <MiniMap nodeColor={(n) => TYPE_COLOR[(n.data as FlowData)?.node?.node_type] || "#403B9B"} />
            </ReactFlow>
          )}
        </div>

        {/* مفتّش العقدة */}
        {selNode && (
          <NodeInspector
            key={selNode.id} node={selNode} nodeOptions={nodeOptions.filter((o) => o.value !== selNode.id)}
            actionOptions={actionOptions}
            onChange={(patch) => patchNode(selNode.id, patch)}
            onDelete={() => { setNodes((ns) => ns.filter((n) => n.id !== selNode.id)); setSelId(null); }}
          />
        )}
      </div>

      {/* مدير الإجراءات */}
      <ActionsDrawer open={actionsOpen} onClose={() => setActionsOpen(false)} actions={actions} onReload={load} />
    </div>
  );
}

// ── مفتّش العقدة ───────────────────────────────────────────────────────────────
function NodeInspector({ node, nodeOptions, actionOptions, onChange, onDelete }: {
  node: HdNode; nodeOptions: { value: string; label: string }[]; actionOptions: { value: string; label: string }[];
  onChange: (p: Partial<HdNode>) => void; onDelete: () => void;
}) {
  const setBtn = (bid: string, patch: Partial<HdButton>) =>
    onChange({ buttons: node.buttons.map((b) => b.id === bid ? { ...b, ...patch } : b) });
  const addBtn = () => onChange({
    buttons: [...node.buttons, {
      id: tmpId("btn"), label: "زرّ جديد", style: "button", icon: "", sort_order: node.buttons.length,
      target_node: null, action: null, is_item_action: false, roles: [], is_active: true,
    }],
  });
  const delBtn = (bid: string) => onChange({ buttons: node.buttons.filter((b) => b.id !== bid) });
  const field = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="w-80 border-r border-gray-100 bg-white overflow-y-auto p-4 space-y-3 shrink-0">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-sm">خصائص العقدة</h3>
        <button onClick={onDelete} title="حذف العقدة" className="text-red-500 hover:bg-red-50 rounded p-1"><TrashBinMinimalistic className="h-4 w-4" /></button>
      </div>
      <Input label="العنوان" value={node.title} onChange={(e) => onChange({ title: e.target.value })} />
      <Input label="المعرّف (key) — تلقائي إن فارغ" value={node.key} onChange={(e) => onChange({ key: e.target.value })} dir="ltr" />
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1 block">النصّ (يدعم {"{username}"})</label>
        <textarea className={`${field} resize-none`} rows={3} value={node.body} onChange={(e) => onChange({ body: e.target.value })} />
      </div>
      <Select label="النوع" options={NODE_TYPES} value={node.node_type} onChange={(e) => onChange({ node_type: e.target.value })} />
      {node.node_type === "list" && (
        <Select label="إجراء الجلب (قائمة)" options={actionOptions} value={node.list_action ?? ""} onChange={(e) => onChange({ list_action: e.target.value || null })} />
      )}
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={node.is_start} onChange={(e) => onChange({ is_start: e.target.checked })} className="rounded" />
        نقطة البداية (is_start)
      </label>

      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-gray-700 text-sm">الأزرار</h4>
          <button onClick={addBtn} className="text-xs text-primary font-semibold flex items-center gap-1"><AddCircle className="h-4 w-4" /> زرّ</button>
        </div>
        <div className="space-y-3">
          {node.buttons.map((b) => (
            <div key={b.id} className="rounded-lg border border-gray-100 p-2.5 space-y-2 bg-gray-50/50">
              <div className="flex items-center gap-1">
                <input className={`${field} flex-1`} value={b.label} placeholder="نص الزرّ" onChange={(e) => setBtn(b.id, { label: e.target.value })} />
                <button onClick={() => delBtn(b.id)} className="text-red-400 hover:text-red-600 p-1"><TrashBinMinimalistic className="h-3.5 w-3.5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <select className={field} value={b.target_node ?? ""} onChange={(e) => setBtn(b.id, { target_node: e.target.value || null })}>
                  <option value="">— وجهة —</option>
                  {nodeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select className={field} value={b.action ?? ""} onChange={(e) => setBtn(b.id, { action: e.target.value || null })}>
                  {actionOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-gray-500">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={b.style === "card"} onChange={(e) => setBtn(b.id, { style: e.target.checked ? "card" : "button" })} /> بطاقة
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={b.is_item_action} onChange={(e) => setBtn(b.id, { is_item_action: e.target.checked })} /> على عنصر القائمة
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── مدير الإجراءات (endpoints) ─────────────────────────────────────────────────
const EMPTY_ACTION = {
  name: "", method: "GET", url_template: "", headers: {}, query_template: {}, body_template: {},
  auth_as_user: true, timeout_ms: 15000, confirm_required: false, confirm_template: "",
  success_message: "تمّ بنجاح.", error_message: "تعذّر تنفيذ الإجراء.", result_list_path: "", result_item_map: {}, is_active: true,
};
function ActionsDrawer({ open, onClose, actions, onReload }: {
  open: boolean; onClose: () => void; actions: HdAction[]; onReload: () => void;
}) {
  const [editing, setEditing] = useState<HdAction | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({ ...EMPTY_ACTION });
  const [jsonFields, setJsonFields] = useState({ headers: "{}", query_template: "{}", body_template: "{}", result_item_map: "{}" });
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<string>("");

  const openEdit = (a: HdAction | null) => {
    setEditing(a);
    setForm(a ? { ...a } : { ...EMPTY_ACTION });
    setJsonFields({
      headers: JSON.stringify(a?.headers ?? {}, null, 0), query_template: JSON.stringify(a?.query_template ?? {}, null, 0),
      body_template: JSON.stringify(a?.body_template ?? {}, null, 0), result_item_map: JSON.stringify(a?.result_item_map ?? {}, null, 0),
    });
    setTestResult("");
  };
  const setF = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const buildPayload = (): Record<string, unknown> | null => {
    const parse = (s: string) => { try { return JSON.parse(s || "{}"); } catch { return null; } };
    const headers = parse(jsonFields.headers), query = parse(jsonFields.query_template), body = parse(jsonFields.body_template), rim = parse(jsonFields.result_item_map);
    if ([headers, query, body, rim].some((x) => x === null)) { toast.error("أحد حقول JSON غير صالح"); return null; }
    return { ...form, headers, query_template: query, body_template: body, result_item_map: rim };
  };

  const saveAction = async () => {
    const payload = buildPayload();
    if (!payload) return;
    if (!String(payload.name).trim() || !String(payload.url_template).trim()) { toast.error("الاسم والرابط مطلوبان"); return; }
    setSaving(true);
    try {
      if (editing) await api.patch(ep.admin.helpdeskAction(editing.id), payload);
      else await api.post(ep.admin.helpdeskActions, payload);
      toast.success("تم حفظ الإجراء");
      openEdit(null); onReload();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };
  const delAction = async (a: HdAction) => {
    try { await api.delete(ep.admin.helpdeskAction(a.id)); toast.success("حُذف"); onReload(); openEdit(null); }
    catch (err) { toast.error(getErrorMessage(err)); }
  };
  const testAction = async () => {
    if (!editing) { toast.error("احفظ الإجراء أولاً لاختباره"); return; }
    setTestResult("جارٍ الاختبار…");
    try {
      const res = await api.post<{ ok: boolean; status_code: number; message: string; items: unknown[] }>(ep.admin.helpdeskActionTest(editing.id), {});
      setTestResult(`${res.data.ok ? "✓ نجح" : "✗ فشل"} (HTTP ${res.data.status_code}) — ${res.data.message} · عناصر: ${res.data.items?.length ?? 0}`);
    } catch (err) { setTestResult("خطأ: " + getErrorMessage(err)); }
  };
  const field = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <Dialog open={open} onClose={onClose} title="إجراءات الفلو (endpoints)">
      <div className="space-y-3 max-h-[75vh] overflow-y-auto">
        {/* القائمة */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">{actions.length} إجراء</span>
          <Button size="sm" onClick={() => openEdit({ ...(EMPTY_ACTION as unknown as HdAction), id: "" })}><AddCircle className="h-4 w-4" /> إجراء جديد</Button>
        </div>
        <div className="space-y-1.5">
          {actions.map((a) => (
            <div key={a.id} className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{a.name}</p>
                <p className="text-[11px] text-gray-400 truncate" dir="ltr">{a.method} {a.url_template}</p>
              </div>
              <button onClick={() => openEdit(a)} className="text-xs text-primary font-medium">تعديل</button>
              <button onClick={() => delAction(a)} className="text-red-400 p-1"><TrashBinMinimalistic className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>

        {/* المحرّر */}
        {(editing !== null) && (
          <div className="rounded-xl border-2 border-primary/20 p-3 space-y-2.5 bg-primary/5">
            <h4 className="font-bold text-sm text-primary">{editing.id ? "تعديل إجراء" : "إجراء جديد"}</h4>
            <Input label="الاسم" value={String(form.name)} onChange={(e) => setF("name", e.target.value)} />
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="text-xs font-semibold text-gray-600 mb-1 block">الطريقة</label>
                <select className={field} value={String(form.method)} onChange={(e) => setF("method", e.target.value)}>
                  {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="col-span-2"><Input label="الرابط (يدعم {var})" value={String(form.url_template)} onChange={(e) => setF("url_template", e.target.value)} dir="ltr" placeholder="/api/v1/... أو https://..." /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <JsonBox label="Query (JSON)" value={jsonFields.query_template} onChange={(v) => setJsonFields((p) => ({ ...p, query_template: v }))} />
              <JsonBox label="Body (JSON)" value={jsonFields.body_template} onChange={(v) => setJsonFields((p) => ({ ...p, body_template: v }))} />
              <JsonBox label="Headers (JSON)" value={jsonFields.headers} onChange={(v) => setJsonFields((p) => ({ ...p, headers: v }))} />
              <JsonBox label="خريطة عنصر القائمة (JSON)" value={jsonFields.result_item_map} onChange={(v) => setJsonFields((p) => ({ ...p, result_item_map: v }))} />
            </div>
            <Input label="مسار القائمة في الاستجابة" value={String(form.result_list_path)} onChange={(e) => setF("result_list_path", e.target.value)} dir="ltr" placeholder="results" />
            <div className="grid grid-cols-2 gap-2">
              <Input label="رسالة النجاح" value={String(form.success_message)} onChange={(e) => setF("success_message", e.target.value)} />
              <Input label="رسالة الخطأ" value={String(form.error_message)} onChange={(e) => setF("error_message", e.target.value)} />
            </div>
            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={!!form.auth_as_user} onChange={(e) => setF("auth_as_user", e.target.checked)} /> بهوية المستخدم</label>
              <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={!!form.confirm_required} onChange={(e) => setF("confirm_required", e.target.checked)} /> يتطلّب تأكيداً</label>
            </div>
            {!!form.confirm_required && <Input label="نصّ التأكيد" value={String(form.confirm_template)} onChange={(e) => setF("confirm_template", e.target.value)} />}
            {testResult && <p className="text-xs rounded-lg bg-white border border-gray-200 p-2 text-gray-700" dir="ltr">{testResult}</p>}
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={() => openEdit(null)}>إلغاء</Button>
              {editing.id && <Button size="sm" variant="outline" onClick={testAction}><Play className="h-4 w-4" /> اختبار</Button>}
              <Button size="sm" loading={saving} onClick={saveAction}>حفظ</Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}

function JsonBox({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-1 block">{label}</label>
      <textarea dir="ltr" rows={2} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
    </div>
  );
}

export default function HelpdeskFlowPage() {
  return <ReactFlowProvider><FlowEditor /></ReactFlowProvider>;
}
