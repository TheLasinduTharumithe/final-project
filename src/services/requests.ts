import {
  addDoc,
  collection,
  doc,
  type DocumentData,
  getDoc,
  getDocs,
  query,
  type QueryDocumentSnapshot,
  runTransaction,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getDonationsByRestaurant } from "@/services/donations";
import type { Donation, DonationRequest } from "@/types";

const requestsCollection = collection(db, "requests");

function sortByNewest(items: DonationRequest[]) {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function mapRequest(snapshot: QueryDocumentSnapshot<DocumentData>) {
  return {
    id: snapshot.id,
    ...snapshot.data()
  } as DonationRequest;
}

export async function createDonationRequest(
  data: Omit<DonationRequest, "id" | "status" | "createdAt">
) {
  const donationSnapshot = await getDoc(doc(db, "donations", data.donationId));

  if (!donationSnapshot.exists()) {
    throw new Error("This donation no longer exists.");
  }

  const donation = {
    id: donationSnapshot.id,
    ...donationSnapshot.data()
  } as Donation;

  if (donation.status !== "available") {
    throw new Error("This donation is no longer available.");
  }

  const existingRequests = await getDocs(
    query(
      requestsCollection,
      where("charityId", "==", data.charityId),
      where("donationId", "==", data.donationId)
    )
  );

  const alreadyRequested = existingRequests.docs
    .map(mapRequest)
    .some((request) => request.status === "pending" || request.status === "approved");

  if (alreadyRequested) {
    throw new Error("You have already requested this donation.");
  }

  await addDoc(requestsCollection, {
    ...data,
    status: "pending",
    createdAt: new Date().toISOString()
  });
}

export async function getAllRequests() {
  const snapshot = await getDocs(requestsCollection);
  return sortByNewest(snapshot.docs.map(mapRequest));
}

export async function getRequestsByCharity(charityId: string) {
  const snapshot = await getDocs(
    query(requestsCollection, where("charityId", "==", charityId))
  );

  return sortByNewest(snapshot.docs.map(mapRequest));
}

export async function getRequestsForRestaurant(restaurantId: string) {
  const donations = await getDonationsByRestaurant(restaurantId);

  if (!donations.length) {
    return [];
  }

  const requestGroups = await Promise.all(
    donations.map(async (donation) => {
      const snapshot = await getDocs(
        query(requestsCollection, where("donationId", "==", donation.id))
      );

      return snapshot.docs.map(mapRequest);
    })
  );

  return sortByNewest(requestGroups.flat());
}

export async function approveRequest(requestId: string) {
  const requestRef = doc(db, "requests", requestId);

  await runTransaction(db, async (transaction) => {
    const requestSnapshot = await transaction.get(requestRef);

    if (!requestSnapshot.exists()) {
      throw new Error("Request not found.");
    }

    const request = {
      id: requestSnapshot.id,
      ...requestSnapshot.data()
    } as DonationRequest;

    if (request.status !== "pending") {
      throw new Error("Only pending requests can be approved.");
    }

    const donationRef = doc(db, "donations", request.donationId);
    const donationSnapshot = await transaction.get(donationRef);

    transaction.update(requestRef, { status: "approved" });

    if (donationSnapshot.exists()) {
      transaction.update(donationRef, { status: "requested" });
    }
  });
}

export async function rejectRequest(requestId: string) {
  const requestRef = doc(db, "requests", requestId);

  await runTransaction(db, async (transaction) => {
    const requestSnapshot = await transaction.get(requestRef);

    if (!requestSnapshot.exists()) {
      throw new Error("Request not found.");
    }

    const request = {
      id: requestSnapshot.id,
      ...requestSnapshot.data()
    } as DonationRequest;

    if (request.status !== "pending") {
      throw new Error("Only pending requests can be rejected.");
    }

    const donationRef = doc(db, "donations", request.donationId);
    const donationSnapshot = await transaction.get(donationRef);

    transaction.update(requestRef, { status: "rejected" });

    if (donationSnapshot.exists()) {
      const donation = {
        id: donationSnapshot.id,
        ...donationSnapshot.data()
      } as Donation;

      if (donation.status === "requested") {
        transaction.update(donationRef, { status: "available" });
      }
    }
  });
}

export async function getPendingRequests() {
  const snapshot = await getDocs(
    query(requestsCollection, where("status", "==", "pending"))
  );

  return sortByNewest(snapshot.docs.map(mapRequest));
}

export async function getApprovedRequests() {
  const snapshot = await getDocs(
    query(requestsCollection, where("status", "==", "approved"))
  );

  return sortByNewest(snapshot.docs.map(mapRequest));
}

export async function getLatestRequests(limit = 5) {
  const requests = await getAllRequests();
  return requests.slice(0, limit);
}
