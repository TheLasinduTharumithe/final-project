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

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
};

type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  nullValue?: null;
};

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const firestoreBaseUrl = projectId
  ? `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
  : "";

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

  const response = await fetch(`${firestoreBaseUrl}:runQuery`, {
    method: "POST",
    headers: firestoreHeaders(idToken),
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collection }],
        where:
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
              },
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
  if (!user) {
    return { key: "signed_in" as const };
  }

  if (intent === "admin_stats" && user.role !== "admin") {
    return { key: "admin_only" as const };
  }

  if (intent === "my_donations" && user.role !== "restaurant") {
    return { key: "restaurant_donations_only" as const };
  }

  if (intent === "my_ads" && user.role !== "restaurant") {
    return { key: "restaurant_ads_only" as const };
  }

  if (intent === "requests_for_my_donations" && user.role !== "restaurant") {
    return { key: "restaurant_requests_only" as const };
  }

  return null;
}

function localizeRestriction(
  restriction:
    | {
        key:
          | "signed_in"
          | "admin_only"
          | "restaurant_donations_only"
          | "restaurant_ads_only"
          | "restaurant_requests_only";
      }
    | null,
  languageMode: ChatLanguageMode
) {
  if (!restriction) {
    return null;
  }

  switch (restriction.key) {
    case "signed_in":
      return localizeChatMessage(languageMode, {
        english: formatRoleRestriction("signed_in"),
        sinhala: "මේ ප්‍රශ්නයට පිළිතුරු දෙන්න නම් ඔබ EcoPlate account එකකට login වෙලා ඉන්න ඕනේ.",
        mixed: "මේ ප්‍රශ්නයට answer දෙන්න නම් ඔබ EcoPlate account එකකට login වෙලා ඉන්න ඕනේ."
      });
    case "admin_only":
      return localizeChatMessage(languageMode, {
        english: formatRoleRestriction("admin"),
        sinhala: "මේ තොරතුරු බලන්න පුළුවන් admin account වලට විතරයි.",
        mixed: "මේ data එක බලන්න පුළුවන් admin account වලට විතරයි."
      });
    case "restaurant_donations_only":
      return localizeChatMessage(languageMode, {
        english: "Only restaurant accounts have posted donations to show.",
        sinhala: "posted donations පෙන්නන්න පුළුවන් restaurant account වලට විතරයි.",
        mixed: "posted donations පෙන්නන්න පුළුවන් restaurant account වලට විතරයි."
      });
    case "restaurant_ads_only":
      return localizeChatMessage(languageMode, {
        english: "Only restaurant accounts have ads to show.",
        sinhala: "ads පෙන්නන්න පුළුවන් restaurant account වලට විතරයි.",
        mixed: "ads පෙන්නන්න පුළුවන් restaurant account වලට විතරයි."
      });
    case "restaurant_requests_only":
      return localizeChatMessage(languageMode, {
        english: "Only restaurant accounts can review requests for their donations.",
        sinhala: "ඔබගේ donations වල requests බලන්න පුළුවන් restaurant account වලට විතරයි.",
        mixed: "ඔබගේ donations වල requests බලන්න පුළුවන් restaurant account වලට විතරයි."
      });
  }
}

async function getRestaurantRequests(idToken: string, restaurantId: string) {
  const donations = await queryCollection<Donation>(
    idToken,
    "donations",
    [{ field: "restaurantId", value: restaurantId }],
    20
  );

  if (!donations.length) {
    return [];
  }

  const requestGroups = await Promise.all(
    donations.map((donation) =>
      queryCollection<DonationRequest>(
        idToken,
        "requests",
        [{ field: "donationId", value: donation.id }],
        20
      )
    )
  );

  return sortByNewest(requestGroups.flat());
}

async function buildDatabaseFacts(
  intent: ChatIntent,
  user: AppUser,
  idToken: string,
  message: string,
  foodName?: string
) {
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
      const donations = sortByNewest(
        await queryCollection<Donation>(
          idToken,
          "donations",
          [{ field: "status", value: "available" }],
          10
        )
      );
      return formatDonationFacts("Available donations", donations, {
        totalLabel: "Total available donations"
      });
    }
    case "my_donations": {
      const donations = sortByNewest(
        await queryCollection<Donation>(
          idToken,
          "donations",
          [{ field: "restaurantId", value: user.id }],
          10
        )
      );
      return formatDonationFacts("My posted donations", donations, {
        totalLabel: "Total my donations"
      });
    }
    case "completed_donations": {
      const donations =
        user.role === "restaurant"
          ? (
              await queryCollection<Donation>(
                idToken,
                "donations",
                [{ field: "restaurantId", value: user.id }],
                20
              )
            ).filter((item) => item.status === "completed")
          : user.role === "admin"
            ? sortByNewest(
                await queryCollection<Donation>(
                  idToken,
                  "donations",
                  [{ field: "status", value: "completed" }],
                  20
                )
              )
            : [];

      return formatDonationFacts("Completed donations", donations, {
        totalLabel: "Total completed donations"
      });
    }
    case "latest_donations": {
      const donations =
        user.role === "restaurant"
          ? sortByNewest(
              await queryCollection<Donation>(
                idToken,
                "donations",
                [{ field: "restaurantId", value: user.id }],
                10
              )
            ).slice(0, 5)
          : user.role === "charity"
            ? sortByNewest(
                await queryCollection<Donation>(
                  idToken,
                  "donations",
                  [{ field: "status", value: "available" }],
                  10
                )
              ).slice(0, 5)
            : sortByNewest(await listCollection<Donation>(idToken, "donations", 10)).slice(0, 5);

      return formatDonationFacts("Latest donations", donations, {
        totalLabel: "Total latest donations shown",
        limit: 5
      });
    }
    case "donation_details": {
      const candidateDonations =
        user.role === "restaurant"
          ? await queryCollection<Donation>(
              idToken,
              "donations",
              [{ field: "restaurantId", value: user.id }],
              20
            )
          : user.role === "charity"
            ? await queryCollection<Donation>(
                idToken,
                "donations",
                [{ field: "status", value: "available" }],
                20
              )
            : await listCollection<Donation>(idToken, "donations", 20);

      const donation =
        candidateDonations.find((item) =>
          item.foodName.toLowerCase().includes((foodName || "").toLowerCase())
        ) || null;

      return formatDonationDetailFact(donation);
    }
    case "donations_with_images": {
      const candidateDonations =
        user.role === "restaurant"
          ? await queryCollection<Donation>(
              idToken,
              "donations",
              [{ field: "restaurantId", value: user.id }],
              20
            )
          : await listCollection<Donation>(idToken, "donations", 20);
      const donations = candidateDonations.filter((item) => Boolean(item.image64));

      return formatDonationFacts("Donations with images", donations, {
        totalLabel: "Total donations with images"
      });
    }
    case "donations_with_location": {
      const candidateDonations =
        user.role === "restaurant"
          ? await queryCollection<Donation>(
              idToken,
              "donations",
              [{ field: "restaurantId", value: user.id }],
              20
            )
          : await listCollection<Donation>(idToken, "donations", 20);
      const donations = candidateDonations.filter(
        (item) => typeof item.latitude === "number" && typeof item.longitude === "number"
      );

      return formatDonationFacts("Donations with location data", donations, {
        totalLabel: "Total donations with location data"
      });
    }
    case "pending_requests": {
      const requests =
        user.role === "restaurant"
          ? (await getRestaurantRequests(idToken, user.id)).filter((item) => item.status === "pending")
          : user.role === "charity"
            ? (
                await queryCollection<DonationRequest>(
                  idToken,
                  "requests",
                  [{ field: "charityId", value: user.id }],
                  20
                )
              ).filter((item) => item.status === "pending")
            : sortByNewest(
                await queryCollection<DonationRequest>(
                  idToken,
                  "requests",
                  [{ field: "status", value: "pending" }],
                  20
                )
              );

      return formatRequestFacts("Pending requests", requests, {
        totalLabel: "Total pending requests"
      });
    }
    case "approved_requests": {
      const requests =
        user.role === "restaurant"
          ? (await getRestaurantRequests(idToken, user.id)).filter((item) => item.status === "approved")
          : user.role === "charity"
            ? (
                await queryCollection<DonationRequest>(
                  idToken,
                  "requests",
                  [{ field: "charityId", value: user.id }],
                  20
                )
              ).filter((item) => item.status === "approved")
            : sortByNewest(
                await queryCollection<DonationRequest>(
                  idToken,
                  "requests",
                  [{ field: "status", value: "approved" }],
                  20
                )
              );

      return formatRequestFacts("Approved requests", requests, {
        totalLabel: "Total approved requests"
      });
    }
    case "my_requests": {
      const requests = sortByNewest(
        await queryCollection<DonationRequest>(
          idToken,
          "requests",
          [{ field: "charityId", value: user.id }],
          20
        )
      );

      return formatRequestFacts("My requests", requests, {
        totalLabel: "Total my requests"
      });
    }
    case "requests_for_my_donations": {
      const requests = await getRestaurantRequests(idToken, user.id);

      return formatRequestFacts("Requests for my donations", requests, {
        totalLabel: "Total requests for my donations"
      });
    }
    case "latest_requests": {
      const requests =
        user.role === "restaurant"
          ? (await getRestaurantRequests(idToken, user.id)).slice(0, 5)
          : user.role === "charity"
            ? sortByNewest(
                await queryCollection<DonationRequest>(
                  idToken,
                  "requests",
                  [{ field: "charityId", value: user.id }],
                  10
                )
              ).slice(0, 5)
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
          10
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
          10
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
                10
              )
            )
          : sortByNewest(
              await queryCollection<Ad>(
                idToken,
                "ads",
                [{ field: "paymentStatus", value: "pending" }],
                10
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
                10
              )
            )
          : sortByNewest(
              await queryCollection<Ad>(
                idToken,
                "ads",
                [{ field: "status", value: "approved" }],
                10
              )
            );

      return formatAdFacts("Approved ads", ads, {
        totalLabel: "Total approved ads"
      });
    }
    case "admin_stats": {
      const [users, donations, requests, ads] = await Promise.all([
        listCollection<AppUser>(idToken, "users", 100),
        listCollection<Donation>(idToken, "donations", 100),
        listCollection<DonationRequest>(idToken, "requests", 100),
        listCollection<Ad>(idToken, "ads", 100)
      ]);

      return formatAdminStatsFacts({
        totalUsers: users.length,
        totalRestaurants: users.filter((item) => item.role === "restaurant").length,
        totalCharities: users.filter((item) => item.role === "charity").length,
        totalDonations: donations.length,
        totalRequests: requests.length,
        totalAds: ads.length
      });
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
