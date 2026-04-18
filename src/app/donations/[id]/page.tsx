"use client";

import { ImageIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DonationForm, { type DonationFormValues } from "@/components/DonationForm";
import DonationLocationMap from "@/components/DonationLocationMap";
import ProtectedRoute from "@/components/ProtectedRoute";
import { subscribeToAuthState } from "@/lib/auth";
import { safePreviewSrc } from "@/lib/image";
import {
  deleteDonation,
  getDonationById,
  updateDonation,
  updateDonationStatus
} from "@/services/donations";
import { createDonationRequest } from "@/services/requests";
import { getUserProfile } from "@/services/users";
import type { AppUser, Donation } from "@/types";

export default function DonationDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const donationId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [profile, setProfile] = useState<AppUser | null>(null);
  const [donation, setDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [editing, setEditing] = useState(false);
  const [pageError, setPageError] = useState("");

  async function loadDonation() {
    try {
      const item = await getDonationById(donationId);
      setDonation(item);
      setPageError("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Could not load the donation.";
      setPageError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isActive = true;

    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (!firebaseUser || !isActive) {
        return;
      }

      const userProfile = await getUserProfile(firebaseUser.uid);

      if (!isActive) {
        return;
      }

      setProfile(userProfile);
      await loadDonation();
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [donationId]);

  async function handleUpdate(values: DonationFormValues) {
    await updateDonation(donationId, values);
    setEditing(false);
    await loadDonation();
  }

  async function handleDelete() {
    const confirmed = window.confirm("Delete this donation?");

    if (!confirmed) {
      return;
    }

    try {
      setPageError("");
      await deleteDonation(donationId);
      router.push("/donations");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Could not delete this donation.";
      setPageError(errorMessage);
    }
  }

  async function handleRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestError("");

    if (!profile || !message.trim()) {
      setRequestError("Please add a short request message.");
      return;
    }

    try {
      setRequestLoading(true);
      await createDonationRequest({
        donationId,
        charityId: profile.id,
        charityName: profile.name,
        message: message.trim()
      });
      setMessage("");
      await loadDonation();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Could not send request.";
      setRequestError(errorMessage);
    } finally {
      setRequestLoading(false);
    }
  }

  async function handleStatusChange(status: Donation["status"]) {
    try {
      setPageError("");
      await updateDonationStatus(donationId, status);
      await loadDonation();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Could not update the donation status.";
      setPageError(errorMessage);
    }
  }

  const isOwner = profile?.role === "restaurant" && profile.id === donation?.restaurantId;
  const canRequest = profile?.role === "charity" && donation?.status === "available";
  const previewSrc = safePreviewSrc(donation?.image64);

  return (
    <ProtectedRoute allowedRoles={["restaurant", "charity"]}>
      <section className="page-shell">
        {loading ? (
          <div className="glass-card">
            <p className="text-slate-300">Loading donation details...</p>
          </div>
        ) : pageError ? (
          <div className="glass-card">
            <p className="text-slate-300">{pageError}</p>
          </div>
        ) : !donation ? (
          <div className="glass-card">
            <p className="text-slate-300">Donation not found.</p>
          </div>
        ) : editing ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Edit Donation</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">{donation.foodName}</h1>
              </div>
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary">
                Cancel
              </button>
            </div>

            <DonationForm
              initialValues={donation}
              onSubmit={handleUpdate}
              submitLabel="Save Changes"
              showStatusField
            />
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="card overflow-hidden p-0">
              <div className="overflow-hidden border-b border-white/10">
                {previewSrc ? (
                  <img
                    src={previewSrc}
                    alt={donation.foodName}
                    className="aspect-[16/9] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[16/9] w-full items-center justify-center bg-white/[0.04]">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="feature-icon-wrap border-white/10 bg-white/[0.05] text-slate-300">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium">No donation image</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
                    Donation Details
                  </p>
                  <h1 className="mt-3 text-4xl font-semibold text-white">{donation.foodName}</h1>
                </div>
                <span className="status-badge">{donation.status}</span>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-slate-400">Quantity</p>
                  <p className="mt-1 text-white">{donation.quantity}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Pickup Location</p>
                  <p className="mt-1 text-white">{donation.pickupLocation}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Pickup Time</p>
                  <p className="mt-1 text-white">{new Date(donation.pickupTime).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Valid Until</p>
                  <p className="mt-1 text-white">{new Date(donation.expiryDate).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-sm font-medium text-slate-400">Description</p>
                <p className="mt-2 leading-7 text-slate-300">{donation.description}</p>
              </div>

              {donation.locationText ? (
                <div className="mt-8">
                  <p className="text-sm font-medium text-slate-400">Location Note</p>
                  <p className="mt-2 leading-7 text-slate-300">{donation.locationText}</p>
                </div>
              ) : null}

              {isOwner ? (
                <div className="mt-8 flex flex-wrap gap-3">
                  <button type="button" onClick={() => setEditing(true)} className="btn-primary">
                    Edit Donation
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange("completed")}
                    className="btn-light"
                  >
                    Mark Completed
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange("cancelled")}
                    className="btn-light"
                  >
                    Cancel Donation
                  </button>
                  <button type="button" onClick={handleDelete} className="btn-light">
                    Delete
                  </button>
                </div>
              ) : null}
              </div>
            </div>

            <div className="space-y-6">
              <div className="card">
                <h2 className="text-2xl font-semibold text-white">Donation Location</h2>
                <p className="mt-2 text-sm text-slate-300">
                  View the selected pickup point for this donation.
                </p>

                <div className="mt-5">
                  <DonationLocationMap
                    latitude={donation.latitude}
                    longitude={donation.longitude}
                    foodName={donation.foodName}
                    pickupLocation={donation.pickupLocation}
                    enableRoute={profile?.role === "charity"}
                  />
                </div>
              </div>

              <div className="glass-card">
                <h2 className="text-2xl font-semibold text-white">Pickup Guidance</h2>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  Confirm the pickup time before travelling, bring safe food containers, and transport food according to local food safety practices.
                </p>
              </div>

              {canRequest ? (
                <form onSubmit={handleRequest} className="card">
                  <h2 className="text-2xl font-semibold text-white">Request This Donation</h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Share a short message about your organization and pickup readiness.
                  </p>

                  <textarea
                    className="input mt-5 min-h-[140px]"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="We can collect this donation today and distribute it to 30 families."
                  />

                  {requestError ? (
                    <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                      {requestError}
                    </p>
                  ) : null}

                  <button type="submit" className="btn-primary mt-5" disabled={requestLoading}>
                    {requestLoading ? "Sending Request..." : "Send Request"}
                  </button>
                </form>
              ) : (
                <div className="card">
                  <h2 className="text-2xl font-semibold text-white">Donation Request Status</h2>
                  <p className="mt-4 text-sm leading-7 text-slate-300">
                    {profile?.role === "charity"
                      ? "This donation is not currently available for new requests."
                      : "You can manage this donation from here."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </ProtectedRoute>
  );
}
