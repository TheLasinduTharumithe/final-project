"use client";

import { updateEmail } from "firebase/auth";
import { useEffect, useState } from "react";
import AvatarUpload from "@/components/AvatarUpload";
import ProtectedRoute from "@/components/ProtectedRoute";
import { subscribeToAuthState } from "@/lib/auth";
import { auth } from "@/lib/firebase";
import { getInitials, safePreviewSrc } from "@/lib/image";
import { getUserProfile, updateUserProfile } from "@/services/users";
import type { AppUser } from "@/types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    role: "",
    avatar64: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (!firebaseUser) {
        setLoading(false);
        return;
      }

      try {
        const userProfile = await getUserProfile(firebaseUser.uid);
        setProfile(userProfile);

        if (userProfile) {
          setForm({
            name: userProfile.name,
            email: userProfile.email,
            phone: userProfile.phone,
            address: userProfile.address,
            role: userProfile.role,
            avatar64: userProfile.avatar64 || ""
          });
        } else {
          setError("Your profile could not be found.");
        }
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Could not load your profile.";
        setError(message);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!profile) {
      setError("User profile not found.");
      return;
    }

    if (!form.name || !form.email || !form.phone || !form.address) {
      setError("Please fill in all profile fields.");
      return;
    }

    try {
      setSaving(true);

      if (auth.currentUser && auth.currentUser.email !== form.email) {
        await updateEmail(auth.currentUser, form.email);
      }

      await updateUserProfile(profile.id, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        avatar64: form.avatar64 || ""
      });

      setProfile((current) =>
        current
          ? {
              ...current,
              name: form.name,
              email: form.email,
              phone: form.phone,
              address: form.address,
              avatar64: form.avatar64 || ""
            }
          : current
      );
      setMessage("Profile updated successfully.");
    } catch (submitError) {
      const errorMessage =
        submitError instanceof Error
          ? submitError.message.includes("requires-recent-login")
            ? "Please log out and log back in before changing your email address."
            : submitError.message
          : "Unable to update the profile right now.";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  const previewAvatar = safePreviewSrc(form.avatar64);
  const initials = getInitials(form.name || profile?.name);

  return (
    <ProtectedRoute>
      <section className="page-shell">
        {loading ? (
          <div className="glass-card">
            <p className="text-slate-300">Loading profile...</p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="glass-card">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Profile Summary</p>

              <div className="mt-6 flex items-center gap-4">
                {previewAvatar ? (
                  <img
                    src={previewAvatar}
                    alt="Profile avatar"
                    className="h-20 w-20 rounded-full border border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-2xl font-semibold text-slate-950 shadow-[0_16px_28px_rgba(16,185,129,0.22)]">
                    {initials}
                  </div>
                )}

                <div>
                  <h1 className="text-4xl font-semibold text-white">{profile?.name || "EcoPlate User"}</h1>
                  <p className="mt-2 text-sm uppercase tracking-[0.22em] text-slate-400">
                    {profile?.role}
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-4 text-sm leading-7 text-slate-300">
                <p>Email: {profile?.email}</p>
                <p>Phone: {profile?.phone}</p>
                <p>Address: {profile?.address}</p>
                <p>Role: {profile?.role}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="card">
              <h2 className="text-2xl font-semibold tracking-tight text-white">Edit Profile</h2>
              <p className="mt-2 text-sm text-slate-300">
                Keep your contact details accurate so donation coordination stays smooth.
              </p>

              <div className="mt-6">
                <AvatarUpload
                  value={form.avatar64}
                  name={form.name}
                  onChange={(avatar64) => setForm((current) => ({ ...current, avatar64 }))}
                  disabled={saving}
                />
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="label">Name</label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    className="input"
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Role</label>
                  <input className="input capitalize opacity-80" value={form.role} disabled />
                </div>
              </div>

              <div className="mt-5">
                <label className="label">Address</label>
                <textarea
                  className="input min-h-[120px]"
                  value={form.address}
                  onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                />
              </div>

              {message ? (
                <p className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  {message}
                </p>
              ) : null}

              {error ? (
                <p className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p>
              ) : null}

              <button type="submit" className="btn-primary mt-6" disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </form>
          </div>
        )}
      </section>
    </ProtectedRoute>
  );
}
