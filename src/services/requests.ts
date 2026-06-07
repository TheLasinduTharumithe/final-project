// Purpose: Firestore data access helpers for charity pickup request workflows.
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

// Request lists use the same newest-first order across dashboards.
function sortByNewest(items: DonationRequest[]) {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Adds the Firestore document id to the stored request fields.
function mapRequest(snapshot: QueryDocumentSnapshot<DocumentData>) {
  return {
    id: snapshot.id,
    ...snapshot.data()
  } as DonationRequest;
}

export async function createDonationRequest(
  data: Omit<DonationRequest, "id" | "status" | "createdAt" | "restaurantId">
) {
  // A charity can only have one active request for the same donation.
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

  // The transaction makes the availability checks and request creation atomic.
  await runTransaction(db, async (transaction) => {
    const donationRef = doc(db, "donations", data.donationId);
    const donationSnapshot = await transaction.get(donationRef);

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

    if (donation.expiresAt && new Date(donation.expiresAt).getTime() < Date.now()) {
      throw new Error("This donation has already expired.");
    }

    const requestedQty = Number(data.requestedQuantity) || 0;
    if (requestedQty <= 0) {
      throw new Error("Invalid request quantity.");
    }

    if (requestedQty > donation.remainingQuantity) {
      throw new Error("Cannot request more than the remaining quantity.");
    }

    // restaurantId is copied to the request so restaurant dashboards can query directly.
    const newRequestRef = doc(requestsCollection);
    transaction.set(newRequestRef, {
      ...data,
      restaurantId: donation.restaurantId,
      requestedQuantity: requestedQty,
      status: "pending",
      createdAt: new Date().toISOString()
    });
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
  const snapshot = await getDocs(
    query(requestsCollection, where("restaurantId", "==", restaurantId))
  );

  return sortByNewest(snapshot.docs.map(mapRequest));
}

export async function approveRequest(requestId: string) {
  const requestRef = doc(db, "requests", requestId);

  // Approval consumes remaining donation quantity and updates both documents together.
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

    if (!donationSnapshot.exists()) {
      throw new Error("Donation not found.");
    }

    const donation = {
      id: donationSnapshot.id,
      ...donationSnapshot.data()
    } as Donation;

    const requestedQty = Number(request.requestedQuantity) || 0;
    if (requestedQty <= 0) {
      throw new Error("Invalid request quantity.");
    }

    if (requestedQty > donation.remainingQuantity) {
      throw new Error("Cannot approve more than the remaining quantity.");
    }

    const newRemaining = donation.remainingQuantity - requestedQty;
    const newRequested = (donation.requestedQuantity || 0) + requestedQty;

    // When nothing remains, the donation is completed automatically.
    transaction.update(requestRef, { status: "approved" });
    transaction.update(donationRef, {
      remainingQuantity: newRemaining,
      requestedQuantity: newRequested,
      status: newRemaining === 0 ? "completed" : "available"
    });
  });
}

export async function rejectRequest(requestId: string) {
  const requestRef = doc(db, "requests", requestId);

  // Rejection only changes the request status; donation quantities stay untouched.
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

    transaction.update(requestRef, { status: "rejected" });
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

import { onSnapshot } from "firebase/firestore";

export function subscribeToRequestsByCharity(charityId: string, callback: (requests: DonationRequest[]) => void) {
  const q = query(requestsCollection, where("charityId", "==", charityId));
  return onSnapshot(q, (snapshot) => {
    callback(sortByNewest(snapshot.docs.map(mapRequest)));
  }, (error) => {
    if (error.code !== "permission-denied") console.error("Requests snapshot error:", error);
  });
}

export function subscribeToRequestsForRestaurant(restaurantId: string, callback: (requests: DonationRequest[]) => void) {
  // Placeholder kept for future realtime restaurant request support.
  // This requires fetching all donations first. For a true real-time setup, we'd need a Cloud Function or denormalized data.
  // We'll approximate it by fetching donations, then subscribing to requests where donationId is in the list.
  // Wait, "in" query supports up to 10. If more than 10 donations, we have to split.
  // Alternatively, just do what the original did but re-fetch on donation changes?
  // I will just export a simple function for now and we'll use `getRequestsForRestaurant` if it's too complex.
}
