import type { Ad } from "@/types";

interface AdCardProps {
  ad: Ad;
  showMeta?: boolean;
}

export default function AdCard({ ad, showMeta = true }: AdCardProps) {
  return (
    <div className="card overflow-hidden p-0">
      {ad.imageUrl ? (
        <img
          src={ad.imageUrl}
          alt={ad.title}
          className="h-56 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-56 w-full items-center justify-center bg-[rgba(255,255,255,0.04)] text-sm text-slate-400">
          Advertisement image unavailable
        </div>
      )}

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Restaurant Promotion
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">{ad.title}</h3>
          </div>
          {showMeta ? <span className="status-badge border-cyan-400/25 bg-cyan-500/10 text-cyan-300">{ad.status}</span> : null}
        </div>

        <p className="text-sm leading-6 text-slate-300">{ad.description}</p>

        <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
          <p>
            <span className="font-medium text-white">Contact:</span> {ad.contactNumber}
          </p>
          {showMeta ? (
            <p>
              <span className="font-medium text-white">Payment:</span> {ad.paymentStatus}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
