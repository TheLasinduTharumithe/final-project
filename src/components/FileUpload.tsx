"use client";

// Purpose: Generic file upload control for validating selected documents.

import { useRef, useState } from "react";
import { UploadCloud, X, File as FileIcon } from "lucide-react";

interface FileUploadProps {
  label: string;
  value: string; // Base64 string
  fileName: string;
  onChange: (base64: string, name: string) => void;
  disabled?: boolean;
}

export default function FileUpload({ label, value, fileName, onChange, disabled }: FileUploadProps) {
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG, and PDF files are allowed.");
      return;
    }

    const maxSize = 700 * 1024; // 700KB to safely fit in Firestore's 1MB document limit
    if (file.size > maxSize) {
      setError("File size must be under 700KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      onChange(result, file.name);
    };
    reader.onerror = () => {
      setError("Failed to read file.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onChange("", "");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <label className="label">{label}</label>
      
      {!value ? (
        <button
          type="button"
          onClick={() => !disabled && inputRef.current?.click()}
          className={`mt-2 flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#D1D5DB] bg-[#F8F6F0] p-6 text-center transition hover:border-[#A5D6A7] hover:bg-[#F3F4F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]/30 ${
            disabled ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <UploadCloud className="mb-2 h-8 w-8 text-[#6B7280]" />
          <p className="text-sm font-medium text-[#1F2937]">Click to upload license / certificate</p>
          <p className="mt-1 text-xs text-[#6B7280]">PDF, JPG, PNG (Max 700KB)</p>
        </button>
      ) : (
        <div className="mt-2 flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-white p-4">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#E8F5E9] text-[#2E7D32]">
              <FileIcon className="h-5 w-5" />
            </div>
            <p className="truncate text-sm font-medium text-[#1F2937]">{fileName}</p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="ml-4 rounded-md p-1.5 text-[#6B7280] transition hover:bg-[#FEE2E2] hover:text-[#991B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/30"
            aria-label="Remove uploaded document"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-[#B91C1C]" role="alert">{error}</p>
      )}

      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
      />
    </div>
  );
}
