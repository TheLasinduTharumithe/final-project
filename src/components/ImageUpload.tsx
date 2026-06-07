"use client";

// Purpose: Image upload control that previews and compresses donation photos.

import { ImagePlus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import {
  IMAGE_LIMITS,
  processAdImage,
  processDonationImage,
  safePreviewSrc,
  validateImageType
} from "@/lib/image";

interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
  helperText?: string;
  variant?: "donation" | "ad";
}

export default function ImageUpload({
  value = "",
  onChange,
  disabled = false,
  label = "Donation Image",
  helperText = "Upload one JPG, PNG, or WebP image. Large images are compressed automatically.",
  variant = "donation"
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const previewSrc = safePreviewSrc(value);
  const maxRawBytes =
    variant === "ad" ? IMAGE_LIMITS.adRawBytes : IMAGE_LIMITS.donationRawBytes;
  const processImage = variant === "ad" ? processAdImage : processDonationImage;
  const chooseLabel = variant === "ad" ? "Choose ad image" : "Choose donation image";

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
      const image64 = await processImage(file);
      onChange(image64);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "Could not process the image.";
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
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="label mb-0">{label}</label>
        <span className="text-xs text-[#6B7280]">
          Max raw file: {(maxRawBytes / (1024 * 1024)).toFixed(0)} MB
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => handleFileSelect(event.target.files?.[0] || null)}
        disabled={disabled || loading}
      />

      {previewSrc ? (
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
          <div className="aspect-[16/10] overflow-hidden bg-[#F8F6F0]">
            <img src={previewSrc} alt={`${label} preview`} className="h-full w-full object-cover" />
          </div>

          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[#1F2937]">Image ready</p>
              <p className="mt-1 text-xs leading-6 text-[#6B7280]">{helperText}</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="btn-light"
                disabled={disabled || loading}
              >
                <Upload className="h-4 w-4" />
                Change
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="danger-button"
                disabled={disabled || loading}
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-[#D1D5DB] bg-[#F8F6F0] px-6 py-10 text-center transition hover:border-[#A5D6A7] hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
          disabled={disabled || loading}
        >
          <div className="feature-icon-wrap border-[#E5E7EB] bg-[#FAFAF8] text-[#2E7D32]">
            <ImagePlus className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm font-semibold text-[#1F2937]">
            {loading ? "Processing image..." : chooseLabel}
          </p>
          <p className="mt-2 max-w-md text-sm leading-6 text-[#6B7280]">{helperText}</p>
        </button>
      )}

      {error ? (
        <p className="rounded-md border border-[#DC2626]/30 bg-[#FEE2E2] px-4 py-3 text-sm text-[#991B1B]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
