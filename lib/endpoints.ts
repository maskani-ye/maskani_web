// مصدر واحد لكل مسارات الـ API — مطابق لنمط `EndPoints` في تطبيق فلاتر.
// يمنع أخطاء المسارات المطبعية (مثل /admin/service-categories/ الخاطئ بدل
// /admin/services/categories/). القاعدة `/api/v1` مضبوطة في lib/api.ts، فكل
// مسار هنا نسبيّ لها. المسارات ذات المعرّف دوالّ تُرجع النص الصحيح.
//
// الاستخدام:
//   import { endpoints as ep } from "@/lib/endpoints";
//   api.get(ep.admin.users);
//   api.patch(ep.admin.user(id), body);

type Id = number | string;

const ADMIN = "/admin";

export const endpoints = {
  // ══════════════ عام (واجهة المستخدم) ══════════════
  cities: "/cities/",
  listings: "/listings/",
  listing: (id: Id) => `/listings/${id}/`,
  listingsMap: "/listings/map/",
  propertyTypes: "/listings/property-types/",
  services: "/services/",
  service: (id: Id) => `/services/${id}/`,
  serviceCategories: "/services/categories/",
  requests: "/requests/",
  request: (id: Id) => `/requests/${id}/`,
  jobs: "/jobs/",
  job: (id: Id) => `/jobs/${id}/`,
  reports: "/reports/",
  report: (id: Id) => `/reports/${id}/`,

  // ── عام: AI + تتبّع + إعدادات ──
  aiSuggestDescription: "/ai/suggest-description/",
  analyticsTrack: "/analytics/track/",
  appConfig: "/settings/app-config/",

  // ── helpdesk (مركز المساعدة — العميل) ──
  helpdeskOpen: "/helpdesk/sessions/open/",
  helpdeskActive: "/helpdesk/sessions/active/",
  helpdeskMessages: (id: Id) => `/helpdesk/sessions/${id}/messages/`,
  helpdeskSelectOption: (id: Id) => `/helpdesk/sessions/${id}/select-option/`,
  helpdeskSendMessage: (id: Id) => `/helpdesk/sessions/${id}/send-message/`,
  helpdeskClose: (id: Id) => `/helpdesk/sessions/${id}/close/`,
  serviceCreate: "/services/create/",
  serviceUpdate: (id: Id) => `/services/${id}/update/`,
  serviceDelete: (id: Id) => `/services/${id}/delete/`,
  servicesMine: "/services/my/",
  portfolioAdd: "/services/portfolio/add/",
  portfolioDelete: (id: Id) => `/services/portfolio/${id}/delete/`,

  // ══════════════ الإدارة (admin_v1 — يجب أن تبدأ بـ /admin) ══════════════
  admin: {
    // dashboard
    stats: `${ADMIN}/dashboard/stats/`,
    broadcast: `${ADMIN}/dashboard/broadcast/`,
    auditLog: `${ADMIN}/dashboard/audit-log/`,
    legal: (slug: string) => `${ADMIN}/dashboard/legal/${slug}/`,

    // accounts
    users: `${ADMIN}/accounts/users/`,
    user: (id: Id) => `${ADMIN}/accounts/users/${id}/`,
    verificationRequests: `${ADMIN}/accounts/verification-requests/`,
    verificationRequest: (id: Id) => `${ADMIN}/accounts/verification-requests/${id}/`,

    // listings
    listings: `${ADMIN}/listings/`,
    listing: (id: Id) => `${ADMIN}/listings/${id}/`,
    propertyTypes: `${ADMIN}/listings/property-types/`,
    propertyType: (id: Id) => `${ADMIN}/listings/property-types/${id}/`,

    // services
    services: `${ADMIN}/services/`,
    service: (id: Id) => `${ADMIN}/services/${id}/`,
    serviceCategories: `${ADMIN}/services/categories/`,
    serviceCategory: (id: Id) => `${ADMIN}/services/categories/${id}/`,

    // demands (طلبات عقارية)
    demands: `${ADMIN}/demands/`,
    demand: (id: Id) => `${ADMIN}/demands/${id}/`,

    // jobs (طلبات خدمات)
    jobs: `${ADMIN}/jobs/`,
    job: (id: Id) => `${ADMIN}/jobs/${id}/`,

    // chat
    conversations: `${ADMIN}/chat/conversations/`,
    conversation: (id: Id) => `${ADMIN}/chat/conversations/${id}/`,
    conversationMessages: (id: Id) => `${ADMIN}/chat/conversations/${id}/messages/`,
    conversationMessage: (id: Id, msgId: Id) =>
      `${ADMIN}/chat/conversations/${id}/messages/${msgId}/`,

    // social (بلاغات المستخدمين)
    userReports: `${ADMIN}/social/user-reports/`,
    userReport: (id: Id) => `${ADMIN}/social/user-reports/${id}/`,

    // reports (بلاغات الاحتيال)
    reports: `${ADMIN}/reports/`,
    report: (id: Id) => `${ADMIN}/reports/${id}/`,
    reportUpdate: (id: Id) => `${ADMIN}/reports/${id}/update/`,

    // cities
    cities: `${ADMIN}/cities/`,
    city: (id: Id) => `${ADMIN}/cities/${id}/`,
    countries: `${ADMIN}/cities/countries/`,
    country: (id: Id) => `${ADMIN}/cities/countries/${id}/`,

    // analytics (تحليلات الزيارات)
    analyticsSummary: `${ADMIN}/analytics/summary/`,
    analyticsVisits: `${ADMIN}/analytics/visits/`,

    // helpdesk (مركز المساعدة)
    helpdeskSessions: `${ADMIN}/helpdesk/sessions/`,
    helpdeskSession: (id: Id) => `${ADMIN}/helpdesk/sessions/${id}/`,
    helpdeskSessionMessages: (id: Id) => `${ADMIN}/helpdesk/sessions/${id}/messages/`,
    helpdeskReply: (id: Id) => `${ADMIN}/helpdesk/sessions/${id}/reply/`,
    helpdeskResolve: (id: Id) => `${ADMIN}/helpdesk/sessions/${id}/resolve/`,
    helpdeskClose: (id: Id) => `${ADMIN}/helpdesk/sessions/${id}/close/`,
    helpdeskFlowNodes: `${ADMIN}/helpdesk/flow-nodes/`,
  },
} as const;

export type Endpoints = typeof endpoints;
