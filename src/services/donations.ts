import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  type DocumentData,
  getDoc,
  getDocs,
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

function sortByNewest(items: Donation[]) {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function mapDonation(snapshot: QueryDocumentSnapshot<DocumentData>) {
  return {
    id: snapshot.id,
    ...snapshot.data()
  } as Donation;
}

function ensureValidDonationStatus(status: DonationStatus) {
  if (!DONATION_STATUSES.includes(status)) {
    throw new Error("Invalid donation status.");
  }
}

export async function createDonation(data: Omit<Donation, "id" | "createdAt"> | DonationFormValues) {
  ensureValidDonationStatus(data.status);
  const createdAt = "createdAt" in data && data.createdAt ? data.createdAt : new Date().toISOString();

  const payload = {
    ...data,
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
  const relatedRequests = await getDocs(
    query(requestsCollection, where("donationId", "==", donationId))
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

  return sortByNewest(snapshot.docs.map(mapDonation));
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
