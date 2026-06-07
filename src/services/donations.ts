// Purpose: Firestore data access helpers for donation lifecycle operations.
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  type DocumentData,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  type QueryDocumentSnapshot,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  DONATION_STATUSES,
  type Donation,
  type DonationFormValues,
  type DonationStatus
} from "@/types";

const donationsCollection = collection(db, "donations");
const requestsCollection = collection(db, "requests");

// Keep UI lists stable by always showing the newest records first.
function sortByNewest(items: Donation[]) {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Firestore snapshots are converted into the app's typed Donation shape here.
function mapDonation(snapshot: QueryDocumentSnapshot<DocumentData>) {
  return {
    id: snapshot.id,
    ...snapshot.data()
  } as Donation;
}

// Status values are centralized in types so writes cannot drift from the UI contract.
function ensureValidDonationStatus(status: DonationStatus) {
  if (!DONATION_STATUSES.includes(status)) {
    throw new Error("Invalid donation status.");
  }
}

export type CreateDonationPayload = Omit<Donation, "id" | "createdAt" | "totalQuantity" | "remainingQuantity" | "requestedQuantity" | "expiryTime" | "expiresAt"> & Partial<Donation>;

export async function createDonation(data: CreateDonationPayload | DonationFormValues) {
  ensureValidDonationStatus(data.status);
  const createdAt = "createdAt" in data && data.createdAt ? data.createdAt : new Date().toISOString();

  // Normalize the form datetime into an ISO value that can be compared lexicographically.
  let expiresAt = "";
  if (data.expiryDate) {
    try {
      expiresAt = new Date(data.expiryDate).toISOString();
    } catch {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }
  } else {
    expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }

  // Older callers may only send quantity, so derived counters are filled here.
  const payload = {
    ...data,
    totalQuantity: "totalQuantity" in data && data.totalQuantity !== undefined ? data.totalQuantity : Number((data as any).quantity) || 0,
    remainingQuantity: "remainingQuantity" in data && data.remainingQuantity !== undefined ? data.remainingQuantity : Number((data as any).quantity) || 0,
    requestedQuantity: "requestedQuantity" in data ? data.requestedQuantity : 0,
    expiresAt,
    createdAt
  };

  const created = await addDoc(donationsCollection, payload);
  return created.id;
}

export async function updateDonation(donationId: string, data: Partial<Donation>) {
  if (data.status) {
    ensureValidDonationStatus(data.status);
  }

  await updateDoc(doc(db, "donations", donationId), data);
}

export async function updateDonationStatus(donationId: string, status: DonationStatus) {
  ensureValidDonationStatus(status);
  await updateDoc(doc(db, "donations", donationId), { status });
}

export async function deleteDonation(donationId: string) {
  const donation = await getDonationById(donationId);
  if (!donation) return;

  // Donations with pickup requests are preserved for auditability and should be cancelled instead.
  const relatedRequests = await getDocs(
    query(
      requestsCollection, 
      where("donationId", "==", donationId),
      where("restaurantId", "==", donation.restaurantId)
    )
  );

  if (!relatedRequests.empty) {
    throw new Error("This donation already has requests. Cancel it instead of deleting it.");
  }

  await deleteDoc(doc(db, "donations", donationId));
}

export async function getDonationById(donationId: string) {
  const snapshot = await getDoc(doc(db, "donations", donationId));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data()
  } as Donation;
}

export async function getAllDonations() {
  const snapshot = await getDocs(donationsCollection);
  const donations = snapshot.docs.map(mapDonation);

  return sortByNewest(donations);
}

export async function getDonationsByRestaurant(restaurantId: string) {
  const snapshot = await getDocs(
    query(donationsCollection, where("restaurantId", "==", restaurantId))
  );

  return sortByNewest(snapshot.docs.map(mapDonation));
}

export async function getAvailableDonations() {
  const snapshot = await getDocs(
    query(donationsCollection, where("status", "==", "available"))
  );

  // Firestore rules stay simple; expiry is filtered in application code.
  const now = new Date().toISOString();
  const donations = snapshot.docs
    .map(mapDonation)
    .filter(d => !d.expiresAt || d.expiresAt > now);

  return sortByNewest(donations);
}

export async function getLatestDonations(limit = 5) {
  const donations = await getAllDonations();
  return donations.slice(0, limit);
}

export async function getCompletedDonations() {
  const snapshot = await getDocs(
    query(donationsCollection, where("status", "==", "completed"))
  );

  return sortByNewest(snapshot.docs.map(mapDonation));
}

export async function getDonationsWithImages() {
  const donations = await getAllDonations();
  return donations.filter((donation) => Boolean(donation.image64));
}

export async function getDonationsWithLocation() {
  const donations = await getAllDonations();
  return donations.filter(
    (donation) =>
      typeof donation.latitude === "number" && typeof donation.longitude === "number"
  );
}

export async function findDonationsByFoodName(foodName: string) {
  const normalized = foodName.trim().toLowerCase();
  const donations = await getAllDonations();

  return donations.filter((donation) => donation.foodName.toLowerCase().includes(normalized));
}

export function subscribeToAvailableDonations(callback: (donations: Donation[]) => void) {
  const q = query(donationsCollection, where("status", "==", "available"));
  return onSnapshot(q, (snapshot) => {
    // Realtime listeners also hide expired donations before updating the UI.
    const now = new Date().toISOString();
    const donations = snapshot.docs
      .map(mapDonation)
      .filter(d => !d.expiresAt || d.expiresAt > now);
    callback(sortByNewest(donations));
  }, (error) => {
    if (error.code !== "permission-denied") console.error("Donations snapshot error:", error);
  });
}

export function subscribeToDonation(donationId: string, callback: (donation: Donation | null) => void) {
  const docRef = doc(db, "donations", donationId);
  return onSnapshot(docRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
    } else {
      callback(mapDonation(snapshot));
    }
  }, (error) => {
    if (error.code !== "permission-denied") console.error("Donation snapshot error:", error);
  });
}

export function subscribeToDonationsByRestaurant(restaurantId: string, callback: (donations: Donation[]) => void) {
  const q = query(donationsCollection, where("restaurantId", "==", restaurantId));
  return onSnapshot(q, (snapshot) => {
    const donations = snapshot.docs.map(mapDonation);
    callback(sortByNewest(donations));
  }, (error) => {
    if (error.code !== "permission-denied") console.error("Donations snapshot error:", error);
  });
}

export async function cleanupExpiredDonations(userId?: string, role?: string) {
  if (!userId || !role) return;

  let donationsToProcess: QueryDocumentSnapshot<DocumentData>[] = [];

  // Admins can process all available donations; restaurants can only process their own.
  if (role === "admin") {
    const snapshot = await getDocs(query(donationsCollection, where("status", "==", "available")));
    donationsToProcess = snapshot.docs;
  } else if (role === "restaurant") {
    const snapshot = await getDocs(
      query(donationsCollection, where("restaurantId", "==", userId), where("status", "==", "available"))
    );
    donationsToProcess = snapshot.docs;
  } else {
    return;
  }
  
  const now = new Date().toISOString();
  const expiredDocs = donationsToProcess.filter(doc => {
    const data = doc.data();
    return data.expiresAt && data.expiresAt < now;
  });

  if (expiredDocs.length === 0) return;

  // Expired donations remain in Firestore with a status change rather than being deleted.
  await Promise.all(expiredDocs.map(docSnapshot => 
    updateDoc(doc(db, "donations", docSnapshot.id), { status: "expired" })
  ));
}
