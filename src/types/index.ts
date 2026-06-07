// Purpose: Shared TypeScript models and status constants used across the app.
export type UserRole = "restaurant" | "charity" | "admin";
export const USER_ROLES: UserRole[] = ["restaurant", "charity", "admin"];

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: UserRole;
  avatar64?: string;
  licenseFile?: string;
  licenseFileName?: string;
  approvalStatus?: "pending" | "approved" | "rejected";
  isApproved?: boolean;
  createdAt: string;
}

export type AppUserFormValues = Omit<AppUser, "createdAt"> & {
  createdAt?: string;
};

export type DonationStatus = "available" | "requested" | "completed" | "cancelled" | "expired";
export const DONATION_STATUSES: DonationStatus[] = [
  "available",
  "requested",
  "completed",
  "cancelled",
  "expired"
];

export interface Donation {
  id: string;
  restaurantId: string;
  foodName: string;
  quantity: string;
  totalQuantity: number;
  remainingQuantity: number;
  requestedQuantity: number;
  description: string;
  pickupLocation: string;
  pickupTime: string;
  expiryDate: string;
  expiryTime: string;
  expiresAt: string;
  status: DonationStatus;
  image64?: string;
  latitude?: number;
  longitude?: number;
  locationText?: string;
  createdAt: string;
}

export type DonationFormValues = Omit<Donation, "createdAt" | "expiresAt"> & {
  createdAt?: string;
  expiresAt?: string;
};

export type RequestStatus = "pending" | "approved" | "rejected";

export interface DonationRequest {
  id: string;
  donationId: string;
  restaurantId: string;
  charityId: string;
  charityName?: string;
  message: string;
  requestedQuantity: number;
  status: RequestStatus;
  createdAt: string;
}

export type AdPaymentStatus = "pending" | "paid";
export type AdStatus = "pending" | "approved" | "rejected" | "published";

export interface Ad {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  restaurantId: string;
  contactNumber: string;
  paymentStatus: AdPaymentStatus;
  status: AdStatus;
  createdAt: string;
}
