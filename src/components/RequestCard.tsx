import Link from "next/link";
import type { DonationRequest } from "@/types";

interface RequestCardProps {
  request: DonationRequest;
  donationName?: string;
  charityName?: string;
  showActions?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  trackLink?: string;
}

function getRequestStatusClass(status: DonationRequest["status"]) {
  switch (status) {
    case "pending":
      return "border-amber-400/25 bg-amber-500/10 text-amber-300";
    case "approved":
      return "border-sky-400/25 bg-sky-500/10 text-sky-300";
    case "rejected":
      return "border-rose-400/25 bg-rose-500/10 text-rose-300";
    default:
      return "border-white/10 bg-white/[0.06] text-slate-300";
  }
}

export default function RequestCard({
  request,
  donationName,
  charityName,
  showActions = false,
  onApprove,
  onReject,
  trackLink
}: RequestCardProps) {
  return (
    <div className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Request</p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            {donationName || `Donation #${request.donationId.slice(0, 6)}`}
          </h3>
        </div>
        <span className={`status-badge ${getRequestStatusClass(request.status)}`}>
          {request.status}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-300">
        {charityName ? (
          <p>
            <span className="font-medium text-white">Charity:</span> {charityName}
          </p>
        ) : null}
        <p>
          <span className="font-medium text-white">Sent:</span>{" "}
          {new Date(request.createdAt).toLocaleString()}
        </p>
        <p className="leading-6">
          <span className="font-medium text-white">Message:</span> {request.message}
        </p>
      </div>

      {showActions && request.status === "pending" ? (
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onApprove} className="btn-primary" disabled={!onApprove}>
            Approve
          </button>
          <button type="button" onClick={onReject} className="btn-light" disabled={!onReject}>
            Reject
          </button>
        </div>
      ) : null}

      {!showActions && request.status === "approved" && trackLink ? (
        <div className="mt-5">
          <Link href={trackLink} className="btn-primary">
            Track Pickup Location
          </Link>
        </div>
      ) : null}
    </div>
  );
}
