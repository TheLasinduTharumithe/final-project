// Purpose: Firestore user profile, approval, and role-management helpers.
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { USER_ROLES, type AppUser, type AppUserFormValues, type UserRole } from "@/types";

const usersCollection = collection(db, "users");

// User documents are keyed by Firebase Auth uid and mirrored into AppUser objects.
function mapUser(snapshot: Awaited<ReturnType<typeof getDoc>>) {
  return {
    id: snapshot.id,
    ...(snapshot.data() || {})
  } as AppUser;
}

// Role validation protects admin-only role names from accidental public writes.
function ensureValidUserRole(role: UserRole) {
  if (!USER_ROLES.includes(role)) {
    throw new Error("Invalid user role.");
  }
}

export async function createUserProfile(user: AppUser | AppUserFormValues) {
  ensureValidUserRole(user.role);

  // New profiles default to the current timestamp when registration did not provide one.
  const payload: AppUser = {
    ...user,
    createdAt: user.createdAt || new Date().toISOString()
  };

  await setDoc(doc(db, "users", payload.id), payload);
}

export async function getUserProfile(userId: string) {
  const snapshot = await getDoc(doc(db, "users", userId));

  if (!snapshot.exists()) {
    return null;
  }

  return mapUser(snapshot);
}

export async function getUserById(userId: string) {
  return getUserProfile(userId);
}

export async function updateUserProfile(userId: string, data: Partial<AppUser>) {
  if (data.role) {
    ensureValidUserRole(data.role);
  }

  await updateDoc(doc(db, "users", userId), data);
}

export async function deleteUserProfile(userId: string) {
  await deleteDoc(doc(db, "users", userId));
}

export async function getAllUsers() {
  const snapshot = await getDocs(usersCollection);
  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() || {})
  }) as AppUser);
}

export async function getUsersByRole(role: UserRole) {
  ensureValidUserRole(role);
  const users = await getAllUsers();
  return users.filter((user) => user.role === role);
}

export async function getUserSystemStats() {
  const users = await getAllUsers();

  return {
    totalUsers: users.length,
    totalRestaurants: users.filter((user) => user.role === "restaurant").length,
    totalCharities: users.filter((user) => user.role === "charity").length
  };
}

export async function approveUser(userId: string) {
  // Both fields are kept because older UI paths read isApproved while newer paths read approvalStatus.
  await updateDoc(doc(db, "users", userId), {
    approvalStatus: "approved",
    isApproved: true
  });
}

export async function rejectUser(userId: string) {
  await updateDoc(doc(db, "users", userId), {
    approvalStatus: "rejected",
    isApproved: false
  });
}

export async function getPendingUsers() {
  // Query by approvalStatus first, then filter roles in memory to avoid a composite index requirement.
  const q = query(
    usersCollection,
    where("approvalStatus", "==", "pending")
  );
  const snapshot = await getDocs(q);
  const pending = snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() || {})
  }) as AppUser);
  
  return pending.filter(user => user.role === "restaurant" || user.role === "charity");
}

export function subscribeToPendingUsers(callback: (users: AppUser[]) => void) {
  // Admin pages use this listener so approval queues update without a manual refresh.
  const q = query(
    usersCollection,
    where("approvalStatus", "==", "pending")
  );
  return onSnapshot(q, (snapshot) => {
    const allPending = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() || {})
    }) as AppUser);
    
    callback(allPending.filter(user => user.role === "restaurant" || user.role === "charity"));
  }, (error) => {
    if (error.code !== "permission-denied") console.error("Pending users snapshot error:", error);
  });
}

export function subscribeToCharities(callback: (users: AppUser[]) => void) {
  const q = query(usersCollection, where("role", "==", "charity"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(mapUser));
  }, (error) => {
    if (error.code !== "permission-denied") console.error("Charities snapshot error:", error);
  });
}

export async function getApprovedCharities() {
  // Query only by role to avoid requiring a Firestore Composite Index
  const q = query(
    usersCollection,
    where("role", "==", "charity")
  );
  const snapshot = await getDocs(q);
  const allCharities = snapshot.docs.map(mapUser);
  
  // Filter by approvalStatus in memory
  return allCharities.filter(charity => charity.approvalStatus === "approved");
}
