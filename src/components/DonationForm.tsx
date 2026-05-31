"use client";

import { CalendarDays, Clock3 } from "lucide-react";
import { useRef, useState } from "react";
import ImageUpload from "@/components/ImageUpload";
import LocationPickerMap from "@/components/LocationPickerMap";
import type { DonationStatus } from "@/types";

export interface DonationFormValues {
  foodName: string;
  quantity: string;
  description: string;
  pickupLocation: string;
  pickupTime: string;
  expiryDate: string;
  status: DonationStatus;
  image64?: string;
  latitude?: number;
  longitude?: number;
  locationText?: string;
}

interface DonationFormProps {
  initialValues?: Partial<DonationFormValues>;
  onSubmit: (values: DonationFormValues) => Promise<void>;
  submitLabel: string;
  showStatusField?: boolean;
}

const defaultValues: DonationFormValues = {
  foodName: "",
  quantity: "",
  description: "",
  pickupLocation: "",
  pickupTime: "",
  expiryDate: "",
  status: "available",
  image64: "",
  latitude: undefined,
  longitude: undefined,
  locationText: ""
};

function getDatePart(value: string) {
  return value?.includes("T") ? value.split("T")[0] : "";
}

function getTimePart(value: string) {
  if (!value?.includes("T")) {
    return "";
  }

  return value.split("T")[1]?.slice(0, 5) || "";
}

function combineDateAndTime(date: string, time: string) {
  if (!date || !time) {
    return "";
  }

  return `${date}T${time}`;
}

function openNativePicker(input: HTMLInputElement | null) {
  if (!input) {
    return;
  }

  input.focus();

  if ("showPicker" in input && typeof input.showPicker === "function") {
    input.showPicker();
  }
}

export default function DonationForm({
  initialValues,
  onSubmit,
  submitLabel,
  showStatusField = false
}: DonationFormProps) {
  const startingValues = {
    ...defaultValues,
    ...initialValues
  };

  const [form, setForm] = useState<DonationFormValues>(startingValues);
  const [pickupDate, setPickupDate] = useState(getDatePart(startingValues.pickupTime));
  const [pickupClock, setPickupClock] = useState(getTimePart(startingValues.pickupTime));
  const [expiryCalendarDate, setExpiryCalendarDate] = useState(getDatePart(startingValues.expiryDate));
  const [expiryClock, setExpiryClock] = useState(getTimePart(startingValues.expiryDate));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pickupDateRef = useRef<HTMLInputElement | null>(null);
  const pickupTimeRef = useRef<HTMLInputElement | null>(null);
  const expiryDateRef = useRef<HTMLInputElement | null>(null);
  const expiryTimeRef = useRef<HTMLInputElement | null>(null);

  function updateField<K extends keyof DonationFormValues>(key: K, value: DonationFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const pickupTime = combineDateAndTime(pickupDate, pickupClock);
    const expiryDate = combineDateAndTime(expiryCalendarDate, expiryClock);

    if (
      !form.foodName ||
      !form.quantity ||
      !form.description ||
      !form.pickupLocation ||
      !pickupTime ||
      !expiryDate ||
      typeof form.latitude !== "number" ||
      typeof form.longitude !== "number"
    ) {
      setError(
        "Please fill in all fields, including pickup date/time, valid until date/time, and map location."
      );
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        ...form,
        pickupTime,
        expiryDate
      });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <fieldset className="card space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-[#1F2937]">Food details</h2>
          <p className="mt-1 text-sm leading-6 text-[#6B7280]">
            Help charities quickly understand what is available and how it should be handled.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="foodName" className="label">Food name</label>
            <input
              id="foodName"
              className="input"
              value={form.foodName}
              onChange={(event) => updateField("foodName", event.target.value)}
              placeholder="Rice packs, sandwiches, fresh fruit"
              required
            />
          </div>
          <div>
            <label htmlFor="quantity" className="label">Quantity</label>
            <input
              id="quantity"
              className="input"
              value={form.quantity}
              onChange={(event) => updateField("quantity", event.target.value)}
              placeholder="50 meal boxes"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="label">Description</label>
          <textarea
            id="description"
            className="input min-h-[120px]"
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Include food type, storage notes, and special handling details."
            required
          />
        </div>

        <ImageUpload
          value={form.image64}
          onChange={(image64) => updateField("image64", image64)}
          label="Donation Image"
          helperText="Upload one clear image for this donation post. The image is compressed and stored directly in Firestore."
        />
      </fieldset>

      <fieldset className="card space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-[#1F2937]">Pickup coordination</h2>
          <p className="mt-1 text-sm leading-6 text-[#6B7280]">
            Pin the location and add practical notes so pickup teams can arrive prepared.
          </p>
        </div>

        <div>
          <label className="label">Pickup location on map</label>
          <LocationPickerMap
            latitude={form.latitude}
            longitude={form.longitude}
            onChange={({ latitude, longitude }) =>
              setForm((current) => ({
                ...current,
                latitude,
                longitude
              }))
            }
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="locationText" className="label">Location note (optional)</label>
          <input
            id="locationText"
            className="input"
            value={form.locationText || ""}
            onChange={(event) => updateField("locationText", event.target.value)}
            placeholder="Front gate pickup, side entrance, loading dock, etc."
          />
        </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="pickupLocation" className="label">Pickup address or desk</label>
          <input
            id="pickupLocation"
            className="input"
            value={form.pickupLocation}
            onChange={(event) => updateField("pickupLocation", event.target.value)}
            placeholder="Restaurant address or pickup desk"
            required
          />
        </div>

        <div className="space-y-3">
          <label className="label">Pickup time</label>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative">
              <CalendarDays className="auth-icon" />
              <input
                ref={pickupDateRef}
                aria-label="Pickup date"
                type="date"
                className="auth-input"
                value={pickupDate}
                onChange={(event) => setPickupDate(event.target.value)}
                required
              />
              <button
                type="button"
                className="auth-action"
                onClick={() => openNativePicker(pickupDateRef.current)}
                aria-label="Open pickup date picker"
              >
                <CalendarDays className="h-4 w-4" />
              </button>
            </div>
            <div className="relative">
              <Clock3 className="auth-icon" />
              <input
                ref={pickupTimeRef}
                aria-label="Pickup clock time"
                type="time"
                className="auth-input"
                value={pickupClock}
                onChange={(event) => setPickupClock(event.target.value)}
                required
              />
              <button
                type="button"
                className="auth-action"
                onClick={() => openNativePicker(pickupTimeRef.current)}
                aria-label="Open pickup time picker"
              >
                <Clock3 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3">
          <label className="label">Valid until</label>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative">
              <CalendarDays className="auth-icon" />
              <input
                ref={expiryDateRef}
                aria-label="Expiry date"
                type="date"
                className="auth-input"
                value={expiryCalendarDate}
                onChange={(event) => setExpiryCalendarDate(event.target.value)}
                required
              />
              <button
                type="button"
                className="auth-action"
                onClick={() => openNativePicker(expiryDateRef.current)}
                aria-label="Open expiry date picker"
              >
                <CalendarDays className="h-4 w-4" />
              </button>
            </div>
            <div className="relative">
              <Clock3 className="auth-icon" />
              <input
                ref={expiryTimeRef}
                aria-label="Expiry clock time"
                type="time"
                className="auth-input"
                value={expiryClock}
                onChange={(event) => setExpiryClock(event.target.value)}
                required
              />
              <button
                type="button"
                className="auth-action"
                onClick={() => openNativePicker(expiryTimeRef.current)}
                aria-label="Open expiry time picker"
              >
                <Clock3 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {showStatusField ? (
          <div>
            <label htmlFor="status" className="label">Status</label>
            <select
              id="status"
              className="input"
              value={form.status}
              onChange={(event) => updateField("status", event.target.value as DonationStatus)}
            >
              <option value="available">available</option>
              <option value="requested">requested</option>
              <option value="completed">completed</option>
              <option value="cancelled">cancelled</option>
            </select>
          </div>
        ) : null}
      </div>
      </fieldset>

      {error ? (
        <p className="rounded-md border border-[#DC2626]/30 bg-[#FEE2E2] px-4 py-3 text-sm text-[#991B1B]" role="alert">{error}</p>
      ) : null}

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={loading}>
        {loading ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
