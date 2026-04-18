import {
  createUserWithEmailAndPassword,
  deleteUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  type User
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUserProfile, getUserProfile } from "@/services/users";
import type { AppUser, UserRole } from "@/types";

interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  role: Exclude<UserRole, "admin">;
  avatar64?: string;
}

type PublicRole = Exclude<UserRole, "admin">;

function buildGoogleFallbackProfile(user: User, role: PublicRole): AppUser {
  return {
    id: user.uid,
    name: user.displayName || "EcoPlate User",
    email: user.email || "",
    phone: "",
    address: "",
    role,
    createdAt: new Date().toISOString()
  };
}

export async function registerUser(input: RegisterInput): Promise<AppUser> {
  const credential = await createUserWithEmailAndPassword(auth, input.email, input.password);

  try {
    const userProfile: AppUser = {
      id: credential.user.uid,
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: input.address,
      role: input.role,
      avatar64: input.avatar64 || "",
      createdAt: new Date().toISOString()
    };

    await createUserProfile(userProfile);
    return userProfile;
  } catch (error) {
    await deleteUser(credential.user).catch(() => null);
    throw error;
  }
}

export async function loginUser(email: string, password: string): Promise<AppUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const profile = await getUserProfile(credential.user.uid);

  if (!profile) {
    await auth.signOut();
    throw new Error("Your account profile is missing. Please contact the admin.");
  }

  return profile;
}

export async function signInWithGoogle(role: PublicRole): Promise<AppUser> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const credential = await signInWithPopup(auth, provider);
  const existingProfile = await getUserProfile(credential.user.uid);

  if (existingProfile) {
    return existingProfile;
  }

  const newProfile = buildGoogleFallbackProfile(credential.user, role);
  await createUserProfile(newProfile);
  return newProfile;
}

export async function logoutUser() {
  await auth.signOut();
}

export function subscribeToAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function getRoleRedirectPath(role: UserRole) {
  if (role === "admin") {
    return "/admin";
  }

  return "/dashboard";
}
