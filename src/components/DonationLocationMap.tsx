"use client";

// Purpose: Read-only map component for showing donation pickup locations.

import dynamic from "next/dynamic";
import { LocateFixed, MapPin, Route } from "lucide-react";
import { useEffect, useState } from "react";

interface DonationLocationMapProps {
  latitude?: number;
  longitude?: number;
  foodName: string;
  pickupLocation: string;
  restaurantName?: string;
  enableRoute?: boolean;
}

interface DonationLocationMapInnerProps extends DonationLocationMapProps {
  markerReady: boolean;
}

function MapLoadingState() {
  return (
    <div className="map-card flex h-[300px] items-center justify-center bg-[#FAFAF8] text-sm text-[#6B7280]">
      Loading location map...
    </div>
  );
}

const ClientDonationLocationMap = dynamic<DonationLocationMapInnerProps>(
  async () => {
    const { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } = await import(
      "react-leaflet"
    );

    function DonationLocationMapInner({
      latitude,
      longitude,
      foodName,
      pickupLocation,
      restaurantName,
      markerReady,
      enableRoute = false
    }: DonationLocationMapInnerProps) {
      const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
      const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
      const [distanceKm, setDistanceKm] = useState<number | null>(null);
      const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
      const [routeLoading, setRouteLoading] = useState(false);
      const [routeError, setRouteError] = useState("");

      if (typeof latitude !== "number" || typeof longitude !== "number") {
        return (
          <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] px-5 py-6 text-sm text-[#6B7280]">
            Location not available.
          </div>
        );
      }

      const destination: [number, number] = [latitude, longitude];

      function RouteViewport() {
        const map = useMap();

        useEffect(() => {
          if (routeCoordinates.length > 1) {
            map.fitBounds(routeCoordinates, { padding: [32, 32] });
            return;
          }

          map.setView(destination, 14);
        }, [destination, map, routeCoordinates]);

        return null;
      }

      async function handleShowRoute() {
        if (!navigator.geolocation) {
          setRouteError("Geolocation is not supported in this browser.");
          return;
        }

        setRouteLoading(true);
        setRouteError("");

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const fromLat = Number(position.coords.latitude.toFixed(6));
            const fromLng = Number(position.coords.longitude.toFixed(6));
            setCurrentLocation([fromLat, fromLng]);

            try {
              const response = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${longitude},${latitude}?overview=full&geometries=geojson`
              );

              if (!response.ok) {
                throw new Error("Could not fetch the route right now.");
              }

              const data = (await response.json()) as {
                routes?: Array<{
                  distance: number;
                  duration: number;
                  geometry: { coordinates: [number, number][] };
                }>;
              };

              const route = data.routes?.[0];

              if (!route) {
                throw new Error("Route not available for this location.");
              }

              setRouteCoordinates(
                route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])
              );
              setDistanceKm(Number((route.distance / 1000).toFixed(1)));
              setDurationMinutes(Math.max(1, Math.round(route.duration / 60)));
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Could not load the route.";
              setRouteError(message);
              setRouteCoordinates([]);
              setDistanceKm(null);
              setDurationMinutes(null);
            } finally {
              setRouteLoading(false);
            }
          },
          () => {
            setRouteLoading(false);
            setRouteError(
              "Could not access your current location. Please allow location access and try again."
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
          {enableRoute ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1F2937]">Pickup route for charity</p>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Use your current location to draw a pickup route with OSRM.
                </p>
              </div>
              <button
                type="button"
                onClick={handleShowRoute}
                className="btn-light"
                disabled={routeLoading}
              >
                <LocateFixed className="h-4 w-4" />
                {routeLoading ? "Loading route..." : "Show Route"}
              </button>
            </div>
          ) : null}

          <div className="map-card h-[300px]">
            <MapContainer center={destination} zoom={14} scrollWheelZoom>
              <RouteViewport />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {routeCoordinates.length > 1 ? (
                <Polyline positions={routeCoordinates} pathOptions={{ color: "#10b981", weight: 5 }} />
              ) : null}
              {markerReady && currentLocation ? (
                <Marker position={currentLocation}>
                  <Popup>Your current location</Popup>
                </Marker>
              ) : null}
              {markerReady ? (
                <Marker position={destination}>
                  <Popup>
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold">{foodName}</p>
                      <p>{pickupLocation}</p>
                      {restaurantName ? <p>{restaurantName}</p> : null}
                    </div>
                  </Popup>
                </Marker>
              ) : null}
            </MapContainer>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6B7280]">
                Latitude
              </p>
              <p className="mt-2 text-sm font-medium text-[#1F2937]">{latitude.toFixed(6)}</p>
            </div>
            <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6B7280]">
                Longitude
              </p>
              <p className="mt-2 text-sm font-medium text-[#1F2937]">{longitude.toFixed(6)}</p>
            </div>
          </div>

          {distanceKm !== null && durationMinutes !== null ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6B7280]">
                  Route Distance
                </p>
                <p className="mt-2 text-sm font-medium text-[#1F2937]">{distanceKm} km</p>
              </div>
              <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6B7280]">
                  Estimated Time
                </p>
                <p className="mt-2 text-sm font-medium text-[#1F2937]">{durationMinutes} min</p>
              </div>
            </div>
          ) : null}

          <div className="rounded-lg border border-[#A5D6A7] bg-[#E8F5E9] px-4 py-3 text-sm text-[#2E7D32]">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Pickup location is pinned on the map.
            </div>
          </div>

          {routeError ? (
            <div className="rounded-lg border border-[#DC2626]/30 bg-[#FEE2E2] px-4 py-3 text-sm text-[#B91C1C]">
              {routeError}
            </div>
          ) : null}

          {routeCoordinates.length > 1 ? (
            <div className="rounded-lg border border-[#2563EB]/30 bg-[#DBEAFE] px-4 py-3 text-sm text-[#2563EB]">
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4" />
                OSRM route is shown from your location to the donation pickup point.
              </div>
            </div>
          ) : null}
        </div>
      );
    }

    return DonationLocationMapInner;
  },
  {
    ssr: false,
    loading: () => <MapLoadingState />
  }
);

export default function DonationLocationMap(props: DonationLocationMapProps) {
  const [markerReady, setMarkerReady] = useState(false);

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

  return <ClientDonationLocationMap {...props} markerReady={markerReady} />;
}
