import {
  addDoc,
  collection,
  doc,
  type DocumentData,
  getDocs,
  query,
  type QueryDocumentSnapshot,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Ad, AdPaymentStatus, AdStatus } from "@/types";

const adsCollection = collection(db, "ads");

function sortByNewest(items: Ad[]) {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function mapAd(snapshot: QueryDocumentSnapshot<DocumentData>) {
  return {
    id: snapshot.id,
    ...snapshot.data()
  } as Ad;
}

export async function createAd(
  data: Omit<Ad, "id" | "paymentStatus" | "status" | "createdAt">
) {
  const payload = {
    ...data,
    paymentStatus: "pending" as AdPaymentStatus,
    status: "pending" as AdStatus,
    createdAt: new Date().toISOString()
  };

  const created = await addDoc(adsCollection, payload);
  return created.id;
}

export async function getAllAds() {
  const snapshot = await getDocs(adsCollection);
  return sortByNewest(snapshot.docs.map(mapAd));
}

export async function getAdsByRestaurant(restaurantId: string) {
  const snapshot = await getDocs(
    query(adsCollection, where("restaurantId", "==", restaurantId))
  );

  return sortByNewest(snapshot.docs.map(mapAd));
}

export async function getPublishedPaidAds() {
  const snapshot = await getDocs(
    query(
      adsCollection,
      where("paymentStatus", "==", "paid"),
      where("status", "==", "published")
    )
  );

  return sortByNewest(snapshot.docs.map(mapAd));
}

export async function updateAd(adId: string, data: Partial<Ad>) {
  await updateDoc(doc(db, "ads", adId), data);
}

export async function getApprovedAds() {
  const snapshot = await getDocs(query(adsCollection, where("status", "==", "approved")));
  return sortByNewest(snapshot.docs.map(mapAd));
}

export async function getPendingPaymentAds() {
  const snapshot = await getDocs(
    query(adsCollection, where("paymentStatus", "==", "pending"))
  );

  return sortByNewest(snapshot.docs.map(mapAd));
}
