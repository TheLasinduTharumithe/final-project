// Purpose: Intent detection helpers that route food-rescue chat questions.
import type { UserRole } from "@/types";

export type ChatIntent =
  | "my_role"
  | "my_profile"
  | "my_phone"
  | "my_address"
  | "available_donations"
  | "available_donations_near_me"
  | "my_donations"
  | "my_donations_this_month"
  | "active_donations"
  | "completed_donations"
  | "expired_donations"
  | "donation_activity_summary"
  | "most_requested_donation"
  | "meals_donated_this_month"
  | "latest_donations"
  | "donation_details"
  | "donations_with_images"
  | "donations_with_location"
  | "pending_requests"
  | "approved_requests"
  | "rejected_requests"
  | "my_requests_this_month"
  | "donations_expiring_today"
  | "restaurants_with_available_donations"
  | "charity_activity_summary"
  | "my_requests"
  | "requests_for_my_donations"
  | "latest_requests"
  | "my_ads"
  | "published_ads"
  | "ads_pending_payment"
  | "approved_ads"
  | "admin_stats"
  | "admin_monthly_report"
  | "admin_pending_approvals"
  | "admin_pending_ads"
  | "admin_donations_this_month"
  | "admin_total_requests"
  | "admin_completed_donations"
  | "admin_top_restaurant"
  | "admin_top_charity"
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

function detectAdminIntent(text: string): ChatIntentResult | null {
  if (
    includesAny(text, [
      "generate monthly platform report",
      "monthly platform report",
      "monthly report",
      "platform report"
    ])
  ) {
    return { intent: "admin_monthly_report" };
  }

  if (
    includesAny(text, [
      "generate platform statistics summary",
      "platform statistics summary",
      "platform stats summary",
      "platform summary"
    ])
  ) {
    return { intent: "admin_stats" };
  }

  if (includesAny(text, ["pending approvals", "show pending approvals", "users pending approval"])) {
    return { intent: "admin_pending_approvals" };
  }

  if (
    includesAny(text, [
      "pending advertisements",
      "pending ads",
      "pending ad",
      "ads pending review",
      "advertisements pending"
    ])
  ) {
    return { intent: "admin_pending_ads" };
  }

  if (
    includesAny(text, [
      "total donations this month",
      "platform donations this month"
    ])
  ) {
    return { intent: "admin_donations_this_month" };
  }

  if (includesAny(text, ["total pickup requests", "all pickup requests"])) {
    return { intent: "admin_total_requests" };
  }

  if (includesAny(text, ["which restaurant donated the most food", "top restaurant", "most food"])) {
    return { intent: "admin_top_restaurant" };
  }

  if (
    includesAny(text, [
      "which charity received the most donations",
      "top charity",
      "charity received the most"
    ])
  ) {
    return { intent: "admin_top_charity" };
  }

  if (
    includesAny(text, [
      "show total users",
      "show total restaurants",
      "show total charities",
      "total users",
      "total restaurants",
      "total charities",
      "how many users",
      "how many restaurants",
      "how many charities",
      "total donations",
      "total ads",
      "users in the system",
      "system eke users"
    ])
  ) {
    return { intent: "admin_stats" };
  }

  return null;
}

function detectProfileIntent(text: string): ChatIntentResult | null {
  if (
    includesAny(text, [
      "what is my role",
      "my profile role",
      "show my role",
      "mage role",
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
      "mage profile pennanna"
    ])
  ) {
    return { intent: "my_profile" };
  }

  if (includesAny(text, ["my phone", "phone number", "phone eka"])) {
    return { intent: "my_phone" };
  }

  if (includesAny(text, ["my address", "what is my address", "show my address", "address eka"])) {
    return { intent: "my_address" };
  }

  return null;
}

function detectAdsIntent(text: string): ChatIntentResult | null {
  if (includesAny(text, ["show my ads", "my ads", "mage ads pennanna"])) {
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
      "published ads monawada"
    ])
  ) {
    return { intent: "published_ads" };
  }

  return null;
}

function detectRequestIntent(text: string, role?: UserRole | null): ChatIntentResult | null {
  if (
    includesAny(text, [
      "show requests for my donations",
      "requests for my donations",
      "pending pickup requests",
      "show pending pickup requests",
      "mage donations walata requests"
    ])
  ) {
    return includesAny(text, ["pending"]) ? { intent: "pending_requests" } : { intent: "requests_for_my_donations" };
  }

  if (
    includesAny(text, [
      "how many requests have i made this month",
      "requests have i made this month",
      "my requests this month"
    ])
  ) {
    return role === "admin" ? { intent: "admin_total_requests" } : { intent: "my_requests_this_month" };
  }

  if (includesAny(text, ["show my approved pickups", "approved pickups", "show approved pickups"])) {
    return { intent: "approved_requests" };
  }

  if (includesAny(text, ["show my pending requests", "my pending requests"])) {
    return { intent: "pending_requests" };
  }

  if (includesAny(text, ["show my rejected requests", "my rejected requests", "rejected requests"])) {
    return { intent: "rejected_requests" };
  }

  if (includesAny(text, ["show my requests", "my requests", "mage requests"])) {
    return { intent: "my_requests" };
  }

  if (includesAny(text, ["pending requests", "pending requests keeyada"])) {
    return { intent: "pending_requests" };
  }

  if (includesAny(text, ["approved requests", "approved requests keeyada"])) {
    return { intent: "approved_requests" };
  }

  if (includesAny(text, ["latest requests", "show latest requests", "latest requests pennanna"])) {
    return { intent: "latest_requests" };
  }

  return null;
}

function detectDonationIntent(text: string, role?: UserRole | null): ChatIntentResult | null {
  if (
    includesAny(text, [
      "how many donations did i create this month",
      "donations did i create this month",
      "my donations this month",
      "created this month"
    ])
  ) {
    return role === "admin" ? { intent: "admin_donations_this_month" } : { intent: "my_donations_this_month" };
  }

  if (
    includesAny(text, [
      "show my active donations",
      "active donations",
      "available donations i created",
      "my active donations"
    ])
  ) {
    return { intent: "active_donations" };
  }

  if (
    includesAny(text, [
      "show my completed donations",
      "show completed donations",
      "completed donations",
      "how many completed donations"
    ])
  ) {
    return role === "admin" ? { intent: "admin_completed_donations" } : { intent: "completed_donations" };
  }

  if (includesAny(text, ["show expired donations", "expired donations", "my expired donations"])) {
    return { intent: "expired_donations" };
  }

  if (
    includesAny(text, [
      "which donation received the most requests",
      "most requested donation",
      "donation received most requests"
    ])
  ) {
    return { intent: "most_requested_donation" };
  }

  if (
    includesAny(text, [
      "how many meals have i donated this month",
      "meals donated this month",
      "estimated meals this month"
    ])
  ) {
    return { intent: "meals_donated_this_month" };
  }

  if (
    includesAny(text, [
      "summary of my donation activity",
      "donation activity summary",
      "my donation activity"
    ])
  ) {
    return { intent: "donation_activity_summary" };
  }

  if (
    includesAny(text, [
      "find available food near my location",
      "available food near me",
      "donations near me",
      "near my location"
    ])
  ) {
    return { intent: "available_donations_near_me" };
  }

  if (includesAny(text, ["show donations expiring today", "donations expiring today", "expiring today"])) {
    return { intent: "donations_expiring_today" };
  }

  if (
    includesAny(text, [
      "which restaurants currently have available donations",
      "restaurants with available donations",
      "restaurants have available donations"
    ])
  ) {
    return { intent: "restaurants_with_available_donations" };
  }

  if (
    includesAny(text, [
      "summary of my charity activity",
      "charity activity summary",
      "my charity activity"
    ])
  ) {
    return { intent: "charity_activity_summary" };
  }

  if (includesAny(text, ["show latest donations", "latest donations", "latest donations pennanna"])) {
    return { intent: "latest_donations" };
  }

  if (
    includesAny(text, [
      "what donations have images",
      "donations with images",
      "donations that have images"
    ])
  ) {
    return { intent: "donations_with_images" };
  }

  if (
    includesAny(text, [
      "what donations have location data",
      "donations with location",
      "donations that have location"
    ])
  ) {
    return { intent: "donations_with_location" };
  }

  if (includesAny(text, ["show my donations", "my donations", "posted donations", "mage donations pennanna"])) {
    return { intent: "my_donations" };
  }

  if (
    includesAny(text, [
      "how many donations are available",
      "what donations are available",
      "available donations",
      "donations available da"
    ])
  ) {
    return { intent: "available_donations" };
  }

  return null;
}

export function detectChatIntent(message: string, role?: UserRole | null): ChatIntentResult {
  const text = normalizeMessage(message);
  const foodName = extractFoodName(text);

  const orderedDetectors = [
    detectAdminIntent(text),
    detectProfileIntent(text),
    detectAdsIntent(text),
    detectRequestIntent(text, role),
    foodName ? { intent: "donation_details" as const, foodName } : null,
    detectDonationIntent(text, role)
  ];

  for (const result of orderedDetectors) {
    if (result) {
      return result;
    }
  }

  if (role === "restaurant" && includesAny(text, ["requests"])) {
    return { intent: "requests_for_my_donations" };
  }

  if (role === "charity" && includesAny(text, ["requests"])) {
    return { intent: "my_requests" };
  }

  return { intent: "general_help" };
}
