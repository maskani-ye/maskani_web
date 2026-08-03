// ─── Users ────────────────────────────────────────────────────────────────
export type UserRole = "user" | "admin";

export interface User {
  id: number;
  phone: string;
  full_name: string;
  role: UserRole;
  is_service_provider: boolean;
  avatar: string | null;
  bio: string;
  is_verified: boolean;
  is_active: boolean;
  city: number | null;
  city_name: string | null;
  average_rating: number | null;
  ratings_count: number;
  listings_count: number;
  followers_count: number;
  following_count: number;
  // true حين لا هاتف — العميل يُرغّب بالإكمال بلا إجبار
  profile_incomplete?: boolean;
  created_at: string;
}

// ─── Cities & Countries ───────────────────────────────────────────────────
export interface Country {
  id: number;
  name_ar: string;
  name_en: string;
  code: string;
  is_active: boolean;
  cities: City[];
}

export interface City {
  id: number;
  name_ar: string;
  name_en: string;
  region: string;
  country: number;
  country_name: string;
  latitude?: string | null;
  longitude?: string | null;
  is_active?: boolean;
}

// ─── Listings ─────────────────────────────────────────────────────────────
export type PropertyType = "apartment" | "house" | "land" | "commercial";
export type OfferType = "sale" | "rent_monthly" | "rent_yearly";
export type Currency = "SAR" | "YER" | "USD";
export type FurnishingType = "furnished" | "unfurnished" | "semi_furnished";
export type ListingStatus = "available" | "reserved" | "sold_rented";

export interface ListingImage {
  id: number;
  image: string;
  is_main: boolean;
  order: number;
}

export interface Listing {
  id: number;
  user: number | User;
  user_name?: string;
  user_verified?: boolean;
  title: string;
  description: string;
  property_type: PropertyType;
  offer_type: OfferType;
  furnishing: FurnishingType | null;
  status: ListingStatus;
  city: number;
  city_name?: string;
  neighborhood: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  price: string;
  currency: Currency;
  previous_price?: string | null;
  price_reduced?: boolean;
  is_promoted?: boolean;
  area: string | null;
  rooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  total_floors: number | null;
  has_elevator: boolean;
  has_parking: boolean;
  has_garden: boolean;
  has_pool: boolean;
  has_security: boolean;
  has_internet: boolean;
  has_ac: boolean;
  has_generator: boolean;
  has_storage: boolean;
  pets_allowed: boolean;
  contact_phone: string;
  contact_whatsapp: string;
  is_active: boolean;
  views_count: number;
  favorites_count: number;
  main_image: string | null;
  images?: ListingImage[];
  created_at: string;
  updated_at: string;
}

// ─── Property Types (Admin) ─────────────────────────────────────────────────
export interface PropertyTypeItem {
  id: number;
  name_ar: string;
  name_en: string;
  slug: string;
  icon: string;
  is_active: boolean;
  order: number;
  listings_count?: number;
}

// نسخة مصغّرة تأتي متداخلة داخل الإعلان
export interface PropertyTypeRef {
  id: number;
  name_ar: string;
  icon: string;
}

// ─── Service Categories (Admin) ─────────────────────────────────────────────
export interface ServiceCategoryItem {
  id: number;
  name_ar: string;
  name_en: string;
  slug: string;
  icon: string;
  is_active: boolean;
  order: number;
  providers_count?: number;
}

// نسخة مصغّرة تأتي متداخلة داخل مزوّد الخدمة
export interface ServiceCategoryRef {
  id: number;
  name_ar: string;
  icon: string;
}

// ─── Services ─────────────────────────────────────────────────────────────
export type ServiceCategory =
  | "architect" | "interior_designer" | "contractor"
  | "supervisor" | "electrician" | "plumber" | "ac_technician"
  | "painter" | "cleaner" | "maintenance" | "other";

export interface ServiceProvider {
  id: number;
  user: number | User;
  user_name?: string;
  user_avatar?: string | null;
  user_verified?: boolean;
  // الباك اند يُرجِعها ككائن متداخل (من مرجع ServiceCategory المُدار)؛
  // نُبقي السلسلة للتوافق الرجعي.
  category: ServiceCategoryRef | ServiceCategory;
  title: string;
  description: string;
  experience_years: number;
  cities: number[];
  cities_names?: string[];
  contact_phone: string;
  contact_whatsapp: string;
  average_rating: number | null;
  reviews_count: number;
  portfolio?: PortfolioItem[];
  reviews?: ServiceReview[];
  created_at: string;
}

export interface PortfolioItem {
  id: number;
  title: string;
  description: string;
  image: string;
  order: number;
  created_at: string;
}

export interface ServiceReview {
  id: number;
  reviewer: number;
  reviewer_name: string;
  reviewer_avatar: string | null;
  rating: number;
  comment: string;
  created_at: string;
}

// ─── Fraud Reports ────────────────────────────────────────────────────────
export type FraudType = "fake_listing" | "scam" | "fake_owner" | "double_rent" | "deposit_theft" | "other";
export type ReportStatus = "pending" | "verified" | "rejected";

export interface FraudReport {
  id: number;
  reporter: number;
  reporter_name: string;
  accused_name: string;
  accused_phone: string;
  accused_profile_link: string;
  fraud_type: FraudType;
  title: string;
  details: string;
  city: number | null;
  city_name?: string | null;
  status: ReportStatus;
  credibility_score: number;
  comments_count: number;
  votes_credible: number;
  votes_not_credible: number;
  first_image: string | null;
  images?: { id: number; image: string }[];
  comments?: FraudComment[];
  my_vote?: boolean | null;
  created_at: string;
}

export interface FraudComment {
  id: number;
  user: number;
  user_name: string;
  user_avatar: string | null;
  text: string;
  created_at: string;
}

// ─── Client Requests ──────────────────────────────────────────────────────
export interface ClientRequest {
  id: number;
  client: number;
  client_name: string;
  property_type: string;
  offer_type: string;
  city: number;
  city_name: string;
  neighborhood: string;
  budget_min: string | null;
  budget_max: string | null;
  currency: Currency;
  rooms_needed: number | null;
  additional_specs: string;
  contact_phone: string;
  is_active: boolean;
  offers_count: number;
  is_expired: boolean;
  expires_at: string;
  created_at: string;
  offers?: RequestOffer[];
}

export interface RequestOffer {
  id: number;
  offered_by: number;
  offered_by_name: string;
  offered_by_verified: boolean;
  offered_by_avatar: string | null;
  listing: number | null;
  listing_details?: Listing;
  message: string;
  contact_phone: string;
  is_read: boolean;
  is_accepted: boolean;
  created_at: string;
}

// ─── Notifications ────────────────────────────────────────────────────────
export interface Notification {
  id: number;
  notification_type: string;
  title: string;
  body: string;
  data: Record<string, string>;
  is_read: boolean;
  created_at: string;
}

// ─── Chat / Direct Messages ───────────────────────────────────────────────
export interface ChatParticipant {
  is_online?: boolean;
  id: number;
  full_name: string;
  avatar: string | null;
}

// ─── مرفقات الرسائل (صوت/صورة/فيديو/ملف) ──────────────────────────────────
export type AttachmentType = "image" | "audio" | "video" | "file";

// حالة المرفق: `ready` | `processing` | `failed` (خادمية) أو `uploading` (محلية فقط).
export type AttachmentStatus = "ready" | "processing" | "failed" | "uploading";

export interface Attachment {
  id: number;
  type: AttachmentType;
  url: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  width?: number | null;
  height?: number | null;
  duration_ms?: number | null;
  thumbnail_url?: string | null;
  status?: AttachmentStatus;
  // ─── محلي فقط (لا يُرسل للخادم) — معاينة فورية أثناء الرفع المتفائل ───────
  local_url?: string;
}

// نتيجة رفع مرفق: استجابة `POST conversations/<id>/upload/`.
export interface AttachmentUploadResult {
  upload_token: string;
  type: AttachmentType;
  url: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  width?: number | null;
  height?: number | null;
  duration_ms?: number | null;
}

export interface Message {
  id: number;
  conversation: number;
  sender: number; // user id
  body: string;
  is_read: boolean;
  created_at: string;
  // ─── حقول البروتوكول اللحظي (WebSocket) — اختيارية للتوافق الخلفي ─────────
  reply_to?: number | null;
  is_edited?: boolean;
  is_deleted?: boolean;
  attachments?: Attachment[];
}

export interface Conversation {
  id: number;
  other_participant: ChatParticipant;
  listing: number | null;
  last_message: Pick<Message, "body" | "created_at"> & Partial<Message> | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

// ─── Admin Chat (dashboard) ───────────────────────────────────────────────
export interface AdminConversationLastMessage {
  id: number;
  body: string;
  sender_id: number;
  is_deleted: boolean;
  created_at: string;
}

export interface AdminConversation {
  id: number;
  participant_a: ChatParticipant;
  participant_b: ChatParticipant;
  listing: number | null;
  last_message: AdminConversationLastMessage | null;
  messages_count: number;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminConversationMessage {
  id: number;
  sender: ChatParticipant;
  body: string;
  is_read: boolean;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
}

// ─── API Pagination ───────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Auth ─────────────────────────────────────────────────────────────────
// استجابة نجاح مصادقة جوجل عبر knox — توكن واحد طويل الأمد (بلا refresh).
export interface AuthResponse {
  user: User;
  token: string;
}
