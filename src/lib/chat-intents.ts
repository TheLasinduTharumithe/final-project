import type { UserRole } from "@/types";

export type ChatIntent =
  | "my_role"
  | "my_profile"
  | "my_phone"
  | "my_address"
  | "available_donations"
  | "my_donations"
  | "completed_donations"
  | "latest_donations"
  | "donation_details"
  | "donations_with_images"
  | "donations_with_location"
  | "pending_requests"
  | "approved_requests"
  | "my_requests"
  | "requests_for_my_donations"
  | "latest_requests"
  | "my_ads"
  | "published_ads"
  | "ads_pending_payment"
  | "approved_ads"
  | "admin_stats"
  | "general_help";

export interface ChatIntentResult {
  intent: ChatIntent;
  foodName?: string;
}

function normalizeMessage(message: string) {
  return message.toLowerCase().replace(/\s+/g, " ").trim();
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function extractFoodName(text: string) {
  const patterns = [
    /donation has ([a-z0-9\s-]+)/i,
    /donation named ([a-z0-9\s-]+)/i,
    /donation details(?: for)? ([a-z0-9\s-]+)/i,
    /which donation has ([a-z0-9\s-]+)/i,
    /donation eke ([a-z0-9\s-]+)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

export function isDatabaseIntent(intent: ChatIntent) {
  return intent !== "general_help";
}

export function detectChatIntent(message: string, role?: UserRole | null): ChatIntentResult {
  const text = normalizeMessage(message);
  const foodName = extractFoodName(text);

  if (
    includesAny(text, [
      "what is my role",
      "my profile role",
      "show my role",
      "මගේ role",
      "මගේ role එක",
      "role eka mokakda",
      "mama charity da restaurant da"
    ])
  ) {
    return { intent: "my_role" };
  }

  if (
    includesAny(text, [
      "show my profile",
      "my profile details",
      "profile details",
      "මගේ profile",
      "මගේ විස්තර",
      "mage profile pennanna"
    ])
  ) {
    return { intent: "my_profile" };
  }

  if (includesAny(text, ["my phone", "phone number", "මගේ phone", "දුරකථන", "phone eka"])) {
    return { intent: "my_phone" };
  }

  if (
    includesAny(text, [
      "my address",
      "what is my address",
      "show my address",
      "මගේ address",
      "ලිපිනය",
      "address eka"
    ])
  ) {
    return { intent: "my_address" };
  }

  if (
    includesAny(text, [
      "how many users",
      "how many restaurants",
        "how many charities",
        "total donations",
        "total requests",
        "total ads",
        "users in the system",
        "system eke users",
        "users කීයද",
        "restaurants කීයද",
        "charities කීයද"
      ])
  ) {
    return { intent: "admin_stats" };
  }

  if (includesAny(text, ["show my ads", "my ads", "මගේ ads", "mage ads pennanna"])) {
    return { intent: "my_ads" };
  }

  if (
    includesAny(text, [
      "which ads are pending payment",
      "pending payment ads",
      "pending payment ads monawada",
      "payment pending ads"
    ])
  ) {
    return { intent: "ads_pending_payment" };
  }

  if (includesAny(text, ["which ads are approved", "approved ads", "approved ads monawada"])) {
    return { intent: "approved_ads" };
  }

  if (
    includesAny(text, [
      "which ads are published",
      "show published ads",
      "published ads",
      "published ads monawada",
      "published වෙච්ච ads"
    ])
  ) {
    return { intent: "published_ads" };
  }

  if (
    includesAny(text, [
      "show requests for my donations",
      "requests for my donations",
      "mage donations walata requests",
      "මගේ donations වල requests"
    ])
  ) {
    return { intent: "requests_for_my_donations" };
  }

  if (includesAny(text, ["show my requests", "my requests", "මගේ requests", "mage requests"])) {
    return { intent: "my_requests" };
  }

  if (
    includesAny(text, [
      "how many requests are pending",
      "pending requests",
      "pending requests keeyada",
      "pending requests කීයද"
    ])
  ) {
    return { intent: "pending_requests" };
  }

  if (
    includesAny(text, [
      "how many approved requests",
      "approved requests",
      "approved requests කීයද"
    ])
  ) {
    return { intent: "approved_requests" };
  }

  if (includesAny(text, ["latest requests", "show latest requests", "latest requests pennanna"])) {
    return { intent: "latest_requests" };
  }

  if (
    includesAny(text, [
      "what donations have images",
      "donations with images",
      "images තියෙන donations"
    ])
  ) {
    return { intent: "donations_with_images" };
  }

  if (
    includesAny(text, [
      "what donations have location data",
      "donations with location",
      "location තියෙන donations"
    ])
  ) {
    return { intent: "donations_with_location" };
  }

  if (foodName) {
    return { intent: "donation_details", foodName };
  }

  if (
    includesAny(text, [
      "show my donations",
      "my donations",
      "posted donations",
      "මගේ donations",
      "mage donations pennanna"
    ])
  ) {
    return { intent: "my_donations" };
  }

  if (
    includesAny(text, [
      "how many completed donations",
      "completed donations",
      "completed donations කීයද"
    ])
  ) {
    return { intent: "completed_donations" };
  }

  if (includesAny(text, ["show latest donations", "latest donations", "latest donations pennanna"])) {
    return { intent: "latest_donations" };
  }

  if (
    includesAny(text, [
      "how many donations are available",
      "what donations are available",
      "available donations",
      "available donations කීයද",
      "දැනට available donations",
      "donations available da"
    ])
  ) {
    return { intent: "available_donations" };
  }

  if (role === "restaurant" && includesAny(text, ["requests"])) {
    return { intent: "requests_for_my_donations" };
  }

  if (role === "charity" && includesAny(text, ["requests"])) {
    return { intent: "my_requests" };
  }

  return { intent: "general_help" };
}
