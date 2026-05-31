"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getRoleRedirectPath,
  loginUser,
  signInWithGoogle,
  subscribeToAuthState
} from "@/lib/auth";
import { getUserProfile } from "@/services/users";

const roleOptions = [
  { value: "restaurant", label: "Restaurant" },
  { value: "charity", label: "Charity" }
] as const;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nextPath, setNextPath] = useState("");
  const [role, setRole] = useState<"restaurant" | "charity">("restaurant");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    setNextPath(new URLSearchParams(window.location.search).get("next") || "");

    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (!firebaseUser) {
        return;
      }

      try {
        const profile = await getUserProfile(firebaseUser.uid);

        if (profile) {
          router.replace(getRoleRedirectPath(profile.role));
        }
      } catch {
        return;
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      const profile = await loginUser(email, password);
      const redirectTarget =
        nextPath || new URLSearchParams(window.location.search).get("next") || "";

      router.push(redirectTarget || getRoleRedirectPath(profile.role));
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : "Login failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setGoogleLoading(true);
      setError("");
      const profile = await signInWithGoogle(role);
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
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="glass-card"
        >
          <p className="page-eyebrow">Workspace access</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-[#1F2937]">
            Sign in to continue EcoPlate operations.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6B7280]">
            Use the same account your organization uses for donation, request, advertisement, or admin work.
          </p>

          <div className="mt-8 space-y-3">
            {[
              {
                title: "Role-aware workspace",
                description: "Restaurants, charities, and admins land in the workflow meant for them.",
                icon: ShieldCheck
              },
              {
                title: "Fast coordination",
                description: "Move from donation listing to request handling with fewer steps.",
                icon: ArrowRight
              }
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="flex gap-3 rounded-md border border-[#E5E7EB] bg-[#FAFAF8] p-3">
                  <div className="feature-icon-wrap">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-[#1F2937]">{item.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-[#6B7280]">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.04, ease: "easeOut" }}
          onSubmit={handleSubmit}
          className="card"
        >
          <div className="relative mb-6">
            <p className="page-eyebrow">
              Login
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#1F2937]">
              Access your EcoPlate workspace
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#6B7280]">
              Continue with email and password or use Google for a quicker sign-in.
            </p>
          </div>

          <div className="mb-6">
            <span className="label">Role</span>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-[#E5E7EB] bg-[#F8F6F0] p-1.5">
              {roleOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  className={`rounded-md px-4 py-3 text-sm font-semibold transition ${
                    role === option.value
                      ? "rounded-md bg-[#2E7D32] text-white"
                      : "rounded-md text-[#6B7280] hover:bg-[#F3F4F1] hover:text-[#1F2937]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-[#6B7280]">
              The selected role is used if a Google account is signing in for the first time.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="loginEmail" className="label">Email</label>
              <div className="relative">
                <Mail className="auth-icon" />
                <input
                  id="loginEmail"
                  type="email"
                  className="auth-input"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="loginPassword" className="label">Password</label>
              <div className="relative">
                <LockKeyhole className="auth-icon" />
                <input
                  id="loginPassword"
                  type={showPassword ? "text" : "password"}
                  className="auth-input"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
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

            {error ? (
              <p className="rounded-md border border-[#DC2626]/30 bg-[#FEE2E2] px-4 py-3 text-sm text-[#991B1B]" role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" className="btn-primary w-full" disabled={loading || googleLoading}>
              {loading ? "Signing in..." : "Login"}
            </button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E5E7EB]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">
                  Or
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="flex w-full items-center justify-center gap-3 rounded-md border border-[#E5E7EB] bg-[#F3F4F1] px-4 py-3 text-sm font-semibold text-[#1F2937] transition hover:border-[#D1D5DB] hover:bg-[#E5E7EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]/30 disabled:cursor-not-allowed disabled:opacity-70"
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

            <p className="text-sm text-[#6B7280]">
              New to EcoPlate?{" "}
              <Link href="/register" className="font-semibold text-[#2E7D32]">
                Create an account
              </Link>
            </p>
          </div>
        </motion.form>
      </div>
    </section>
  );
}
