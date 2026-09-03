import { ReactNode, ComponentType } from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";

interface SolarIconProps { className?: string }

/**
 * قائمة بيانات موحّدة — تتكفّل بحالات **التحميل** (هيكل نابض) و**الفراغ** (EmptyState)
 * وعرض الصفوف داخل بطاقة بيضاء بفواصل. تلغي تكرار هذا المنطق في كل صفحة قائمة.
 *
 * <DataList items={rows} loading={loading} keyOf={r=>r.id}
 *   empty={{ icon: Case, title: "لا نتائج" }}
 *   renderItem={(r)=><MyRow item={r}/>} />
 *
 * card=false يلغي غلاف البطاقة (لعرض شبكي/بطاقات مستقلة عبر gridClassName).
 */
export function DataList<T>({
  items,
  loading,
  renderItem,
  keyOf,
  empty,
  skeletonCount = 6,
  card = true,
  gridClassName,
  className,
}: {
  items: T[];
  loading?: boolean;
  renderItem: (item: T, index: number) => ReactNode;
  keyOf: (item: T, index: number) => string | number;
  empty: { icon?: ComponentType<SolarIconProps>; title: string; message?: string; actionLabel?: string; onAction?: () => void };
  skeletonCount?: number;
  card?: boolean;
  gridClassName?: string;
  className?: string;
}) {
  const wrap = (children: ReactNode) =>
    card ? (
      <div className={cn("bg-white rounded-2xl shadow-e2 overflow-hidden", className)}>{children}</div>
    ) : (
      <div className={className}>{children}</div>
    );

  if (loading) {
    return wrap(
      <div className={gridClassName ?? "divide-y divide-muted-100"}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
            <div className="w-11 h-11 rounded-xl bg-muted-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-muted-100 rounded w-1/3" />
              <div className="h-3 bg-muted-50 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return wrap(
      <div className="py-14">
        <EmptyState icon={empty.icon} title={empty.title} message={empty.message}
          actionLabel={empty.actionLabel} onAction={empty.onAction} />
      </div>
    );
  }

  return wrap(
    <div className={gridClassName ?? "divide-y divide-muted-100"}>
      {items.map((item, i) => (
        <div key={keyOf(item, i)}>{renderItem(item, i)}</div>
      ))}
    </div>
  );
}
