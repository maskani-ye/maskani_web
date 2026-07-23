// ─── Google Identity Services (GIS) — تعريفات الأنواع ──────────────────────
// https://developers.google.com/identity/gsi/web/reference/js-reference

interface GsiCredentialResponse {
  credential: string; // هو الـ id_token (JWT) — يُرسل مباشرةً كـ id_token
  select_by?: string;
}

interface GsiInitializeConfig {
  client_id: string;
  callback: (response: GsiCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  ux_mode?: "popup" | "redirect";
  use_fedcm_for_prompt?: boolean;
}

interface GsiButtonConfig {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number | string;
  locale?: string;
}

interface GsiIdApi {
  initialize: (config: GsiInitializeConfig) => void;
  renderButton: (parent: HTMLElement, options: GsiButtonConfig) => void;
  prompt: (
    listener?: (notification: {
      isNotDisplayed: () => boolean;
      isSkippedMoment: () => boolean;
    }) => void
  ) => void;
  cancel: () => void;
  disableAutoSelect: () => void;
}

interface Window {
  google?: {
    accounts: {
      id: GsiIdApi;
    };
  };
}
