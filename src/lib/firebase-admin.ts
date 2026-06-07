// Purpose: Server-side Firebase Admin initialization for privileged API routes.
import * as admin from "firebase-admin";

/**
 * Lazily initializes the Firebase Admin app and returns the Firestore instance.
 *
 * WHY LAZY: Calling admin.firestore() at module load time causes a crash when
 * FIREBASE_PRIVATE_KEY is not set (local dev without a service account). The
 * error propagates as a FirebaseError into any API route that imports this file,
 * resulting in a misleading "Missing or insufficient permissions" 500 error.
 *
 * CREDENTIALS PRIORITY:
 *  1. Service-account env vars (FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL)  → most secure, required on Vercel
 *  2. Application Default Credentials (GCP / Cloud Run)                         → auto-detected
 *  3. None configured → throws a clear, actionable error message
 */
function initAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0] as admin.app.App;
  }

  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    console.log("[firebase-admin] Initializing with service account credentials.");
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }

  // Attempt Application Default Credentials (ADC) — works on GCP / Vercel if configured.
  console.log("[firebase-admin] FIREBASE_PRIVATE_KEY not set. Attempting Application Default Credentials.");
  return admin.initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gym-9e925",
  });
}

/**
 * Returns a Firestore Admin instance, initializing the app on first call.
 * Safe to call multiple times — only initializes once.
 */
export function getAdminDb(): admin.firestore.Firestore {
  const app = initAdminApp();
  return admin.firestore(app);
}

// Named export alias for backwards compat with any existing import
export const adminDb = getAdminDb;
