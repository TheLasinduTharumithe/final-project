import Link from "next/link";
import { ArrowRight, CalendarClock, ImageIcon, MapPin, Package } from "lucide-react";
import { safePreviewSrc } from "@/lib/image";
import type { Donation } from "@/types";

interface DonationCardProps {
  donation: Donation;
  ctaLabel?: string;
}

function getDonationStatusClass(status: Donation["status"]) {
  switch (status) {
    case "available":
      return "border-[#16A34A]/30 bg-[#DCFCE7] text-[#166534]";
    case "requested":
      return "border-[#F59E0B]/35 bg-[#FEF3C7] text-[#92400E]";
    case "completed":
      return "border-[#6B7280]/35 bg-[#F3F4F1] text-[#374151]";
    case "cancelled":
      return "border-[#DC2626]/30 bg-[#FEE2E2] text-[#991B1B]";
    case "expired":
      return "border-[#DC2626]/30 bg-[#FEE2E2] text-[#991B1B]";
    default:
      return "border-[#D1D5DB] bg-[#F3F4F1] text-[#374151]";
  }
}

export default function DonationCard({ donation, ctaLabel = "View Details" }: DonationCardProps) {
  const previewSrc = safePreviewSrc(donation.image64);
  const expiresAt = new Date(donation.expiresAt || donation.expiryDate);
  const pickupTime = new Date(donation.pickupTime);
  const expiresSoon =
    donation.status === "available" &&
    donation.expiresAt &&
    expiresAt.getTime() - Date.now() < 60 * 60 * 1000 &&
    expiresAt.getTime() - Date.now() > 0;

  return (
    <article className="card flex h-full flex-col overflow-hidden p-0">
      <div className="relative overflow-hidden border-b border-[#E5E7EB]">
        {previewSrc ? (
          <img
            src={previewSrc}
            alt={donation.foodName}
            className="aspect-[16/10] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[16/10] w-full items-center justify-center bg-[#F8F6F0]">
            <div className="flex flex-col items-center gap-3 text-[#6B7280]">
              <div className="feature-icon-wrap">
                <ImageIcon className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">No donation image</p>
            </div>
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className={`status-badge ${getDonationStatusClass(donation.status)}`}>
            {donation.status}
          </span>
          {expiresSoon ? (
            <span className="status-badge border-[#DC2626]/30 bg-[#FEE2E2] text-[#991B1B]">
              Expires soon
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-lg font-semibold leading-snug text-[#1F2937]">{donation.foodName}</h3>

        <div className="mt-4 meta-grid">
          <div className="meta-item">
            <span className="meta-label">Remaining</span>
            <span className="meta-value inline-flex items-center gap-2">
              <Package className="h-4 w-4 text-[#6B7280]" />
              {donation.remainingQuantity} / {donation.totalQuantity}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Pickup</span>
            <span className="meta-value inline-flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#6B7280]" />
              {donation.pickupLocation}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Pickup time</span>
            <span className="meta-value inline-flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-[#6B7280]" />
              {pickupTime.toLocaleString()}
            </span>
          </div>
        </div>

        <p className="mt-4 flex-1 text-sm leading-6 text-[#6B7280] line-clamp-3">
          {donation.description}
        </p>
        <p className="mt-4 text-xs font-medium text-[#6B7280]">
          Valid until {expiresAt.toLocaleString()}
        </p>

        {donation.status === "expired" ? (
          <button disabled className="btn-light mt-5 w-full cursor-not-allowed text-center opacity-50">
            Expired
          </button>
        ) : (
          <Link href={`/donations/${donation.id}`} className="btn-primary mt-5 text-center">
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </article>
  );
}
