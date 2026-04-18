import type { Ad, AppUser, Donation, DonationRequest, UserRole } from "@/types";

const DEFAULT_LIMIT = 5;

function limitItems<T>(items: T[], limit = DEFAULT_LIMIT) {
  return items.slice(0, limit);
}

function formatList(items: string[]) {
  if (!items.length) {
    return "- None";
  }

  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

export function formatProfileFacts(user: AppUser) {
  return [
    `Current user name: ${user.name}`,
    `Current user role: ${user.role}`,
    `Current user email: ${user.email}`,
    `Current user phone: ${user.phone || "Not set"}`,
    `Current user address: ${user.address || "Not set"}`
  ].join("\n");
}

export function formatDonationFacts(
  label: string,
  donations: Donation[],
  options?: { totalLabel?: string; limit?: number }
) {
  const limited = limitItems(donations, options?.limit);
  const lines = limited.map(
    (donation) =>
      `${donation.foodName} - ${donation.status} - ${donation.quantity} - ${donation.pickupLocation}`
  );

  return [
    `${options?.totalLabel || "Total donations"}: ${donations.length}`,
    `${label}:`,
    formatList(lines)
  ].join("\n");
}

export function formatDonationDetailFact(donation: Donation | null) {
  if (!donation) {
    return "Donation details: Not found.";
  }

  return [
    `Donation food name: ${donation.foodName}`,
    `Donation status: ${donation.status}`,
    `Donation quantity: ${donation.quantity}`,
    `Pickup location: ${donation.pickupLocation}`,
    `Pickup time: ${donation.pickupTime}`,
    `Valid until: ${donation.expiryDate}`,
    `Has image: ${donation.image64 ? "Yes" : "No"}`,
    `Has location data: ${
      typeof donation.latitude === "number" && typeof donation.longitude === "number" ? "Yes" : "No"
    }`,
    `Description: ${donation.description}`
  ].join("\n");
}

export function formatRequestFacts(
  label: string,
  requests: DonationRequest[],
  options?: { totalLabel?: string; limit?: number }
) {
  const limited = limitItems(requests, options?.limit);
  const lines = limited.map(
    (request) =>
      `${request.charityName || request.charityId} - ${request.status} - ${request.message}`
  );

  return [
    `${options?.totalLabel || "Total requests"}: ${requests.length}`,
    `${label}:`,
    formatList(lines)
  ].join("\n");
}

export function formatAdFacts(label: string, ads: Ad[], options?: { totalLabel?: string; limit?: number }) {
  const limited = limitItems(ads, options?.limit);
  const lines = limited.map(
    (ad) => `${ad.title} - ${ad.status} - payment ${ad.paymentStatus}`
  );

  return [
    `${options?.totalLabel || "Total ads"}: ${ads.length}`,
    `${label}:`,
    formatList(lines)
  ].join("\n");
}

export function formatAdminStatsFacts(input: {
  totalUsers: number;
  totalRestaurants: number;
  totalCharities: number;
  totalDonations: number;
  totalRequests: number;
  totalAds: number;
}) {
  return [
    `Total users: ${input.totalUsers}`,
    `Total restaurants: ${input.totalRestaurants}`,
    `Total charities: ${input.totalCharities}`,
    `Total donations: ${input.totalDonations}`,
    `Total requests: ${input.totalRequests}`,
    `Total ads: ${input.totalAds}`
  ].join("\n");
}

export function formatRoleRestriction(required: UserRole | "signed_in") {
  if (required === "signed_in") {
    return "This answer needs a signed-in EcoPlate account.";
  }

  return `This answer needs a ${required} account in EcoPlate.`;
}
