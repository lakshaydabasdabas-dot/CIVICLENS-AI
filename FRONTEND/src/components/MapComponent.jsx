import { useEffect, useMemo, useRef, useState } from "react";
import { GOOGLE_MAPS_API_KEY } from "../utils/geocode.js";

const DELHI_CENTER = { lat: 28.6139, lng: 77.209 };
const SCRIPT_ID = "civiclens-google-maps";
let loaderPromise;

function loadGoogleMaps() {
  if (window.google?.maps?.Map && window.google.maps.visualization?.HeatmapLayer) {
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
      if (window.google?.maps?.Map && window.google.maps.visualization?.HeatmapLayer) {
        resolve(window.google.maps);
      } else {
        reject(new Error("Google Maps loaded, but visualization library is unavailable."));
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=visualization`;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    document.head.appendChild(script);
  });

  return loaderPromise;
}

function markerColorForComplaint(complaint) {
  if (complaint?.duplicate_of) return "#60a5fa";

  const urgency = String(complaint?.urgency || "").toUpperCase();
  if (urgency === "HIGH") return "#ef4444";
  if (urgency === "MEDIUM") return "#f59e0b";
  return "#22c55e";
}

function validCoordinates(item) {
  return Number.isFinite(Number(item?.lat)) && Number.isFinite(Number(item?.lng));
}

function MapComponent({ complaints = [] }) {
  const mapNodeRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const heatmapRef = useRef(null);
  const [error, setError] = useState("");

  const plottedComplaints = useMemo(
    () => complaints.filter(validCoordinates),
    [complaints]
  );

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
          fullscreenControl: true,
        });
      })
      .catch((err) => {
        console.error(err);
        if (alive) setError(err.message || "Map failed to load.");
      });

    return () => {
      alive = false;
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
        heatmapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
      heatmapRef.current = null;
    }

    if (!plottedComplaints.length) {
      mapRef.current.setCenter(DELHI_CENTER);
      mapRef.current.setZoom(10);
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();

    plottedComplaints.forEach((complaint) => {
      const position = {
        lat: Number(complaint.lat),
        lng: Number(complaint.lng),
      };

      bounds.extend(position);

      const marker = new window.google.maps.Marker({
        map: mapRef.current,
        position,
        title: complaint.title || "Complaint",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: markerColorForComplaint(complaint),
          fillOpacity: 0.95,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 8,
        },
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="min-width:220px;color:#111827;">
            <div style="font-weight:700;margin-bottom:6px;">${complaint.title || "Complaint"}</div>
            <div style="font-size:12px;margin-bottom:4px;"><strong>Locality:</strong> ${complaint.locality || "UNKNOWN"}</div>
            <div style="font-size:12px;margin-bottom:4px;"><strong>Region:</strong> ${complaint.region || "UNCLASSIFIED"}</div>
            <div style="font-size:12px;margin-bottom:4px;"><strong>Category:</strong> ${complaint.category || "UNASSIGNED"}</div>
            <div style="font-size:12px;margin-bottom:4px;"><strong>Urgency:</strong> ${complaint.urgency || "UNASSIGNED"}</div>
            <div style="font-size:12px;"><strong>Priority:</strong> ${complaint.priority_score ?? "N/A"}</div>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open({
          anchor: marker,
          map: mapRef.current,
        });
      });

      markersRef.current.push(marker);
    });

    heatmapRef.current = new window.google.maps.visualization.HeatmapLayer({
      data: plottedComplaints.map(
        (complaint) =>
          new window.google.maps.LatLng(
            Number(complaint.lat),
            Number(complaint.lng)
          )
      ),
      map: mapRef.current,
      radius: 32,
      opacity: 0.72,
    });

    if (plottedComplaints.length === 1) {
      mapRef.current.setCenter(bounds.getCenter());
      mapRef.current.setZoom(14);
      return;
    }

    mapRef.current.fitBounds(bounds, 72);
  }, [plottedComplaints]);

  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        padding: "1rem",
        borderRadius: "20px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div>
        <h3 style={{ margin: 0 }}>Delhi Heatmap & Complaint Clusters</h3>
        <p style={{ margin: "0.35rem 0 0", opacity: 0.8 }}>
          Marker color shows urgency. Heatmap intensity shows complaint concentration.
        </p>
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
          minHeight: "460px",
          borderRadius: "16px",
          overflow: "hidden",
          background: "rgba(255,255,255,0.04)",
        }}
      />
    </div>
  );
}

export default MapComponent;