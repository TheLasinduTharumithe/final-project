// Purpose: Rule-based and Gemini-backed chatbot service for EcoPlate support answers.
import { detectChatIntent, type ChatIntent, isDatabaseIntent } from "@/lib/chat-intents";
import { detectChatLanguage, localizeChatMessage, type ChatLanguageMode } from "@/lib/chat-language";
import {
  formatAdFacts,
  formatAdminStatsFacts,
  formatDonationDetailFact,
  formatDonationFacts,
  formatProfileFacts,
  formatRequestFacts,
  formatRoleRestriction
} from "@/lib/chat-format";
import { getGeminiDatabaseReply, getGeminiReplyForLanguage } from "@/lib/gemini";
import type { Ad, AppUser, Donation, DonationRequest } from "@/types";

interface ResolvedChatUser {
  idToken: string | null;
  profile: AppUser | null;
}

type RestrictionKey =
  | "signed_in"
  | "admin_only"
  | "restaurant_donations_only"
  | "restaurant_ads_only"
  | "restaurant_requests_only"
  | "charity_requests_only"
  | "charity_donations_only";

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
};

type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
  nullValue?: null;
};

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const firestoreBaseUrl = projectId
  ? `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
  : "";

const adminOnlyIntents = new Set<ChatIntent>([
  "admin_stats",
  "admin_monthly_report",
  "admin_pending_approvals",
  "admin_pending_ads",
  "admin_donations_this_month",
  "admin_total_requests",
  "admin_completed_donations",
  "admin_top_restaurant",
  "admin_top_charity"
]);

const restaurantDonationIntents = new Set<ChatIntent>([
  "my_donations",
  "my_donations_this_month",
  "active_donations",
  "completed_donations",
  "expired_donations",
  "donation_activity_summary",
  "most_requested_donation",
  "meals_donated_this_month"
]);

const charityOnlyIntents = new Set<ChatIntent>([
  "my_requests",
  "my_requests_this_month",
  "charity_activity_summary"
]);

const charityDonationIntents = new Set<ChatIntent>([
  "available_donations_near_me",
  "donations_expiring_today",
  "restaurants_with_available_donations"
]);

// The chatbot reads Firestore through REST so it can run from the API route with an id token.
function ensureFirestoreConfig() {
  if (!projectId || !firestoreBaseUrl) {
    throw new Error("Missing Firebase project configuration for chatbot database access.");
  }
}

function firestoreHeaders(idToken: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${idToken}`
  };
}

function parseFirestoreValue(value?: FirestoreValue): unknown {
  if (!value) {
    return null;
  }

  // Firestore REST wraps each field in a typed value object.
  if (typeof value.stringValue === "string") {
    return value.stringValue;
  }

  if (typeof value.integerValue === "string") {
    return Number(value.integerValue);
  }

  if (typeof value.doubleValue === "number") {
    return value.doubleValue;
  }

  if (typeof value.booleanValue === "boolean") {
    return value.booleanValue;
  }

  if (typeof value.timestampValue === "string") {
    return value.timestampValue;
  }

  if (value.arrayValue) {
    return (value.arrayValue.values || []).map((item) => parseFirestoreValue(item));
  }

  if (value.mapValue) {
    return Object.entries(value.mapValue.fields || {}).reduce<Record<string, unknown>>(
      (result, [key, nested]) => {
        result[key] = parseFirestoreValue(nested);
        return result;
      },
      {}
    );
  }

  return null;
}

function mapFirestoreDocument<T>(document: FirestoreDocument): T {
  const fields = Object.entries(document.fields || {}).reduce<Record<string, unknown>>(
    (result, [key, value]) => {
      result[key] = parseFirestoreValue(value);
      return result;
    },
    {}
  );

  return {
    id: document.name.split("/").pop(),
    ...fields
  } as T;
}

function toFirestoreFieldValue(value: string | number | boolean) {
  if (typeof value === "string") {
    return { stringValue: value };
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }

  return { booleanValue: value };
}

async function getDocumentById<T>(idToken: string, collection: string, documentId: string) {
  ensureFirestoreConfig();

  const response = await fetch(`${firestoreBaseUrl}/${collection}/${documentId}`, {
    headers: firestoreHeaders(idToken),
    cache: "no-store"
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Could not load ${collection} data.`);
  }

  const document = (await response.json()) as FirestoreDocument;
  return mapFirestoreDocument<T>(document);
}

async function listCollection<T>(idToken: string, collection: string, pageSize = 20) {
  ensureFirestoreConfig();

  const url = new URL(`${firestoreBaseUrl}/${collection}`);
  url.searchParams.set("pageSize", String(pageSize));

  const response = await fetch(url.toString(), {
    headers: firestoreHeaders(idToken),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Could not load ${collection} records.`);
  }

  const data = (await response.json()) as { documents?: FirestoreDocument[] };
  return (data.documents || []).map((document) => mapFirestoreDocument<T>(document));
}

async function queryCollection<T>(
  idToken: string,
  collection: string,
  filters: Array<{ field: string; value: string | number | boolean }>,
  limit = 10
) {
  ensureFirestoreConfig();

  const where =
    filters.length === 1
      ? {
          fieldFilter: {
            field: { fieldPath: filters[0].field },
            op: "EQUAL",
            value: toFirestoreFieldValue(filters[0].value)
          }
        }
      : {
          compositeFilter: {
            op: "AND",
            filters: filters.map((filter) => ({
              fieldFilter: {
                field: { fieldPath: filter.field },
                op: "EQUAL",
                value: toFirestoreFieldValue(filter.value)
              }
            }))
          }
        };

  const response = await fetch(`${firestoreBaseUrl}:runQuery`, {
    method: "POST",
    headers: firestoreHeaders(idToken),
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collection }],
        where,
        limit
      }
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Could not query ${collection} records.`);
  }

  const rows = (await response.json()) as Array<{ document?: FirestoreDocument }>;
  return rows
    .map((row) => row.document)
    .filter(Boolean)
    .map((document) => mapFirestoreDocument<T>(document as FirestoreDocument));
}

function sortByNewest<T extends { createdAt?: string }>(items: T[]) {
  return [...items].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

function monthWindow(reference = new Date()) {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 1);
  return { start, end };
}

function monthLabel(reference = new Date()) {
  return reference.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function parseDate(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isThisMonth(value?: string) {
  const date = parseDate(value);

  if (!date) {
    return false;
  }

  const { start, end } = monthWindow();
  return date >= start && date < end;
}

function isToday(value?: string) {
  const date = parseDate(value);

  if (!date) {
    return false;
  }

  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isExpiredDonation(donation: Donation) {
  const expiresAt = parseDate(donation.expiresAt || donation.expiryDate);
  return donation.status === "expired" || Boolean(expiresAt && expiresAt.getTime() < Date.now());
}

function isActiveDonation(donation: Donation) {
  return donation.status === "available" && !isExpiredDonation(donation);
}

function donationQuantity(donation: Donation) {
  if (typeof donation.totalQuantity === "number" && donation.totalQuantity > 0) {
    return donation.totalQuantity;
  }

  const parsedQuantity = Number(donation.quantity);

  if (Number.isFinite(parsedQuantity)) {
    return parsedQuantity;
  }

  const match = donation.quantity?.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function summarizeDonationStatuses(donations: Donation[]) {
  return [
    `Available donations: ${donations.filter((item) => item.status === "available").length}`,
    `Completed donations: ${donations.filter((item) => item.status === "completed").length}`,
    `Expired donations: ${donations.filter((item) => isExpiredDonation(item)).length}`,
    `Cancelled donations: ${donations.filter((item) => item.status === "cancelled").length}`
  ].join("\n");
}

function summarizeRequestStatuses(requests: DonationRequest[]) {
  return [
    `Pending requests: ${requests.filter((item) => item.status === "pending").length}`,
    `Approved requests: ${requests.filter((item) => item.status === "approved").length}`,
    `Rejected requests: ${requests.filter((item) => item.status === "rejected").length}`
  ].join("\n");
}

function formatLines(label: string, lines: string[]) {
  return [`${label}:`, lines.length ? lines.join("\n") : "- None"].join("\n");
}

function buildDonationNameMap(donations: Donation[]) {
  return new Map(donations.map((donation) => [donation.id, donation.foodName]));
}

function formatRequestsWithDonationNames(
  label: string,
  requests: DonationRequest[],
  donations: Donation[],
  totalLabel = "Total requests"
) {
  const donationNames = buildDonationNameMap(donations);
  const lines = requests.slice(0, 8).map((request, index) => {
    const donationName = donationNames.get(request.donationId) || request.donationId;
    return `${index + 1}. ${donationName} - ${request.status} - requested quantity ${request.requestedQuantity || 0} - ${request.charityName || request.charityId}`;
  });

  return [`${totalLabel}: ${requests.length}`, ...formatLines(label, lines).split("\n")].join("\n");
}

async function verifyIdToken(idToken: string) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!apiKey) {
    throw new Error("Missing Firebase API key for chat authentication.");
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ idToken }),
      cache: "no-store"
    }
  );

  if (!response.ok) {
    return null;
  }

  // A successful lookup returns the Firebase uid for the current id token.
  const data = (await response.json()) as { users?: Array<{ localId?: string }> };
  return data.users?.[0]?.localId || null;
}

export async function resolveChatUser(idToken?: string): Promise<ResolvedChatUser> {
  if (!idToken) {
    return { idToken: null, profile: null };
  }

  const uid = await verifyIdToken(idToken);

  if (!uid) {
    return { idToken: null, profile: null };
  }

  const profile = await getDocumentById<AppUser>(idToken, "users", uid);
  return {
    idToken,
    profile
  };
}

function roleRestriction(intent: ChatIntent, user: AppUser | null) {
  // Database-backed answers are gated by the same role boundaries as the app pages.
  if (!user) {
    return { key: "signed_in" as const };
  }

  if (adminOnlyIntents.has(intent) && user.role !== "admin") {
    return { key: "admin_only" as const };
  }

  if (restaurantDonationIntents.has(intent) && user.role !== "restaurant") {
    return { key: "restaurant_donations_only" as const };
  }

  if (intent === "my_ads" && user.role !== "restaurant") {
    return { key: "restaurant_ads_only" as const };
  }

  if (intent === "requests_for_my_donations" && user.role !== "restaurant") {
    return { key: "restaurant_requests_only" as const };
  }

  if (charityOnlyIntents.has(intent) && user.role !== "charity") {
    return { key: "charity_requests_only" as const };
  }

  if (charityDonationIntents.has(intent) && user.role !== "charity") {
    return { key: "charity_donations_only" as const };
  }

  return null;
}

function localizeRestriction(restriction: { key: RestrictionKey } | null, languageMode: ChatLanguageMode) {
  if (!restriction) {
    return null;
  }

  const permissionMessage = "I'm sorry, but you do not have permission to access that information.";

  switch (restriction.key) {
    case "signed_in":
      return localizeChatMessage(languageMode, {
        english: formatRoleRestriction("signed_in"),
        sinhala: "This answer needs a signed-in EcoPlate account.",
        mixed: "This answer needs a signed-in EcoPlate account."
      });
    case "admin_only":
      return localizeChatMessage(languageMode, {
        english: `${permissionMessage} This query is available only to admin accounts.`,
        sinhala: `${permissionMessage} This query is available only to admin accounts.`,
        mixed: `${permissionMessage} This query is available only to admin accounts.`
      });
    case "restaurant_donations_only":
      return localizeChatMessage(languageMode, {
        english: `${permissionMessage} This donation activity query is available only to restaurant accounts.`,
        sinhala: `${permissionMessage} This donation activity query is available only to restaurant accounts.`,
        mixed: `${permissionMessage} This donation activity query is available only to restaurant accounts.`
      });
    case "restaurant_ads_only":
      return localizeChatMessage(languageMode, {
        english: `${permissionMessage} This ad query is available only to restaurant accounts.`,
        sinhala: `${permissionMessage} This ad query is available only to restaurant accounts.`,
        mixed: `${permissionMessage} This ad query is available only to restaurant accounts.`
      });
    case "restaurant_requests_only":
      return localizeChatMessage(languageMode, {
        english: `${permissionMessage} Incoming donation requests are available only to restaurant accounts.`,
        sinhala: `${permissionMessage} Incoming donation requests are available only to restaurant accounts.`,
        mixed: `${permissionMessage} Incoming donation requests are available only to restaurant accounts.`
      });
    case "charity_requests_only":
      return localizeChatMessage(languageMode, {
        english: `${permissionMessage} This pickup request query is available only to charity accounts.`,
        sinhala: `${permissionMessage} This pickup request query is available only to charity accounts.`,
        mixed: `${permissionMessage} This pickup request query is available only to charity accounts.`
      });
    case "charity_donations_only":
      return localizeChatMessage(languageMode, {
        english: `${permissionMessage} This available-food query is available only to charity accounts.`,
        sinhala: `${permissionMessage} This available-food query is available only to charity accounts.`,
        mixed: `${permissionMessage} This available-food query is available only to charity accounts.`
      });
  }
}

async function getRestaurantDonations(idToken: string, restaurantId: string, limit = 50) {
  return sortByNewest(
    await queryCollection<Donation>(
      idToken,
      "donations",
      [{ field: "restaurantId", value: restaurantId }],
      limit
    )
  );
}

async function getRestaurantRequests(idToken: string, restaurantId: string, limit = 50) {
  const requests = await queryCollection<DonationRequest>(
    idToken,
    "requests",
    [{ field: "restaurantId", value: restaurantId }],
    limit
  );

  return sortByNewest(requests);
}

async function getCharityRequests(idToken: string, charityId: string, limit = 50) {
  const requests = await queryCollection<DonationRequest>(
    idToken,
    "requests",
    [{ field: "charityId", value: charityId }],
    limit
  );

  return sortByNewest(requests);
}

async function getAvailableDonations(idToken: string, limit = 50) {
  const donations = await queryCollection<Donation>(
    idToken,
    "donations",
    [{ field: "status", value: "available" }],
    limit
  );

  return sortByNewest(donations).filter((donation) => !isExpiredDonation(donation));
}

async function getAdminDataset(idToken: string) {
  const [users, donations, requests, ads] = await Promise.all([
    listCollection<AppUser>(idToken, "users", 200),
    listCollection<Donation>(idToken, "donations", 200),
    listCollection<DonationRequest>(idToken, "requests", 200),
    listCollection<Ad>(idToken, "ads", 200)
  ]);

  return {
    users,
    donations: sortByNewest(donations),
    requests: sortByNewest(requests),
    ads: sortByNewest(ads)
  };
}

function formatTopRestaurant(donations: Donation[], users: AppUser[]) {
  const names = new Map(users.map((user) => [user.id, user.name]));
  const totals = new Map<string, { count: number; meals: number }>();

  for (const donation of donations) {
    const current = totals.get(donation.restaurantId) || { count: 0, meals: 0 };
    totals.set(donation.restaurantId, {
      count: current.count + 1,
      meals: current.meals + donationQuantity(donation)
    });
  }

  const top = [...totals.entries()].sort((a, b) => b[1].meals - a[1].meals || b[1].count - a[1].count)[0];

  if (!top) {
    return "Top restaurant by donated food: No donation data.";
  }

  return [
    `Top restaurant by donated food: ${names.get(top[0]) || top[0]}`,
    `Estimated meals/units donated: ${top[1].meals}`,
    `Donation records: ${top[1].count}`
  ].join("\n");
}

function formatTopCharity(requests: DonationRequest[], users: AppUser[]) {
  const names = new Map(users.map((user) => [user.id, user.name]));
  const totals = new Map<string, { approvedRequests: number; quantity: number }>();

  for (const request of requests.filter((item) => item.status === "approved")) {
    const current = totals.get(request.charityId) || { approvedRequests: 0, quantity: 0 };
    totals.set(request.charityId, {
      approvedRequests: current.approvedRequests + 1,
      quantity: current.quantity + (Number(request.requestedQuantity) || 0)
    });
  }

  const top = [...totals.entries()].sort(
    (a, b) => b[1].approvedRequests - a[1].approvedRequests || b[1].quantity - a[1].quantity
  )[0];

  if (!top) {
    return "Top charity by received donations: No approved pickup data.";
  }

  return [
    `Top charity by received donations: ${names.get(top[0]) || top[0]}`,
    `Approved pickups: ${top[1].approvedRequests}`,
    `Requested quantity received: ${top[1].quantity}`
  ].join("\n");
}

function formatAdminDatasetFacts(input: Awaited<ReturnType<typeof getAdminDataset>>) {
  const donationsThisMonth = input.donations.filter((item) => isThisMonth(item.createdAt));

  return [
    formatAdminStatsFacts({
      totalUsers: input.users.length,
      totalRestaurants: input.users.filter((item) => item.role === "restaurant").length,
      totalCharities: input.users.filter((item) => item.role === "charity").length,
      totalDonations: input.donations.length,
      totalRequests: input.requests.length,
      totalAds: input.ads.length
    }),
    `Pending approvals: ${input.users.filter((item) => item.approvalStatus === "pending").length}`,
    `Pending advertisements: ${input.ads.filter((item) => item.status === "pending").length}`,
    `Total donations this month (${monthLabel()}): ${donationsThisMonth.length}`,
    `Completed donations: ${input.donations.filter((item) => item.status === "completed").length}`,
    summarizeRequestStatuses(input.requests),
    formatTopRestaurant(input.donations, input.users),
    formatTopCharity(input.requests, input.users)
  ].join("\n");
}

async function buildDatabaseFacts(
  intent: ChatIntent,
  user: AppUser,
  idToken: string,
  message: string,
  foodName?: string
) {
  // Build plain facts first, then let Gemini turn them into a conversational answer.
  switch (intent) {
    case "my_role":
      return `Current user role: ${user.role}`;
    case "my_profile":
      return formatProfileFacts(user);
    case "my_phone":
      return `Current user phone number: ${user.phone || "Not set"}`;
    case "my_address":
      return `Current user address: ${user.address || "Not set"}`;
    case "available_donations": {
      const donations = await getAvailableDonations(idToken, 20);
      return formatDonationFacts("Available donations", donations, {
        totalLabel: "Total available donations"
      });
    }
    case "available_donations_near_me": {
      const donations = await getAvailableDonations(idToken, 30);
      const locationText = (user.address || "").toLowerCase();
      const locationMatches = locationText
        ? donations.filter((donation) =>
            `${donation.pickupLocation} ${donation.locationText || ""}`.toLowerCase().includes(locationText)
          )
        : [];
      const visibleDonations = locationMatches.length ? locationMatches : donations;

      return [
        `Current charity address: ${user.address || "Not set"}`,
        locationMatches.length
          ? "Nearby match method: pickup location text matched the charity profile address."
          : "Nearby match method: exact distance is unavailable because charity coordinates are not stored; showing currently available donations instead.",
        formatDonationFacts("Available food opportunities", visibleDonations, {
          totalLabel: "Total available donations considered",
          limit: 8
        })
      ].join("\n");
    }
    case "my_donations": {
      const donations = await getRestaurantDonations(idToken, user.id, 20);
      return formatDonationFacts("My posted donations", donations, {
        totalLabel: "Total my donations"
      });
    }
    case "my_donations_this_month": {
      const donations = await getRestaurantDonations(idToken, user.id, 50);
      const thisMonth = donations.filter((item) => isThisMonth(item.createdAt));
      return [
        `Donation Summary - ${monthLabel()}`,
        `Donations created this month: ${thisMonth.length}`,
        summarizeDonationStatuses(thisMonth),
        formatDonationFacts("This month's donations", thisMonth, { limit: 8 })
      ].join("\n");
    }
    case "active_donations": {
      const donations = (await getRestaurantDonations(idToken, user.id, 50)).filter(isActiveDonation);
      return formatDonationFacts("My active donations", donations, {
        totalLabel: "Total active donations",
        limit: 8
      });
    }
    case "completed_donations": {
      const donations =
        user.role === "restaurant"
          ? (await getRestaurantDonations(idToken, user.id, 50)).filter((item) => item.status === "completed")
          : user.role === "admin"
            ? sortByNewest(
                await queryCollection<Donation>(
                  idToken,
                  "donations",
                  [{ field: "status", value: "completed" }],
                  50
                )
              )
            : [];

      return formatDonationFacts("Completed donations", donations, {
        totalLabel: "Total completed donations",
        limit: 8
      });
    }
    case "expired_donations": {
      const donations = (await getRestaurantDonations(idToken, user.id, 50)).filter(isExpiredDonation);
      return formatDonationFacts("Expired donations", donations, {
        totalLabel: "Total expired donations",
        limit: 8
      });
    }
    case "donation_activity_summary": {
      const [donations, requests] = await Promise.all([
        getRestaurantDonations(idToken, user.id, 50),
        getRestaurantRequests(idToken, user.id, 50)
      ]);
      const thisMonth = donations.filter((item) => isThisMonth(item.createdAt));

      return [
        `Donation Activity Summary - ${monthLabel()}`,
        `Total donations: ${donations.length}`,
        `Donations created this month: ${thisMonth.length}`,
        `Estimated meals/units donated this month: ${thisMonth.reduce((sum, item) => sum + donationQuantity(item), 0)}`,
        summarizeDonationStatuses(donations),
        summarizeRequestStatuses(requests),
        formatRequestsWithDonationNames("Recent pickup requests", requests, donations, "Total incoming pickup requests")
      ].join("\n");
    }
    case "most_requested_donation": {
      const [donations, requests] = await Promise.all([
        getRestaurantDonations(idToken, user.id, 50),
        getRestaurantRequests(idToken, user.id, 100)
      ]);
      const donationNames = buildDonationNameMap(donations);
      const counts = new Map<string, { requestCount: number; quantity: number }>();

      for (const request of requests) {
        const current = counts.get(request.donationId) || { requestCount: 0, quantity: 0 };
        counts.set(request.donationId, {
          requestCount: current.requestCount + 1,
          quantity: current.quantity + (Number(request.requestedQuantity) || 0)
        });
      }

      const top = [...counts.entries()].sort(
        (a, b) => b[1].requestCount - a[1].requestCount || b[1].quantity - a[1].quantity
      )[0];

      return top
        ? [
            `Most requested donation: ${donationNames.get(top[0]) || top[0]}`,
            `Pickup requests received: ${top[1].requestCount}`,
            `Requested quantity: ${top[1].quantity}`
          ].join("\n")
        : "Most requested donation: No pickup requests found for your donations.";
    }
    case "meals_donated_this_month": {
      const donations = await getRestaurantDonations(idToken, user.id, 50);
      const thisMonth = donations.filter((item) => isThisMonth(item.createdAt));
      const estimatedMeals = thisMonth.reduce((sum, item) => sum + donationQuantity(item), 0);

      return [
        `Meal Estimate - ${monthLabel()}`,
        `Donations created this month: ${thisMonth.length}`,
        `Estimated meals/units donated this month: ${estimatedMeals}`,
        "Estimation method: sums each donation totalQuantity, or the numeric part of quantity when totalQuantity is unavailable."
      ].join("\n");
    }
    case "latest_donations": {
      const donations =
        user.role === "restaurant"
          ? (await getRestaurantDonations(idToken, user.id, 10)).slice(0, 5)
          : user.role === "charity"
            ? (await getAvailableDonations(idToken, 10)).slice(0, 5)
            : sortByNewest(await listCollection<Donation>(idToken, "donations", 10)).slice(0, 5);

      return formatDonationFacts("Latest donations", donations, {
        totalLabel: "Total latest donations shown",
        limit: 5
      });
    }
    case "donation_details": {
      const candidateDonations =
        user.role === "restaurant"
          ? await getRestaurantDonations(idToken, user.id, 50)
          : user.role === "charity"
            ? await getAvailableDonations(idToken, 50)
            : await listCollection<Donation>(idToken, "donations", 50);

      const donation =
        candidateDonations.find((item) =>
          item.foodName.toLowerCase().includes((foodName || "").toLowerCase())
        ) || null;

      return formatDonationDetailFact(donation);
    }
    case "donations_with_images": {
      const candidateDonations =
        user.role === "restaurant"
          ? await getRestaurantDonations(idToken, user.id, 50)
          : user.role === "charity"
            ? await getAvailableDonations(idToken, 50)
            : await listCollection<Donation>(idToken, "donations", 50);
      const donations = candidateDonations.filter((item) => Boolean(item.image64));

      return formatDonationFacts("Donations with images", donations, {
        totalLabel: "Total donations with images"
      });
    }
    case "donations_with_location": {
      const candidateDonations =
        user.role === "restaurant"
          ? await getRestaurantDonations(idToken, user.id, 50)
          : user.role === "charity"
            ? await getAvailableDonations(idToken, 50)
            : await listCollection<Donation>(idToken, "donations", 50);
      const donations = candidateDonations.filter(
        (item) => typeof item.latitude === "number" && typeof item.longitude === "number"
      );

      return formatDonationFacts("Donations with location data", donations, {
        totalLabel: "Total donations with location data"
      });
    }
    case "donations_expiring_today": {
      const donations = (await getAvailableDonations(idToken, 50)).filter((item) =>
        isToday(item.expiresAt || item.expiryDate)
      );
      return formatDonationFacts("Donations expiring today", donations, {
        totalLabel: "Total donations expiring today",
        limit: 8
      });
    }
    case "restaurants_with_available_donations": {
      const [donations, users] = await Promise.all([
        getAvailableDonations(idToken, 50),
        listCollection<AppUser>(idToken, "users", 100)
      ]);
      const restaurants = new Map(users.filter((item) => item.role === "restaurant").map((item) => [item.id, item.name]));
      const counts = new Map<string, number>();

      for (const donation of donations) {
        counts.set(donation.restaurantId, (counts.get(donation.restaurantId) || 0) + 1);
      }

      const lines = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([restaurantId, count], index) => `${index + 1}. ${restaurants.get(restaurantId) || restaurantId} - ${count} available donations`);

      return [`Restaurants currently offering available donations: ${counts.size}`, formatLines("Restaurants", lines)].join("\n");
    }
    case "pending_requests":
    case "approved_requests":
    case "rejected_requests": {
      const status = intent === "pending_requests" ? "pending" : intent === "approved_requests" ? "approved" : "rejected";
      const requests =
        user.role === "restaurant"
          ? (await getRestaurantRequests(idToken, user.id, 50)).filter((item) => item.status === status)
          : user.role === "charity"
            ? (await getCharityRequests(idToken, user.id, 50)).filter((item) => item.status === status)
            : sortByNewest(
                await queryCollection<DonationRequest>(
                  idToken,
                  "requests",
                  [{ field: "status", value: status }],
                  50
                )
              );
      const donations =
        user.role === "restaurant"
          ? await getRestaurantDonations(idToken, user.id, 50)
          : user.role === "charity"
            ? await getAvailableDonations(idToken, 50)
            : await listCollection<Donation>(idToken, "donations", 100);

      return formatRequestsWithDonationNames(`${status} requests`, requests, donations, `Total ${status} requests`);
    }
    case "my_requests": {
      const requests = await getCharityRequests(idToken, user.id, 50);
      const donations = await getAvailableDonations(idToken, 50);

      return formatRequestsWithDonationNames("My requests", requests, donations, "Total my requests");
    }
    case "my_requests_this_month": {
      const requests = (await getCharityRequests(idToken, user.id, 50)).filter((item) => isThisMonth(item.createdAt));
      const donations = await getAvailableDonations(idToken, 50);

      return [
        `Charity Requests - ${monthLabel()}`,
        `Requests made this month: ${requests.length}`,
        summarizeRequestStatuses(requests),
        formatRequestsWithDonationNames("This month's requests", requests, donations, "Total requests shown")
      ].join("\n");
    }
    case "charity_activity_summary": {
      const [requests, donations] = await Promise.all([
        getCharityRequests(idToken, user.id, 50),
        getAvailableDonations(idToken, 50)
      ]);
      const thisMonth = requests.filter((item) => isThisMonth(item.createdAt));

      return [
        `Charity Activity Summary - ${monthLabel()}`,
        `Total requests made: ${requests.length}`,
        `Requests made this month: ${thisMonth.length}`,
        summarizeRequestStatuses(requests),
        `Currently available donations: ${donations.length}`,
        formatRequestsWithDonationNames("Recent charity requests", requests, donations, "Total recent requests")
      ].join("\n");
    }
    case "requests_for_my_donations": {
      const [requests, donations] = await Promise.all([
        getRestaurantRequests(idToken, user.id, 50),
        getRestaurantDonations(idToken, user.id, 50)
      ]);

      return formatRequestsWithDonationNames("Requests for my donations", requests, donations, "Total requests for my donations");
    }
    case "latest_requests": {
      const requests =
        user.role === "restaurant"
          ? (await getRestaurantRequests(idToken, user.id, 10)).slice(0, 5)
          : user.role === "charity"
            ? (await getCharityRequests(idToken, user.id, 10)).slice(0, 5)
            : sortByNewest(await listCollection<DonationRequest>(idToken, "requests", 10)).slice(0, 5);

      return formatRequestFacts("Latest requests", requests, {
        totalLabel: "Total latest requests shown",
        limit: 5
      });
    }
    case "my_ads": {
      const ads = sortByNewest(
        await queryCollection<Ad>(
          idToken,
          "ads",
          [{ field: "restaurantId", value: user.id }],
          20
        )
      );

      return formatAdFacts("My ads", ads, {
        totalLabel: "Total my ads"
      });
    }
    case "published_ads": {
      const ads = sortByNewest(
        await queryCollection<Ad>(
          idToken,
          "ads",
          [
            { field: "paymentStatus", value: "paid" },
            { field: "status", value: "published" }
          ],
          20
        )
      );

      return formatAdFacts("Published paid ads", ads, {
        totalLabel: "Total published ads"
      });
    }
    case "ads_pending_payment": {
      const ads =
        user.role === "restaurant"
          ? sortByNewest(
              await queryCollection<Ad>(
                idToken,
                "ads",
                [
                  { field: "restaurantId", value: user.id },
                  { field: "paymentStatus", value: "pending" }
                ],
                20
              )
            )
          : sortByNewest(
              await queryCollection<Ad>(
                idToken,
                "ads",
                [{ field: "paymentStatus", value: "pending" }],
                20
              )
            );

      return formatAdFacts("Ads pending payment", ads, {
        totalLabel: "Total ads pending payment"
      });
    }
    case "approved_ads": {
      const ads =
        user.role === "restaurant"
          ? sortByNewest(
              await queryCollection<Ad>(
                idToken,
                "ads",
                [
                  { field: "restaurantId", value: user.id },
                  { field: "status", value: "approved" }
                ],
                20
              )
            )
          : sortByNewest(
              await queryCollection<Ad>(
                idToken,
                "ads",
                [{ field: "status", value: "approved" }],
                20
              )
            );

      return formatAdFacts("Approved ads", ads, {
        totalLabel: "Total approved ads"
      });
    }
    case "admin_stats":
    case "admin_monthly_report": {
      const dataset = await getAdminDataset(idToken);
      return formatAdminDatasetFacts(dataset);
    }
    case "admin_pending_approvals": {
      const { users } = await getAdminDataset(idToken);
      const pending = users.filter((item) => item.approvalStatus === "pending");
      const lines = pending
        .slice(0, 8)
        .map((item, index) => `${index + 1}. ${item.name} - ${item.role} - ${item.email}`);
      return [`Pending approvals: ${pending.length}`, formatLines("Pending users", lines)].join("\n");
    }
    case "admin_pending_ads": {
      const { ads } = await getAdminDataset(idToken);
      const pending = ads.filter((item) => item.status === "pending");
      return formatAdFacts("Pending advertisements", pending, {
        totalLabel: "Total pending advertisements",
        limit: 8
      });
    }
    case "admin_donations_this_month": {
      const { donations } = await getAdminDataset(idToken);
      const thisMonth = donations.filter((item) => isThisMonth(item.createdAt));
      return [
        `Total donations this month (${monthLabel()}): ${thisMonth.length}`,
        `Estimated meals/units posted this month: ${thisMonth.reduce((sum, item) => sum + donationQuantity(item), 0)}`,
        summarizeDonationStatuses(thisMonth)
      ].join("\n");
    }
    case "admin_total_requests": {
      const { requests } = await getAdminDataset(idToken);
      return [`Total pickup requests: ${requests.length}`, summarizeRequestStatuses(requests)].join("\n");
    }
    case "admin_completed_donations": {
      const { donations } = await getAdminDataset(idToken);
      const completed = donations.filter((item) => item.status === "completed");
      return formatDonationFacts("Completed donations", completed, {
        totalLabel: "Total completed donations",
        limit: 8
      });
    }
    case "admin_top_restaurant": {
      const { donations, users } = await getAdminDataset(idToken);
      return formatTopRestaurant(donations, users);
    }
    case "admin_top_charity": {
      const { requests, users } = await getAdminDataset(idToken);
      return formatTopCharity(requests, users);
    }
    default:
      return `User question: ${message}`;
  }
}

export async function getChatbotAnswer(input: {
  message: string;
  profile: AppUser | null;
  idToken: string | null;
}) {
  const languageMode = detectChatLanguage(input.message);
  const detected = detectChatIntent(input.message, input.profile?.role);

  // General questions go straight to Gemini; data questions first gather Firestore facts.
  if (!isDatabaseIntent(detected.intent)) {
    return getGeminiReplyForLanguage({
      message: input.message,
      languageMode
    });
  }

  const restriction = roleRestriction(detected.intent, input.profile);
  const localizedRestriction = localizeRestriction(restriction, languageMode);

  if (localizedRestriction) {
    return localizedRestriction;
  }

  const facts = await buildDatabaseFacts(
    detected.intent,
    input.profile as AppUser,
    input.idToken as string,
    input.message,
    detected.foodName
  );

  return getGeminiDatabaseReply({
    question: input.message,
    facts,
    languageMode
  });
}
