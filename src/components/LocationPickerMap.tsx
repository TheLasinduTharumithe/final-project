"use client";

// Purpose: Interactive Leaflet map used to choose a pickup latitude and longitude.

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
    <div className="map-card flex h-[320px] items-center justify-center bg-[#FAFAF8] text-sm text-[#6B7280]">
      Loading map...
    </div>
  );
}

const ClientLocationPickerMap = dynamic<LocationPickerMapInnerProps>(
  async () => {
    // Leaflet depends on browser globals, so the map module is loaded client-side only.
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
          // When coordinates change from geolocation or props, keep the marker in view.
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
              <p className="text-sm font-semibold text-[#1F2937]">Pickup location on map</p>
              <p className="mt-1 text-sm text-[#6B7280]">
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
            <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6B7280]">
                Latitude
              </p>
              <p className="mt-2 text-sm font-medium text-[#1F2937]">
                {typeof latitude === "number" ? latitude.toFixed(6) : "Not selected"}
              </p>
            </div>
            <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6B7280]">
                Longitude
              </p>
              <p className="mt-2 text-sm font-medium text-[#1F2937]">
                {typeof longitude === "number" ? longitude.toFixed(6) : "Not selected"}
              </p>
            </div>
          </div>

          {typeof latitude !== "number" || typeof longitude !== "number" ? (
            <div className="rounded-lg border border-[#F59E0B]/35 bg-[#FEF3C7] px-4 py-3 text-sm text-[#92400E]">
              Select a pickup location on the map before saving the donation.
            </div>
          ) : (
            <div className="rounded-lg border border-[#A5D6A7] bg-[#E8F5E9] px-4 py-3 text-sm text-[#2E7D32]">
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

    // Leaflet's default marker assets need explicit URLs in bundled Next.js builds.
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

    // Browser geolocation is optional; users can still click the map if permission fails.
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
        <p className="rounded-lg border border-[#DC2626]/30 bg-[#FEE2E2] px-4 py-3 text-sm text-[#B91C1C]">
          {geolocationError}
        </p>
      ) : null}
    </div>
  );
}
