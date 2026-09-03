"use client";

import type { Property, User } from "@/types";
import { ShieldCheck, DangerTriangle, Buildings2, ClockCircle, Phone } from "@solar-icons/react";

/** إشارات ثقة بصفر كلفة خارجية — بديل التحقّق بالرسائل القصيرة.
 *
 *  كلها وصف محايد لا اتهام: السمسار الشرعي ينشر بكثرة أيضًا، وحسابٌ جديد ليس
 *  تهمة. القرار يبقى للباحث، ودورنا أن نعطيه ما يبني عليه. */
export function TrustSignals({ property }: { property: Property }) {
  const owner = typeof property.user === "object" ? (property.user as User) : null;

  const memberSince = owner?.created_at
    ? new Date(owner.created_at).toLocaleDateString("ar", { year: "numeric", month: "long" })
    : null;
  const propertiesCount = owner?.properties_count ?? null;
  const phoneCount = property.phone_listings_count ?? null;

  const hasAny =
    owner?.is_verified || memberSince || propertiesCount || phoneCount || property.trust_note;
  if (!hasAny) return null;

  return (
    <div className="bg-white rounded-2xl card-shadow p-4 mt-4">
      <p className="text-body font-bold text-ink mb-2">معلومات تساعدك على التحقّق</p>
      <ul className="space-y-1.5 text-caption text-muted-600">
        {owner?.is_verified && (
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
            حساب موثّق من إدارة مسكني
          </li>
        )}
        {memberSince && (
          <li className="flex items-center gap-2">
            <ClockCircle className="h-3.5 w-3.5 text-muted shrink-0" />
            عضو منذ {memberSince}
          </li>
        )}
        {propertiesCount ? (
          <li className="flex items-center gap-2">
            <Buildings2 className="h-3.5 w-3.5 text-muted shrink-0" />
            نشر {propertiesCount} عقارًا على المنصّة
          </li>
        ) : null}
        {phoneCount ? (
          <li className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-muted shrink-0" />
            رقم التواصل هذا منشور على {phoneCount} عقارًا
          </li>
        ) : null}
      </ul>

      {property.trust_note && (
        <p className="flex items-start gap-2 text-caption text-warning-700 bg-warning-50 rounded-xl p-2.5 mt-3">
          <DangerTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {property.trust_note}
        </p>
      )}
    </div>
  );
}
