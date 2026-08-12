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
  properties: "/properties/",
  property: (id: Id) => `/properties/${id}/`,
  similarProperties: (id: Id) => `/properties/${id}/similar/`,
  // الطلبات المطابقة لعقار — لمالكه (الاتجاه المعاكس للمطابقة).
  propertyMatchingRequests: (id: Id) => `/properties/${id}/matching-requests/`,
  propertiesMap: "/properties/map/",
  propertyTypes: "/properties/property-types/",
  neighborhoods: "/cities/neighborhoods/",
  bumpProperty: (id: Id) => `/properties/${id}/bump/`,
  // «نعم، ما زال متاحًا» — الردّ المباشر على تذكير الانتهاء.
  confirmPropertyAvailability: (id: Id) => `/properties/${id}/confirm-availability/`,
  propertyStatus: (id: Id) => `/properties/${id}/status/`,
  savedSearches: "/properties/saved-searches/",
  savedSearch: (id: Id) => `/properties/saved-searches/${id}/`,
  services: "/services/",
  service: (id: Id) => `/services/${id}/`,
  serviceCategories: "/services/categories/",
  requests: "/requests/",
  request: (id: Id) => `/requests/${id}/`,
  requestMatches: (id: Id) => `/requests/${id}/matches/`,
  jobs: "/jobs/",
  job: (id: Id) => `/jobs/${id}/`,
  jobMatches: (id: Id) => `/jobs/${id}/matches/`,
  reports: "/reports/",
  report: (id: Id) => `/reports/${id}/`,

  // ── عام: AI + تتبّع + إعدادات ──
  aiSuggestDescription: "/ai/suggest-description/",
  aiImproveText: "/ai/improve-text/",
  aiSearchFilters: "/ai/search-filters/",
  aiChatSuggestions: "/ai/chat-suggestions/",
  aiAskProperty: "/ai/ask-property/",
  aiHelpdeskAnswer: "/ai/helpdesk-answer/",
  analyticsTrack: "/analytics/track/",
  appConfig: "/settings/app-config/",

  // ── helpdesk (محرّك الفلو الشبكي — العميل) ──
  helpdeskStart: "/helpdesk/session/",
  helpdeskSession: (id: Id) => `/helpdesk/session/${id}/`,
  helpdeskEvent: (id: Id) => `/helpdesk/session/${id}/event/`,
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
    seoReport: `${ADMIN}/dashboard/seo-report/`,
    // blog
    blog: `${ADMIN}/blog/`,
    blogItem: (id: number) => `${ADMIN}/blog/${id}/`,
    blogCategories: `${ADMIN}/blog/categories/`,
    blogCategoryItem: (id: number) => `${ADMIN}/blog/categories/${id}/`,
    blogGenerate: `${ADMIN}/blog/generate/`,
    // الذكاء الاصطناعي (مفاتيح OpenRouter)
    aiKeys: `${ADMIN}/ai/keys/`,
    aiKey: (id: number) => `${ADMIN}/ai/keys/${id}/`,
    aiKeySetActive: (id: number) => `${ADMIN}/ai/keys/${id}/set-active/`,
    aiKeyUsage: (id: number) => `${ADMIN}/ai/keys/${id}/usage/`,
    aiUsage: `${ADMIN}/ai/keys/usage/`,
    aiProviders: `${ADMIN}/ai/providers/`,
    aiProvider: (id: number) => `${ADMIN}/ai/providers/${id}/`,
    notificationTemplates: `${ADMIN}/notifications/templates/`,
    notificationTemplate: (id: Id) => `${ADMIN}/notifications/templates/${id}/`,

    // accounts
    users: `${ADMIN}/accounts/users/`,
    user: (id: Id) => `${ADMIN}/accounts/users/${id}/`,
    verificationRequests: `${ADMIN}/accounts/verification-requests/`,
    verificationRequest: (id: Id) => `${ADMIN}/accounts/verification-requests/${id}/`,

    // properties
    properties: `${ADMIN}/properties/`,
    property: (id: Id) => `${ADMIN}/properties/${id}/`,
    propertyTypes: `${ADMIN}/properties/property-types/`,
    propertyType: (id: Id) => `${ADMIN}/properties/property-types/${id}/`,

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
    analyticsFunnel: `${ADMIN}/analytics/funnel/`,
    analyticsRealtime: `${ADMIN}/analytics/realtime/`,
    analyticsRetention: `${ADMIN}/analytics/retention/`,
    analyticsVisits: `${ADMIN}/analytics/visits/`,
    analyticsVisitsExport: `${ADMIN}/analytics/visits/export/`,

    // helpdesk (محرّك الفلو الشبكي — الإدارة)
    helpdeskGraph: `${ADMIN}/helpdesk/graph/`,
    helpdeskActions: `${ADMIN}/helpdesk/actions/`,
    helpdeskAction: (id: Id) => `${ADMIN}/helpdesk/actions/${id}/`,
    helpdeskActionTest: (id: Id) => `${ADMIN}/helpdesk/actions/${id}/test/`,
    helpdeskSessions: `${ADMIN}/helpdesk/sessions/`,
    helpdeskSessionMessages: (id: Id) => `${ADMIN}/helpdesk/sessions/${id}/messages/`,
    helpdeskReply: (id: Id) => `${ADMIN}/helpdesk/sessions/${id}/reply/`,
    helpdeskClose: (id: Id) => `${ADMIN}/helpdesk/sessions/${id}/close/`,
  },
} as const;

export type Endpoints = typeof endpoints;
