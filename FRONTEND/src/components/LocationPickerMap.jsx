import { useEffect, useRef, useState } from "react";
import { GOOGLE_MAPS_API_KEY, reverseGeocode } from "../utils/geocode.js";

const DELHI_CENTER = { lat: 28.6139, lng: 77.209 };
const SCRIPT_ID = "civiclens-location-picker-maps";
let loaderPromise;

function loadGoogleMaps() {
  if (window.google?.maps?.Map) {
    return Promise.resolve(window.google.maps);
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(
      new Error("Missing VITE_GOOGLE_MAPS_API_KEY. Add it in FRONTEND/.env.")
    );
  }

  if (loaderPromise) {
    return loaderPromise;
  }

  loaderPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);

    const onLoad = () => {
      if (window.google?.maps?.Map) {
        resolve(window.google.maps);
      } else {
        reject(new Error("Google Maps loaded, but Maps API is unavailable."));
      }
    };

    const onError = () => reject(new Error("Failed to load Google Maps script."));

    if (existing) {
      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener("error", onError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    document.head.appendChild(script);
  });

  return loaderPromise;
}

function LocationPickerMap({ selectedLocation, onLocationSelect }) {
  const mapRef = useRef(null);
  const mapNodeRef = useRef(null);
  const markerRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    void loadGoogleMaps()
      .then(() => {
        if (!alive || mapRef.current || !mapNodeRef.current) return;

        mapRef.current = new window.google.maps.Map(mapNodeRef.current, {
          center: DELHI_CENTER,
          zoom: 10,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        mapRef.current.addListener("click", async (event) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();

          if (!markerRef.current) {
            markerRef.current = new window.google.maps.Marker({
              map: mapRef.current,
              position: { lat, lng },
            });
          } else {
            markerRef.current.setPosition({ lat, lng });
          }

          try {
            const name = await reverseGeocode(lat, lng);
            onLocationSelect?.({ lat, lng, name });
          } catch (err) {
            console.error(err);
            onLocationSelect?.({
              lat,
              lng,
              name: `Selected location (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
            });
          }
        });
      })
      .catch((err) => {
        console.error(err);
        if (alive) setError(err.message || "Failed to load location picker map.");
      });

    return () => {
      alive = false;
    };
  }, [onLocationSelect]);

  useEffect(() => {
    if (!mapRef.current || !selectedLocation) return;

    const lat = Number(selectedLocation.lat);
    const lng = Number(selectedLocation.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const position = { lat, lng };

    if (!markerRef.current) {
      markerRef.current = new window.google.maps.Marker({
        map: mapRef.current,
        position,
      });
    } else {
      markerRef.current.setPosition(position);
    }

    mapRef.current.setCenter(position);
    mapRef.current.setZoom(14);
  }, [selectedLocation]);

  return (
    <div
      style={{
        display: "grid",
        gap: "0.7rem",
        padding: "0.95rem",
        borderRadius: "18px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div>
        <div style={{ fontSize: "0.86rem", opacity: 0.74 }}>Location picker</div>
        <div style={{ marginTop: "0.25rem", fontWeight: 700 }}>
          Click on the map to select the complaint location
        </div>
      </div>

      {error ? (
        <div
          style={{
            padding: "0.85rem 1rem",
            borderRadius: "14px",
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.24)",
          }}
        >
          {error}
        </div>
      ) : null}

      <div
        ref={mapNodeRef}
        style={{
          width: "100%",
          minHeight: "260px",
          borderRadius: "16px",
          overflow: "hidden",
          background: "rgba(255,255,255,0.04)",
        }}
      />

      {selectedLocation ? (
        <div
          style={{
            padding: "0.75rem 0.85rem",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            lineHeight: 1.6,
          }}
        >
          <strong>Selected:</strong> {selectedLocation.name || "Location selected"}
        </div>
      ) : null}
    </div>
  );
}

export default LocationPickerMap;