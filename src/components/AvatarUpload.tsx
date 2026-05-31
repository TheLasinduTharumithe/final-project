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
    <div className="space-y-4 rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative">
          {previewSrc ? (
            <img
              src={previewSrc}
              alt="Profile avatar preview"
              className="h-20 w-20 rounded-lg border border-[#E5E7EB] object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-[#A5D6A7] text-2xl font-semibold text-[#1F2937]">
              {initials}
            </div>
          )}

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute -bottom-1 -right-1 inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#D1D5DB] bg-[#F8F6F0] text-[#1F2937] shadow-sm transition hover:bg-[#F3F4F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]/30 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={disabled || loading}
            aria-label="Choose avatar image"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold text-[#1F2937]">Profile image</p>
          <p className="mt-1 text-sm leading-6 text-[#6B7280]">
            Upload a square-style JPG, PNG, or WebP image. Large avatars are compressed before saving.
          </p>
          <p className="mt-1 text-xs text-[#6B7280]">
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
            className="danger-button"
            disabled={disabled || loading}
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-md border border-[#DC2626]/30 bg-[#FEE2E2] px-4 py-3 text-sm text-[#991B1B]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
