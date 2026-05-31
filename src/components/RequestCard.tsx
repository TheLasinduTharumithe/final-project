import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, MessageSquareText, XCircle } from "lucide-react";
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
      return "border-[#F59E0B]/35 bg-[#FEF3C7] text-[#92400E]";
    case "approved":
      return "border-[#2563EB]/30 bg-[#DBEAFE] text-[#1E40AF]";
    case "rejected":
      return "border-[#DC2626]/30 bg-[#FEE2E2] text-[#991B1B]";
    default:
      return "border-[#D1D5DB] bg-[#F3F4F1] text-[#374151]";
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
    <article className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="page-eyebrow">Request</p>
          <h3 className="mt-2 text-lg font-semibold leading-snug text-[#1F2937]">
            {donationName || `Donation #${request.donationId.slice(0, 6)}`}
          </h3>
        </div>
        <span className={`status-badge ${getRequestStatusClass(request.status)}`}>
          {request.status}
        </span>
      </div>

      <div className="mt-4 meta-grid">
        {charityName ? (
          <div className="meta-item">
            <span className="meta-label">Charity</span>
            <span className="meta-value">{charityName}</span>
          </div>
        ) : null}
        <div className="meta-item">
          <span className="meta-label">Sent</span>
          <span className="meta-value inline-flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-[#6B7280]" />
            {new Date(request.createdAt).toLocaleString()}
          </span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Requested amount</span>
          <span className="meta-value">{request.requestedQuantity || "Full donation"}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Message</span>
          <span className="meta-value flex items-start gap-2 font-normal leading-6 text-[#6B7280]">
            <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-[#6B7280]" />
            <span className="line-clamp-3">{request.message}</span>
          </span>
        </div>
      </div>

      {showActions && request.status === "pending" ? (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onApprove} className="btn-primary" disabled={!onApprove}>
            <CheckCircle2 className="h-4 w-4" />
            Approve
          </button>
          <button type="button" onClick={onReject} className="btn-light" disabled={!onReject}>
            <XCircle className="h-4 w-4" />
            Reject
          </button>
        </div>
      ) : null}

      {!showActions && request.status === "approved" && trackLink ? (
        <div className="mt-5 space-y-3">
          <div className="rounded-md border border-[#A5D6A7] bg-[#E8F5E9] px-3 py-2 text-sm text-[#1F5A24]">
            Ready for pickup. Map and logistics are available.
          </div>
          <Link href={trackLink} className="btn-primary block w-full text-center sm:w-auto">
            Track Pickup Location
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}
    </article>
  );
}
