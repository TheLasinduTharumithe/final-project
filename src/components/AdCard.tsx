// Purpose: Reusable card for displaying restaurant advertisement details.
import type { Ad } from "@/types";

interface AdCardProps {
  ad: Ad;
  showMeta?: boolean;
}

export default function AdCard({ ad, showMeta = true }: AdCardProps) {
  return (
    <article className="card overflow-hidden p-0">
      {ad.imageUrl ? (
        <img
          src={ad.imageUrl}
          alt={ad.title}
          className="aspect-[16/9] w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex aspect-[16/9] w-full items-center justify-center bg-[#F8F6F0] text-sm text-[#6B7280]">
          Advertisement image unavailable
        </div>
      )}

      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="page-eyebrow">
              Restaurant Promotion
            </p>
            <h3 className="mt-2 text-lg font-semibold leading-snug text-[#1F2937]">{ad.title}</h3>
          </div>
          {showMeta ? (
            <span className="status-badge border-[#2563EB]/30 bg-[#DBEAFE] text-[#1E40AF]">
              {ad.status}
            </span>
          ) : null}
        </div>

        <p className="text-sm leading-6 text-[#6B7280] line-clamp-4">{ad.description}</p>

        <div className="grid gap-2 text-sm text-[#6B7280] sm:grid-cols-2">
          <div className="meta-item">
            <span className="meta-label">Contact</span>
            <span className="meta-value">{ad.contactNumber}</span>
          </div>
          {showMeta ? (
            <div className="meta-item">
              <span className="meta-label">Payment</span>
              <span className="meta-value">{ad.paymentStatus}</span>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
