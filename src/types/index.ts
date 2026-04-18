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
  createdAt: string;
}

export type AppUserFormValues = Omit<AppUser, "createdAt"> & {
  createdAt?: string;
};

export type DonationStatus = "available" | "requested" | "completed" | "cancelled";
export const DONATION_STATUSES: DonationStatus[] = [
  "available",
  "requested",
  "completed",
  "cancelled"
];

export interface Donation {
  id: string;
  restaurantId: string;
  foodName: string;
  quantity: string;
  description: string;
  pickupLocation: string;
  pickupTime: string;
  expiryDate: string;
  status: DonationStatus;
  image64?: string;
  latitude?: number;
  longitude?: number;
  locationText?: string;
  createdAt: string;
}

export type DonationFormValues = Omit<Donation, "createdAt"> & {
  createdAt?: string;
};

export type RequestStatus = "pending" | "approved" | "rejected";

export interface DonationRequest {
  id: string;
  donationId: string;
  charityId: string;
  charityName?: string;
  message: string;
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
