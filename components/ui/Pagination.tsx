import { Button } from "@/components/ui/Button";

/**
 * ترقيم صفحي موحّد (offset/limit) — السابق/التالي + رقم الصفحة. يلغي تكراره في كل قائمة.
 * <Pagination offset={offset} limit={LIMIT} total={total} onChange={setOffset} />
 */
export function Pagination({
  offset,
  limit,
  total,
  onChange,
}: {
  offset: number;
  limit: number;
  total: number;
  onChange: (offset: number) => void;
}) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  const current = Math.floor(offset / limit) + 1;
  return (
    <div className="flex items-center justify-between">
      <Button variant="outline" size="sm" disabled={offset === 0}
        onClick={() => onChange(Math.max(0, offset - limit))}>السابق</Button>
      <span className="text-sm text-gray-500 tabular-nums">{current} / {pages}</span>
      <Button variant="outline" size="sm" disabled={offset + limit >= total}
        onClick={() => onChange(offset + limit)}>التالي</Button>
    </div>
  );
}
