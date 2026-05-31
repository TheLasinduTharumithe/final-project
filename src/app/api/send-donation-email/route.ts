import { NextResponse } from "next/server";
import { getDonationNotificationHtml } from "@/templates/email/DonationNotification";
import { getAdminDb } from "@/lib/firebase-admin";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/send-donation-email
//
// Server-side only. Sends email notifications to all approved charities
// when a new donation post is created.
//
// DATA FLOW:
//   1. Client sends { donation, restaurant, charities[] } in the POST body.
//   2. This route first tries to fetch approved charities via the Firebase
//      Admin SDK (bypasses Firestore security rules, most authoritative).
//   3. If the Admin SDK isn't configured (e.g. local dev without a service
//      account key), it falls back to the client-supplied `charities` array.
//   4. Deduplicates and validates all email addresses.
//   5. Sends emails via Brevo's native Transactional Email API.
// ─────────────────────────────────────────────────────────────────────────────

/** Valid email regex — accepts any TLD (not just .com). */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

/** Brevo API configuration */
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "noreply@ecoplate.com";
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || "EcoPlate";

interface BrevoEmailRecipient {
  email: string;
  name?: string;
}

interface BrevoSendEmailParams {
  sender: {
    name: string;
    email: string;
  };
  to: BrevoEmailRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  replyTo?: {
    email: string;
    name?: string;
  };
  headers?: Record<string, string>;
  tags?: string[];
}

/**
 * Send a single email via Brevo's native Transactional Email API
 */
async function sendBrevoEmail(params: BrevoSendEmailParams): Promise<void> {
  if (!BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY environment variable is not set");
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY,
      "Accept": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage: string;

    try {
      const errorJson = JSON.parse(errorBody);
      errorMessage = errorJson.message || errorBody;
    } catch {
      errorMessage = errorBody;
    }

    throw new Error(`Brevo API error (${response.status}): ${errorMessage}`);
  }

  // Log successful send (optional: parse response for messageId)
  const data = await response.json();
  console.log(`[send-donation-email] Brevo message sent successfully. Message ID: ${data.messageId}`);
}

/**
 * Send bulk emails via Brevo's native Transactional Email API
 * with individual recipient personalization
 */
async function sendBulkBrevoEmail(params: {
  sender: { name: string; email: string };
  to: BrevoEmailRecipient[];
  subject: string;
  htmlContent: string;
  replyTo?: { email: string; name?: string };
  tags?: string[];
}): Promise<void> {
  if (!BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY environment variable is not set");
  }

  // For bulk sending with same content to multiple recipients,
  // we can use a single API call with multiple "to" recipients
  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY,
      "Accept": "application/json",
    },
    body: JSON.stringify({
      ...params,
      // Brevo automatically handles sending individual emails
      // when multiple recipients are provided in the "to" array
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage: string;

    try {
      const errorJson = JSON.parse(errorBody);
      errorMessage = errorJson.message || errorBody;
    } catch {
      errorMessage = errorBody;
    }

    throw new Error(`Brevo API error (${response.status}): ${errorMessage}`);
  }

  const data = await response.json();
  console.log(`[send-donation-email] Brevo bulk message sent. Message ID: ${data.messageId}`);
}

function extractValidEmails(items: { email?: string }[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const email = (item.email ?? "").trim().toLowerCase();
    if (email && EMAIL_REGEX.test(email) && !seen.has(email)) {
      seen.add(email);
      result.push(email);
    }
  }

  return result;
}

export async function POST(request: Request) {
  console.log("[send-donation-email] ── API triggered ──────────────────────────");

  try {
    // Validate Brevo API key is configured
    if (!BREVO_API_KEY) {
      console.error("[send-donation-email] BREVO_API_KEY is not configured.");
      return NextResponse.json(
          { error: "Email service not configured" },
          { status: 500 }
      );
    }

    // ── Parse request body ───────────────────────────────────────────────────
    let body: {
      donation?: Record<string, unknown>;
      restaurant?: Record<string, unknown>;
      charities?: { email?: string }[];
    };

    try {
      body = await request.json();
    } catch {
      console.error("[send-donation-email] Failed to parse request body as JSON.");
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { donation, restaurant, charities: clientCharities } = body;

    if (!donation || !restaurant) {
      console.error("[send-donation-email] Missing required fields: donation or restaurant.");
      return NextResponse.json({ error: "Missing required payload data" }, { status: 400 });
    }

    console.log(
        `[send-donation-email] Donation: "${donation.foodName}" | Restaurant: "${restaurant.name}"`
    );

    // ── 1. Fetch approved charities (Admin SDK preferred) ────────────────────
    let charityList: { email?: string }[] = [];
    let sourceLabel = "unknown";

    try {
      const db = getAdminDb();
      const snapshot = await db
          .collection("users")
          .where("role", "==", "charity")
          .where("approvalStatus", "==", "approved")
          .get();

      charityList = snapshot.docs.map((doc) => doc.data() as { email?: string });
      sourceLabel = "Admin SDK";
      console.log(
          `[send-donation-email] Charities from Admin SDK: ${charityList.length} approved.`
      );
    } catch (adminErr: unknown) {
      const msg = adminErr instanceof Error ? adminErr.message : String(adminErr);
      console.warn(
          `[send-donation-email] Admin SDK unavailable (${msg}). Falling back to client-supplied list.`
      );

      // Fallback: client-provided list
      charityList = Array.isArray(clientCharities) ? clientCharities : [];
      sourceLabel = "client fallback";
      console.log(
          `[send-donation-email] Charities from client payload: ${charityList.length} entries.`
      );
    }

    // ── 2. Deduplicate + validate email addresses ────────────────────────────
    const validEmails = extractValidEmails(charityList);

    if (validEmails.length === 0) {
      console.log(
          `[send-donation-email] No valid emails found in ${charityList.length} charity record(s) (source: ${sourceLabel}).`
      );
      return NextResponse.json({
        success: true,
        message: "No approved charities with valid email addresses to notify.",
        notifiedCount: 0,
      });
    }

    console.log(
        `[send-donation-email] Sending to ${validEmails.length} address(es) (source: ${sourceLabel}): ${validEmails.join(", ")}`
    );

    // ── 3. Build HTML email ──────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html = getDonationNotificationHtml(donation as any, restaurant as any);

    // ── 4. Send emails via Brevo API ─────────────────────────────────────────
    try {
      // Using bulk send for efficiency - single API call for all recipients
      await sendBulkBrevoEmail({
        sender: {
          name: BREVO_SENDER_NAME,
          email: BREVO_SENDER_EMAIL,
        },
        to: validEmails.map(email => ({ email })),
        subject: "🍱 New Food Donation Available - EcoPlate",
        htmlContent: html,
        replyTo: {
          email: restaurant.email as string || BREVO_SENDER_EMAIL,
          name: restaurant.name as string || "Restaurant",
        },
        tags: ["donation-notification", "new-donation"],
      });

      console.log(
          `[send-donation-email] ── Complete: ${validEmails.length} sent successfully via Brevo API ──`
      );

      return NextResponse.json({
        success: true,
        notifiedCount: validEmails.length,
        source: sourceLabel,
      });
    } catch (brevoError: unknown) {
      const msg = brevoError instanceof Error ? brevoError.message : String(brevoError);
      console.error(`[send-donation-email] Brevo API error: ${msg}`);

      // Fallback: Try sending individually if bulk send fails
      console.log("[send-donation-email] Attempting individual sends as fallback...");

      let successCount = 0;
      let failureCount = 0;

      for (const email of validEmails) {
        try {
          await sendBrevoEmail({
            sender: {
              name: BREVO_SENDER_NAME,
              email: BREVO_SENDER_EMAIL,
            },
            to: [{ email }],
            subject: "🍱 New Food Donation Available - EcoPlate",
            htmlContent: html,
            replyTo: {
              email: restaurant.email as string || BREVO_SENDER_EMAIL,
              name: restaurant.name as string || "Restaurant",
            },
            tags: ["donation-notification", "new-donation"],
          });
          successCount++;
        } catch (individualError: unknown) {
          failureCount++;
          const reason = individualError instanceof Error ? individualError.message : String(individualError);
          console.error(
              `[send-donation-email] Individual send failed for ${email}: ${reason}`
          );
        }
      }

      console.log(
          `[send-donation-email] ── Complete (individual fallback): ${successCount} sent, ${failureCount} failed ──`
      );

      return NextResponse.json({
        success: true,
        notifiedCount: successCount,
        failedCount: failureCount,
        source: sourceLabel,
        method: "individual-fallback",
      });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[send-donation-email] Unhandled error: ${msg}`);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}