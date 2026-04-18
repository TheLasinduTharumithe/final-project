"use client";

import { Camera, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import {
  IMAGE_LIMITS,
  getInitials,
  processAvatarImage,
  safePreviewSrc,
  validateImageType
} from "@/lib/image";

interface AvatarUploadProps {
  value?: string;
  name?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function AvatarUpload({
  value = "",
  name = "",
  onChange,
  disabled = false
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const previewSrc = safePreviewSrc(value);
  const initials = getInitials(name);

  async function handleFileSelect(file: File | null) {
    if (!file) {
      return;
    }

    const quickTypeError = validateImageType(file);

    if (quickTypeError) {
      setError(quickTypeError);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const image64 = await processAvatarImage(file);
      onChange(image64);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "Could not process the avatar.";
      setError(message);
    } finally {
      setLoading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function handleRemove() {
    setError("");
    onChange("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4 rounded-[1.9rem] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative">
          {previewSrc ? (
            <img
              src={previewSrc}
              alt="Profile avatar preview"
              className="h-24 w-24 rounded-full border border-white/10 object-cover shadow-[0_12px_28px_rgba(2,6,23,0.18)]"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-2xl font-semibold text-slate-950 shadow-[0_16px_28px_rgba(16,185,129,0.22)]">
              {initials}
            </div>
          )}

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute -bottom-1 -right-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white bg-slate-950 text-white shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={disabled || loading}
            aria-label="Choose avatar image"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Profile image</p>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            Upload a square-style JPG, PNG, or WebP image. Large avatars are compressed before saving.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Max raw file: {(IMAGE_LIMITS.avatarRawBytes / (1024 * 1024)).toFixed(1)} MB
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => handleFileSelect(event.target.files?.[0] || null)}
        disabled={disabled || loading}
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="btn-light"
          disabled={disabled || loading}
        >
          <Upload className="h-4 w-4" />
          {loading ? "Processing..." : previewSrc ? "Change image" : "Upload image"}
        </button>

        {previewSrc ? (
          <button
            type="button"
            onClick={handleRemove}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={disabled || loading}
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
