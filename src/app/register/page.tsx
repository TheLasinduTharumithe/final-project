"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPinHouse,
  Phone,
  Sparkles,
  UserRound
} from "lucide-react";
import { useState } from "react";
import AvatarUpload from "@/components/AvatarUpload";
import { getRoleRedirectPath, registerUser, signInWithGoogle } from "@/lib/auth";

const roleOptions = [
  { value: "restaurant", label: "Restaurant" },
  { value: "charity", label: "Charity" }
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
    role: "restaurant" as "restaurant" | "charity",
    avatar64: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (
      !form.name ||
      !form.email ||
      !form.phone ||
      !form.address ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const profile = await registerUser({
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        password: form.password,
        role: form.role,
        avatar64: form.avatar64 || ""
      });

      router.push(getRoleRedirectPath(profile.role));
    } catch (registerError) {
      const message =
        registerError instanceof Error ? registerError.message : "Registration failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setGoogleLoading(true);
      setError("");
      const profile = await signInWithGoogle(form.role);
      router.push(getRoleRedirectPath(profile.role));
    } catch (signInError) {
      const message =
        signInError instanceof Error ? signInError.message : "Google sign-in failed.";
      setError(message);
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <section className="page-shell flex min-h-[calc(100vh-7rem)] items-center py-8 lg:py-12">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="glass-card relative overflow-hidden"
        >
          <div className="hero-orb left-[-5rem] top-12 h-40 w-40 bg-emerald-400/14" />
          <div className="hero-orb bottom-[-3rem] right-[-2rem] h-52 w-52 bg-cyan-400/12" />
          <div className="relative z-10">
            <div className="section-kicker">
              <Sparkles className="h-4 w-4" />
              Join EcoPlate
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Create a modern account and start reducing food waste.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              Restaurants can donate surplus meals, charities can request support, and the whole experience stays clean, responsive, and easy to present.
            </p>

            <div className="mt-12 space-y-4">
              {[
                "Restaurants can publish donations and advertisements from one dashboard.",
                "Charities can browse available food and send donation requests quickly.",
                "Admin accounts should still be created manually for security and demo control."
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] px-5 py-4 text-sm leading-7 text-slate-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.04, ease: "easeOut" }}
          onSubmit={handleSubmit}
          className="card relative overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-500/12 to-transparent" />

          <div className="relative mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">
              Register
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              Create your EcoPlate profile
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Choose your role, enter the key organization details, and get started in minutes.
            </p>
          </div>

          <div className="mb-6">
            <label className="label">Role</label>
            <div className="grid grid-cols-2 gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-2">
              {roleOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, role: option.value }))}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    form.role === option.value
                      ? "bg-white/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <AvatarUpload
              value={form.avatar64}
              name={form.name}
              onChange={(avatar64) => setForm((current) => ({ ...current, avatar64 }))}
              disabled={loading || googleLoading}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <UserRound className="auth-icon" />
                <input
                  className="auth-input"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Green Leaf Restaurant"
                />
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="auth-icon" />
                <input
                  type="email"
                  className="auth-input"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="label">Phone</label>
              <div className="relative">
                <Phone className="auth-icon" />
                <input
                  className="auth-input"
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, phone: event.target.value }))
                  }
                  placeholder="+94 77 123 4567"
                />
              </div>
            </div>

            <div>
              <label className="label">Address</label>
              <div className="relative">
                <MapPinHouse className="auth-icon" />
                <input
                  className="auth-input"
                  value={form.address}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, address: event.target.value }))
                  }
                  placeholder="Enter your address"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <LockKeyhole className="auth-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="auth-input"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="auth-action"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <LockKeyhole className="auth-icon" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="auth-input"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, confirmPassword: event.target.value }))
                  }
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="auth-action"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error ? (
            <p className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </p>
          ) : null}

          <div className="mt-6 space-y-4">
            <button type="submit" className="btn-primary w-full" disabled={loading || googleLoading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[rgba(16,34,53,0.95)] px-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Or
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-emerald-400/40 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.8 1.5l2.6-2.6C16.8 2.9 14.6 2 12 2 6.9 2 2.8 6.2 2.8 11.4S6.9 20.8 12 20.8c6.9 0 9.1-4.8 9.1-7.3 0-.5-.1-.9-.1-1.3H12Z"
                />
                <path
                  fill="#34A853"
                  d="M2.8 7.3l3.2 2.3c.9-2.1 3-3.6 6-3.6 1.9 0 3.1.8 3.8 1.5l2.6-2.6C16.8 2.9 14.6 2 12 2 8 2 4.5 4.3 2.8 7.3Z"
                />
                <path
                  fill="#4A90E2"
                  d="M12 20.8c2.5 0 4.7-.8 6.3-2.3l-2.9-2.4c-.8.6-1.9 1-3.4 1-3.9 0-5.2-2.6-5.5-3.9l-3.2 2.5c1.6 3.1 5 5.1 8.7 5.1Z"
                />
                <path
                  fill="#FBBC05"
                  d="M2.8 15.7l3.2-2.5c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8L2.8 7.3c-.6 1.2-.9 2.6-.9 4.1s.3 2.9.9 4.3Z"
                />
              </svg>
              {googleLoading ? "Connecting to Google..." : "Continue with Google"}
            </button>

            <p className="text-sm text-slate-400">
              Already registered?{" "}
              <Link href="/login" className="font-semibold text-emerald-300">
                Login
              </Link>
            </p>
          </div>
        </motion.form>
      </div>
    </section>
  );
}
