"use client";

// ─── خريطة أيقونات أصناف الخدمات ────────────────────────────────────────────
// الـ backend يُرسل `icon` كنص (Solar icon-key) مثل: "buildings" | "waterdrop"
// نحوّل المفتاح إلى مكوّن Solar المطابق. أي مفتاح غير معروف → أيقونة افتراضية.

import {
  Buildings2, Waterdrop, Bolt, PaintRoller, Ruler, Broom, Snowflake,
  Palette, Settings, Home2, PenNewSquare, Widget, Case, ClipboardList,
  Lightbulb, WashingMachine, Fire, PlugCircle, MapPoint, Shop,
  HomeSmile, RulerPen, Wind, Scale, UserHandUp, Sledgehammer, Key,
  Sofa, Bed, Bath, Leaf, City, Garage, ShieldCheck, Wallet, Phone, Star,
} from "@solar-icons/react";

// كل أيقونات Solar تشترك في نفس نوع الـ props
type SolarIcon = typeof Buildings2;

const DEFAULT_ICON: SolarIcon = Widget;

// ─── القائمة المنسّقة للأيقونات (تُعرض في IconPicker) ───────────────────────
// هذه المفاتيح متزامنة مع solar_icon_for_key.dart في تطبيق Flutter — أي مفتاح
// هنا يجب أن يُرسم في التطبيق أيضاً. الترتيب هو ترتيب العرض في الشبكة.
export const ICON_KEYS: string[] = [
  "buildings",
  "home",
  "home-smile",
  "map-point",
  "shop",
  "city",
  "garage",
  "key",
  "sofa",
  "bed",
  "bath",
  "tree",
  "ruler-pen",
  "user-hard-hat",
  "hammer",
  "wrench",
  "paint-roller",
  "broom",
  "bolt",
  "waterdrop",
  "wind",
  "lightbulb",
  "settings",
  "scale",
  "shield",
  "wallet",
  "phone",
  "star",
  "checklist",
  "widget",
];

// المفاتيح مُطبَّعة (حروف صغيرة، الفراغات/الشرطات السفلية → شرطة)
const ICON_MAP: Record<string, SolarIcon> = {
  // مباني / مقاولات
  buildings: Buildings2, building: Buildings2, contractor: Buildings2, construction: Buildings2,
  // سباكة
  waterdrop: Waterdrop, water: Waterdrop, plumber: Waterdrop, plumbing: Waterdrop,
  // كهرباء
  bolt: Bolt, electric: Bolt, electrician: Bolt, electricity: Bolt,
  plug: PlugCircle,
  // دهان
  "paint-roller": PaintRoller, paint: PaintRoller, painter: PaintRoller,
  palette: Palette, "interior-designer": Palette, designer: Palette,
  // تصميم / هندسة
  ruler: Ruler, architect: Ruler, design: Ruler, engineer: Ruler,
  // تنظيف
  broom: Broom, clean: Broom, cleaner: Broom, cleaning: Broom,
  washing: WashingMachine, laundry: WashingMachine,
  // تكييف / تبريد
  snowflake: Snowflake, ac: Snowflake, "ac-technician": Snowflake, cooling: Snowflake,
  // صيانة / أدوات
  wrench: Settings, maintenance: Settings, repair: Settings, tools: Settings, settings: Settings,
  // إشراف
  supervisor: ClipboardList, clipboard: ClipboardList, checklist: ClipboardList,
  // إضاءة / غاز
  bulb: Lightbulb, light: Lightbulb, lightbulb: Lightbulb,
  fire: Fire, gas: Fire, heating: Fire,
  // عام
  home: Home2, house: Home2, property: Home2, apartment: Home2,
  "map-point": MapPoint, map: MapPoint, location: MapPoint, land: MapPoint,
  shop: Shop, store: Shop, commercial: Shop,
  pen: PenNewSquare, case: Case, work: Case, widget: Widget,
  // مفاتيح القائمة المنسّقة (ICON_KEYS)
  "home-smile": HomeSmile,
  "ruler-pen": RulerPen,
  wind: Wind, ventilation: Wind,
  scale: Scale, legal: Scale, notary: Scale,
  "user-hard-hat": UserHandUp, worker: UserHandUp, labor: UserHandUp,
  hammer: Sledgehammer, sledgehammer: Sledgehammer, carpenter: Sledgehammer,
  key: Key, rent: Key, keys: Key,
  sofa: Sofa, furniture: Sofa, "living-room": Sofa,
  bed: Bed, bedroom: Bed, room: Bed,
  bath: Bath, bathroom: Bath, wc: Bath,
  tree: Leaf, leaf: Leaf, garden: Leaf, nature: Leaf,
  city: City, town: City,
  garage: Garage, parking: Garage,
  shield: ShieldCheck, security: ShieldCheck, guard: ShieldCheck,
  wallet: Wallet, price: Wallet, budget: Wallet, finance: Wallet,
  phone: Phone, call: Phone, contact: Phone,
  star: Star, rating: Star, featured: Star,
};

/** يُرجع مكوّن أيقونة Solar المطابق للمفتاح، أو الافتراضي إن لم يوجد. */
export function getServiceIcon(key?: string | null): SolarIcon {
  if (!key) return DEFAULT_ICON;
  const normalized = key.trim().toLowerCase().replace(/[\s_]+/g, "-");
  return ICON_MAP[normalized] ?? DEFAULT_ICON;
}

/** مكوّن جاهز لعرض أيقونة الصنف مباشرةً من المفتاح. */
export function ServiceIcon({ icon, className }: { icon?: string | null; className?: string }) {
  const Icon = getServiceIcon(icon);
  return <Icon className={className} />;
}
