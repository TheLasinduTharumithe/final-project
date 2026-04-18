import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { USER_ROLES, type AppUser, type AppUserFormValues, type UserRole } from "@/types";

const usersCollection = collection(db, "users");

function mapUser(snapshot: Awaited<ReturnType<typeof getDoc>>) {
  return {
    id: snapshot.id,
    ...(snapshot.data() || {})
  } as AppUser;
}

function ensureValidUserRole(role: UserRole) {
  if (!USER_ROLES.includes(role)) {
    throw new Error("Invalid user role.");
  }
}

export async function createUserProfile(user: AppUser | AppUserFormValues) {
  ensureValidUserRole(user.role);

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
