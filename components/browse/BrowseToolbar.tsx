"use client";

/**
 * شريط التصفّح المشترك — **تصميم واحد لكل الأقسام**.
 *
 * ⚠️ **لماذا مكوّن واحد لا أربعة**: كانت كل شاشة تبني شريطها بيدها، فاختلفت
 * أربع شاشات في أربعة أشياء: العقارات بحقل بحث ورقائق، والخدمات برقائق تصنيف
 * وقائمة مدينة عارية، والطلبات بشيء ثالث. المستخدم يقرأ ذلك «مواقع مختلفة تحت
 * علامة واحدة». التوحيد هنا يجعل أي تغيير لاحق يقع مرّةً واحدة.
 *
 * ⚠️ **والخريطة للعقارات وحدها**: الخدمة يقدّمها مزوّد يتنقّل، والطلب نيّةٌ لا
 * موقع لها. وضع خريطة لهما يملأ نصف الشاشة بما لا يُجاب عنه.
 *
 * البنية مطابقة للمرجع المعتمد: صفٌّ للبحث والرقائق و«كل الفلاتر»، ثم خطّ
 * شعرة، ثم صفٌّ للعدد والترتيب وأزرار الحالة.
 */

import { Magnifer, SliderHorizontal, CloseCircle, AltArrowDown } from "@solar-icons/react";
import { formatNumber } from "@/lib/utils";

export interface Chip {
  key: string;
  label: string;
  clear: () => void;
}

export interface SortOption {
  value: string;
  label: string;
}

export function BrowseToolbar({
  search,
  onSearch,
  searchPlaceholder = "ابحث…",
  chips = [],
  onOpenFilters,
  filterCount = 0,
  count,
  loading,
  unitLabel,
  sort,
  sortOptions,
  onSort,
  extraFields,
  actions,
  children,
}: {
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder?: string;
  chips?: Chip[];
  onOpenFilters?: () => void;
  filterCount?: number;
  count: number;
  loading?: boolean;
  /** «عقار متاح» · «مزوّد خدمة» · «طلب منشور» — الوحدة تتبع القسم. */
  unitLabel: string;
  sort?: string;
  sortOptions?: SortOption[];
  onSort?: (v: string) => void;
  /** حقول إضافية تُعرض بجانب حقل البحث (كالبحث الذكيّ في العقارات). */
  extraFields?: React.ReactNode;
  /** أزرار الطرف المقابل في الصفّ الثاني (مفتاح الخريطة، حفظ البحث…). */
  actions?: React.ReactNode;
  /** محتوى الشاشة داخل الحاوية نفسها. */
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-e2 backdrop-blur-xl">
      {/* ── صفّ ① : البحث والرقائق ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-ink/[0.07] p-3 sm:p-4">
        <div className="relative order-1 w-full min-w-0 sm:w-64">
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 w-full rounded-xl border border-ink/10 bg-white ps-4 pe-10 text-caption text-ink outline-none transition-colors placeholder:text-muted focus:border-primary-300"
          />
          <Magnifer className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400" />
        </div>

        {extraFields}

        <div className="order-2 flex flex-1 flex-wrap items-center justify-end gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              onClick={chip.clear}
              className="group inline-flex h-10 items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3.5 text-caption text-ink transition-colors hover:border-ink/25"
            >
              {chip.label}
              <CloseCircle className="h-3.5 w-3.5 text-muted transition-colors group-hover:text-ink" />
            </button>
          ))}
          {onOpenFilters && (
            <button
              onClick={onOpenFilters}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-caption font-semibold text-white transition-colors hover:bg-primary"
            >
              كل الفلاتر
              <SliderHorizontal className="h-4 w-4" />
              {filterCount > 0 && (
                <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white/25 px-1.5 text-caption font-bold">
                  {formatNumber(filterCount)}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── صفّ ② : العدد والترتيب والإجراءات ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 pt-4 sm:px-5">
        {/* ⚠️ `h1` الصفحة: الكتل التعريفية حُذفت، فبلا هذا تبقى بلا عنوان. */}
        <h1 className="text-h2 text-ink">
          {loading ? "جارٍ التحميل…" : <>{formatNumber(count)} {unitLabel}</>}
        </h1>
        <div className="flex items-center gap-2">
          {sortOptions && onSort && (
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => onSort(e.target.value)}
                aria-label="ترتيب النتائج"
                className="h-9 appearance-none rounded-lg border-0 bg-transparent ps-1 pe-6 text-caption text-muted outline-none hover:text-ink"
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <AltArrowDown className="pointer-events-none absolute end-1 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            </div>
          )}
          {actions}
        </div>
      </div>

      {children}
    </div>
  );
}

export default BrowseToolbar;
