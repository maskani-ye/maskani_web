"use client";

// صفحة Cloudflare R2 — الوسائط والنسخ الاحتياطية. السؤالان اللذان تجيب عنهما:
// أين تذهب المساحة؟ وهل نسخة الأمس موجودة فعلاً؟

import { ServiceShell, type ServiceData } from "@/components/admin/ServiceShell";
import {
  Gauge, Metric, MetricGrid, Note, Panel, Table, formatBytes, formatNumber, timeAgo,
} from "@/components/admin/service-metrics";
import { Badge } from "@/components/ui/Badge";
import { Folder } from "@solar-icons/react";

interface Backup { name: string; bytes: number; modified: string | null }
interface FolderRow { folder: string; bytes: number; files: number }
interface R2 extends ServiceData {
  total_files: number;
  total_bytes: number;
  backups_count: number;
  latest_backup: Backup | null;
  backup_age_hours: number | null;
  backup_stale: boolean;
  backups: Backup[];
  folders: FolderRow[];
}

//: الحصّة المجانية في R2 — 10 ج.ب تخزين شهرياً.
const FREE_STORAGE_BYTES = 10 * 1024 ** 3;

export default function R2Page() {
  return (
    <ServiceShell<R2> serviceKey="r2" icon={Folder}>
      {(d) => {
        const pct = (d.total_bytes / FREE_STORAGE_BYTES) * 100;
        return (
          <>
            <MetricGrid>
              <Metric label="إجمالي الحجم" value={formatBytes(d.total_bytes)} sub={`${formatNumber(d.total_files)} ملف`} />
              <Metric label="النسخ الاحتياطية" value={formatNumber(d.backups_count)} sub="نسخة محفوظة" />
              <Metric
                label="عمر آخر نسخة"
                value={d.backup_age_hours != null ? `${d.backup_age_hours} ساعة` : "لا توجد"}
                tone={d.backup_stale ? "bad" : "good"}
                sub={d.backup_stale ? "تجاوزت نافذة الـ48 ساعة" : "ضمن النافذة اليومية"}
              />
              <Metric
                label="آخر نسخة"
                value={d.latest_backup ? formatBytes(d.latest_backup.bytes) : "—"}
                sub={timeAgo(d.latest_backup?.modified)}
              />
            </MetricGrid>

            <MetricGrid>
              <Gauge
                label="من الحصّة المجانية"
                pct={pct}
                warn={70}
                danger={90}
                caption={`${formatBytes(d.total_bytes)} من ${formatBytes(FREE_STORAGE_BYTES)}`}
              />
            </MetricGrid>

            <Panel title="توزيع المساحة على المجلّدات">
              <Table<FolderRow>
                rows={d.folders ?? []}
                cols={[
                  { key: "folder", header: "المجلّد" },
                  { key: "bytes", header: "الحجم", render: (r) => formatBytes(r.bytes) },
                  { key: "files", header: "الملفات", render: (r) => formatNumber(r.files) },
                  {
                    key: "share",
                    header: "الحصّة",
                    render: (r) => (
                      <div className="flex items-center gap-2 min-w-32">
                        <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${d.total_bytes ? (r.bytes / d.total_bytes) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 tabular-nums">
                          {d.total_bytes ? ((r.bytes / d.total_bytes) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                    ),
                  },
                ]}
              />
            </Panel>

            <Panel
              title="أحدث النسخ الاحتياطية"
              action={
                <Badge variant={d.backup_stale ? "danger" : "success"}>
                  {d.backup_stale ? "متأخّرة" : "منتظمة"}
                </Badge>
              }
            >
              <Table<Backup>
                rows={d.backups ?? []}
                cols={[
                  { key: "name", header: "الملف" },
                  { key: "bytes", header: "الحجم", render: (r) => formatBytes(r.bytes) },
                  { key: "modified", header: "أُنشئت", render: (r) => timeAgo(r.modified) },
                ]}
              />
            </Panel>

            <Note>
              النسخة اليومية تُرفع 01:00 ويُحتفظ بها 30 يوماً. تجاوز عمر آخر نسخة 48 ساعة يعني
              أن مهمة النسخ توقّفت صامتة — وهو ما نرصده هنا صراحةً.
            </Note>
          </>
        );
      }}
    </ServiceShell>
  );
}
