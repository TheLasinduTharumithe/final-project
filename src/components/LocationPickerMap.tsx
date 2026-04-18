"use client";

import dynamic from "next/dynamic";
import type { LeafletMouseEvent } from "leaflet";
import { LocateFixed, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

interface LocationPickerMapProps {
  latitude?: number;
  longitude?: number;
  onChange: (coords: { latitude: number; longitude: number }) => void;
  disabled?: boolean;
}

interface LocationPickerMapInnerProps extends LocationPickerMapProps {
  markerReady: boolean;
  onUseCurrentLocation: () => void;
  geolocationLoading: boolean;
}

function MapLoadingState() {
  return (
    <div className="map-card flex h-[320px] items-center justify-center bg-white/[0.04] text-sm text-slate-400">
      Loading map...
    </div>
  );
}

const ClientLocationPickerMap = dynamic<LocationPickerMapInnerProps>(
  async () => {
    const { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } = await import(
      "react-leaflet"
    );

    function LocationPickerMapInner({
      latitude,
      longitude,
      onChange,
      disabled = false,
      markerReady,
      onUseCurrentLocation,
      geolocationLoading
    }: LocationPickerMapInnerProps) {
      const defaultCenter: [number, number] =
        typeof latitude === "number" && typeof longitude === "number"
          ? [latitude, longitude]
          : [6.9271, 79.8612];

      function MapClickHandler() {
        useMapEvents({
          click(event: LeafletMouseEvent) {
            if (disabled) {
              return;
            }

            onChange({
              latitude: Number(event.latlng.lat.toFixed(6)),
              longitude: Number(event.latlng.lng.toFixed(6))
            });
          }
        });

        return null;
      }

      function RecenterMap() {
        const map = useMap();

        useEffect(() => {
          if (typeof latitude === "number" && typeof longitude === "number") {
            map.flyTo([latitude, longitude], Math.max(map.getZoom(), 14), {
              duration: 0.75
            });
          }
        }, [latitude, longitude, map]);

        return null;
      }

      return (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Pickup location on map</p>
              <p className="mt-1 text-sm text-slate-300">
                Click anywhere on the map to place or move the marker.
              </p>
            </div>
            <button
              type="button"
              onClick={onUseCurrentLocation}
              className="btn-light"
              disabled={disabled || geolocationLoading}
            >
              <LocateFixed className="h-4 w-4" />
              {geolocationLoading ? "Getting location..." : "Use My Current Location"}
            </button>
          </div>

          <div className="map-card h-[320px]">
            <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler />
              <RecenterMap />
              {markerReady && typeof latitude === "number" && typeof longitude === "number" ? (
                <Marker position={[latitude, longitude]}>
                  <Popup>Selected pickup location</Popup>
                </Marker>
              ) : null}
            </MapContainer>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Latitude
              </p>
              <p className="mt-2 text-sm font-medium text-white">
                {typeof latitude === "number" ? latitude.toFixed(6) : "Not selected"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Longitude
              </p>
              <p className="mt-2 text-sm font-medium text-white">
                {typeof longitude === "number" ? longitude.toFixed(6) : "Not selected"}
              </p>
            </div>
          </div>

          {typeof latitude !== "number" || typeof longitude !== "number" ? (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
              Select a pickup location on the map before saving the donation.
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Marker selected and ready to save.
              </div>
            </div>
          )}
        </div>
      );
    }

    return LocationPickerMapInner;
  },
  {
    ssr: false,
    loading: () => <MapLoadingState />
  }
);

export default function LocationPickerMap(props: LocationPickerMapProps) {
  const [markerReady, setMarkerReady] = useState(false);
  const [geolocationLoading, setGeolocationLoading] = useState(false);
  const [geolocationError, setGeolocationError] = useState("");

  useEffect(() => {
    let isActive = true;

    import("leaflet")
      .then((leaflet) => {
        if (!isActive) {
          return;
        }

        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
        });
        setMarkerReady(true);
      })
      .catch(() => {
        if (isActive) {
          setMarkerReady(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setGeolocationError("Geolocation is not supported in this browser.");
      return;
    }

    setGeolocationLoading(true);
    setGeolocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        props.onChange({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6))
        });
        setGeolocationLoading(false);
      },
      () => {
        setGeolocationLoading(false);
        setGeolocationError(
          "Could not access your current location. Please allow location access or click on the map."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    );
  }

  return (
    <div className="space-y-3">
      <ClientLocationPickerMap
        {...props}
        markerReady={markerReady}
        onUseCurrentLocation={handleUseCurrentLocation}
        geolocationLoading={geolocationLoading}
      />

      {geolocationError ? (
        <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {geolocationError}
        </p>
      ) : null}
    </div>
  );
}
