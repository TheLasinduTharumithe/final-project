import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { safePreviewSrc } from "@/lib/image";
import type { Donation } from "@/types";

interface DonationCardProps {
  donation: Donation;
  ctaLabel?: string;
}

function getDonationStatusClass(status: Donation["status"]) {
  switch (status) {
    case "available":
      return "border-emerald-400/25 bg-emerald-500/10 text-emerald-300";
    case "requested":
      return "border-amber-400/25 bg-amber-500/10 text-amber-300";
    case "completed":
      return "border-lime-400/25 bg-lime-500/10 text-lime-300";
    case "cancelled":
      return "border-rose-400/25 bg-rose-500/10 text-rose-300";
    default:
      return "border-white/10 bg-white/[0.06] text-slate-300";
  }
}

export default function DonationCard({ donation, ctaLabel = "View Details" }: DonationCardProps) {
  const previewSrc = safePreviewSrc(donation.image64);

  return (
    <div className="card flex h-full flex-col overflow-hidden p-0">
      <div className="overflow-hidden border-b border-white/10">
        {previewSrc ? (
          <img
            src={previewSrc}
            alt={donation.foodName}
            className="aspect-[16/10] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[16/10] w-full items-center justify-center bg-[rgba(255,255,255,0.04)]">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <div className="feature-icon-wrap border-white/10 bg-white/[0.05] text-slate-300">
                <ImageIcon className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">No donation image</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Donation
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">{donation.foodName}</h3>
          </div>
          <span className={`status-badge ${getDonationStatusClass(donation.status)}`}>
            {donation.status}
          </span>
        </div>

        <div className="space-y-2 text-sm text-slate-300">
          <p>
            <span className="font-medium text-white">Quantity:</span> {donation.quantity}
          </p>
          <p>
            <span className="font-medium text-white">Pickup:</span> {donation.pickupLocation}
          </p>
          <p>
            <span className="font-medium text-white">Time:</span>{" "}
            {new Date(donation.pickupTime).toLocaleString()}
          </p>
          <p>
            <span className="font-medium text-white">Valid until:</span>{" "}
            {new Date(donation.expiryDate).toLocaleString()}
          </p>
        </div>

        <p className="mt-4 flex-1 text-sm leading-6 text-slate-300">{donation.description}</p>

        <Link href={`/donations/${donation.id}`} className="btn-primary mt-6 text-center">
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
