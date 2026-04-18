"use client";

import { useState } from "react";
import ImageUpload from "@/components/ImageUpload";

export interface AdFormValues {
  title: string;
  description: string;
  contactNumber: string;
  imageUrl: string;
}

interface AdFormProps {
  onSubmit: (values: AdFormValues) => Promise<void>;
  disabled?: boolean;
}

export default function AdForm({ onSubmit, disabled = false }: AdFormProps) {
  const [form, setForm] = useState<AdFormValues>({
    title: "",
    description: "",
    contactNumber: "",
    imageUrl: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.title || !form.description || !form.contactNumber || !form.imageUrl) {
      setError("Please fill in all fields and upload an image.");
      return;
    }

    try {
      setLoading(true);
      await onSubmit(form);
      setForm({
        title: "",
        description: "",
        contactNumber: "",
        imageUrl: ""
      });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Could not save the ad.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      <div>
        <label className="label">Ad Title</label>
        <input
          className="input"
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          placeholder="Weekend buffet promotion"
          disabled={disabled || loading}
        />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="input min-h-[120px]"
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
          placeholder="Tell users about your restaurant, offer, or campaign."
          disabled={disabled || loading}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="label">Contact Number</label>
          <input
            className="input"
            value={form.contactNumber}
            onChange={(event) =>
              setForm((current) => ({ ...current, contactNumber: event.target.value }))
            }
            placeholder="+94 77 123 4567"
            disabled={disabled || loading}
          />
        </div>
        <div className="md:col-span-1">
          <ImageUpload
            value={form.imageUrl}
            onChange={(value) => setForm((current) => ({ ...current, imageUrl: value }))}
            disabled={disabled || loading}
            variant="ad"
            label="Ad Image"
            helperText="Upload one JPG, PNG, or WebP image for your restaurant ad. Large images are compressed automatically."
          />
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="btn-primary w-full sm:w-auto"
        disabled={loading || disabled}
      >
        {loading ? "Uploading..." : "Submit Advertisement"}
      </button>
    </form>
  );
}
