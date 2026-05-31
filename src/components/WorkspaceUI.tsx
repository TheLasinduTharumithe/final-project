import type { ReactNode } from "react";
import { AlertCircle, Loader2, Search } from "lucide-react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  helper?: string;
  tone?: "default" | "attention" | "positive" | "info";
}

interface StatePanelProps {
  title: string;
  message: string;
  tone?: "loading" | "empty" | "error";
  action?: ReactNode;
}

const metricToneClass = {
  default: "border-[#E5E7EB] bg-white",
  attention: "border-[#F59E0B]/35 bg-[#FEF3C7]",
  positive: "border-[#A5D6A7] bg-[#E8F5E9]",
  info: "border-[#2563EB]/30 bg-[#DBEAFE]"
};

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="min-w-0">
        <p className="page-eyebrow">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-col gap-2 sm:flex-row">{actions}</div> : null}
    </div>
  );
}

export function MetricCard({ label, value, helper, tone = "default" }: MetricCardProps) {
  return (
    <div className={`rounded-lg border p-4 shadow-sm ${metricToneClass[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7280]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[#1F2937]">{value}</p>
      {helper ? <p className="mt-2 text-sm leading-5 text-[#6B7280]">{helper}</p> : null}
    </div>
  );
}

export function StatePanel({ title, message, tone = "empty", action }: StatePanelProps) {
  const isLoading = tone === "loading";
  const isError = tone === "error";
  const Icon = isLoading ? Loader2 : isError ? AlertCircle : Search;

  return (
    <div
      className={`state-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${
        isError ? "border-[#DC2626]/30 bg-[#FEE2E2]" : ""
      }`}
      role={isError ? "alert" : isLoading ? "status" : undefined}
      aria-live={isLoading || isError ? "polite" : undefined}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${
            isError
              ? "border-[#DC2626]/30 bg-[#FEE2E2] text-[#991B1B]"
              : "border-[#A5D6A7] bg-[#E8F5E9] text-[#2E7D32]"
          }`}
        >
          <Icon className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#1F2937]">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-[#6B7280]">{message}</p>
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-live="polite">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="stat-card">
            <div className="skeleton-line h-3 w-24" />
            <div className="skeleton-line mt-4 h-8 w-14" />
            <div className="skeleton-line mt-3 h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="table-card">
        {[0, 1, 2].map((item) => (
          <div key={item} className="list-row">
            <div className="min-w-0 flex-1">
              <div className="skeleton-line h-4 w-44" />
              <div className="skeleton-line mt-2 h-3 w-64 max-w-full" />
            </div>
            <div className="skeleton-line h-9 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}
