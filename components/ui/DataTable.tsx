"use client";

// ─── DataTable ──────────────────────────────────────────────────────────────
// جدول عام <T>: أعمدة قابلة للفرز/التخصيص، تحديد صفوف + شريط إجراءات، رأس ثابت،
// هيكل تحميل، حالة فارغة، وتفعيل الصف بالفأرة/Enter.
// usage: <DataTable columns={cols} rows={data} getRowId={(r)=>r.id} onRowClick={open} />

import { cn } from "@/lib/utils";
import { AltArrowUp, AltArrowDown } from "@solar-icons/react";
import { Skeleton } from "./Skeleton";
import { KeyboardEvent, ReactNode } from "react";

export type RowId = string | number;

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** محتوى مخصص للخلية؛ بدونه يُعرض row[key] */
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  align?: "start" | "center" | "end";
  className?: string;
  headerClassName?: string;
}

export interface SortState {
  key: string;
  direction: "asc" | "desc";
}

export interface DataTableSelection<T> {
  selectedIds: RowId[];
  onChange: (ids: RowId[]) => void;
  /** slot يُعرض داخل شريط الإجراءات عند وجود تحديد */
  bulkActions?: ReactNode;
  /** استثناء صفوف من التحديد */
  isSelectable?: (row: T) => boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => RowId;
  loading?: boolean;
  /** slot (عادةً <EmptyState/>) يُعرض عندما لا توجد صفوف */
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
  selection?: DataTableSelection<T>;
  /** حالة الفرز المُتحكَّم بها (عادةً من الخادم) */
  sort?: SortState;
  onSortChange?: (s: SortState) => void;
  skeletonRows?: number;
  className?: string;
}

const alignClass = {
  start: "text-start",
  center: "text-center",
  end: "text-end",
} as const;

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  loading = false,
  empty,
  onRowClick,
  selection,
  sort,
  onSortChange,
  skeletonRows = 6,
  className,
}: DataTableProps<T>) {
  const selectableRows = selection
    ? rows.filter((r) => selection.isSelectable?.(r) ?? true)
    : [];
  const selectedSet = new Set(selection?.selectedIds ?? []);
  const allSelected =
    selectableRows.length > 0 && selectableRows.every((r) => selectedSet.has(getRowId(r)));
  const someSelected = selectableRows.some((r) => selectedSet.has(getRowId(r)));
  const colSpan = columns.length + (selection ? 1 : 0);

  const toggleAll = () => {
    if (!selection) return;
    selection.onChange(allSelected ? [] : selectableRows.map(getRowId));
  };

  const toggleOne = (id: RowId) => {
    if (!selection) return;
    const next = new Set(selection.selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    selection.onChange([...next]);
  };

  const handleSort = (col: Column<T>) => {
    if (!col.sortable || !onSortChange) return;
    const nextDir: SortState["direction"] =
      sort?.key === col.key && sort.direction === "asc" ? "desc" : "asc";
    onSortChange({ key: col.key, direction: nextDir });
  };

  const onRowKey = (e: KeyboardEvent<HTMLTableRowElement>, row: T) => {
    if (!onRowClick) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRowClick(row);
    }
  };

  return (
    <div className={cn("relative rounded-2xl border border-border bg-white overflow-hidden", className)}>
      {/* شريط الإجراءات الجماعية */}
      {selection && selectedSet.size > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-primary-50 border-b border-border">
          <span className="text-body font-semibold text-primary-700">
            محدّد: {selectedSet.size}
          </span>
          <div className="flex items-center gap-2">{selection.bulkActions}</div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-body text-start border-collapse">
          <thead className="sticky top-0 z-10 bg-muted-50">
            <tr className="border-b border-border">
              {selection && (
                <th className="w-10 px-4 py-3 text-start">
                  <input
                    type="checkbox"
                    aria-label="تحديد الكل"
                    className="rounded border-muted-200 text-primary focus:ring-primary/30"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !allSelected && someSelected;
                    }}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {columns.map((col) => {
                const active = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3 font-bold text-muted-600 whitespace-nowrap",
                      alignClass[col.align ?? "start"],
                      col.sortable && "cursor-pointer select-none hover:text-ink",
                      col.headerClassName
                    )}
                    aria-sort={
                      active ? (sort!.direction === "asc" ? "ascending" : "descending") : undefined
                    }
                    onClick={() => handleSort(col)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {col.sortable && active && (
                        sort!.direction === "asc" ? (
                          <AltArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <AltArrowDown className="h-3.5 w-3.5" />
                        )
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, r) => (
                <tr key={r} className="border-b border-border last:border-0">
                  {selection && (
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-4" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-[8rem]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="p-0">
                  {empty ?? (
                    <div className="py-12 text-center text-body text-muted">لا توجد بيانات</div>
                  )}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const id = getRowId(row);
                const selected = selectedSet.has(id);
                return (
                  <tr
                    key={id}
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? "button" : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={(e) => onRowKey(e, row)}
                    className={cn(
                      "border-b border-border last:border-0 transition-colors",
                      selected && "bg-primary-50/50",
                      onRowClick && "cursor-pointer hover:bg-muted-50 focus:bg-muted-50 outline-none"
                    )}
                  >
                    {selection && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label="تحديد الصف"
                          className="rounded border-muted-200 text-primary focus:ring-primary/30"
                          checked={selected}
                          disabled={selection.isSelectable ? !selection.isSelectable(row) : false}
                          onChange={() => toggleOne(id)}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-3 text-muted-700",
                          alignClass[col.align ?? "start"],
                          col.className
                        )}
                      >
                        {col.render
                          ? col.render(row)
                          : ((row as unknown as Record<string, ReactNode>)[col.key] ?? null)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
