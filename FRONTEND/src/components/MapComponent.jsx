import { useEffect, useMemo, useRef, useState } from "react";
import { GOOGLE_MAPS_API_KEY } from "../utils/geocode.js";

const DELHI_CENTER = { lat: 28.6139, lng: 77.209 };
const GOOGLE_MAPS_SCRIPT_ID = "civiclens-google-maps-script";
let googleMapsLoaderPromise;

function loadGoogleMapsScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser."));
  }

  if (window.google?.maps?.Map && window.google.maps.visualization?.HeatmapLayer) {
    return Promise.resolve(window.google.maps);
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(
      new Error("Google Maps API key is missing. Add VITE_GOOGLE_MAPS_API_KEY.")
    );
  }

  if (googleMapsLoaderPromise) {
    return googleMapsLoaderPromise;
  }

  googleMapsLoaderPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);

    const handleLoad = () => {
      if (window.google?.maps?.Map && window.google.maps.visualization?.HeatmapLayer) {
        resolve(window.google.maps);
        return;
      }

      googleMapsLoaderPromise = undefined;
      reject(new Error("Google Maps loaded without visualization support."));
    };

    const handleError = () => {
      googleMapsLoaderPromise = undefined;
      reject(new Error("Failed to load Google Maps."));
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}` +
      "&libraries=visualization";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    document.head.appendChild(script);
  });

  return googleMapsLoaderPromise;
}

function hasCoordinates(complaint) {
  return Number.isFinite(Number(complaint?.lat)) && Number.isFinite(Number(complaint?.lng));
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function markerColorForComplaint(complaint) {
  if (complaint?.duplicate_of) return "#60a5fa";

  const urgency = String(complaint?.urgency || "").toUpperCase();
  if (urgency === "HIGH") return "#ef4444";
  if (urgency === "MEDIUM") return "#f59e0b";
  return "#22c55e";
}

function buildInfoWindowContent(complaint) {
  return `
    <div style="min-width:220px; padding:6px 2px; color:#111827;">
      <div style="font-weight:700; font-size:15px; margin-bottom:6px;">
        ${escapeHtml(complaint.title || "Untitled complaint")}
      </div>
      <div style="font-size:13px; margin-bottom:6px;">
        ${escapeHtml(complaint.location || "No location provided")}
      </div>
      <div style="font-size:12px; margin-bottom:4px;">
        <strong>Category:</strong> ${escapeHtml(complaint.category || "UNASSIGNED")}
      </div>
      <div style="font-size:12px; margin-bottom:4px;">
        <strong>Urgency:</strong> ${escapeHtml(complaint.urgency || "UNASSIGNED")}
      </div>
      <div style="font-size:12px; margin-bottom:4px;">
        <strong>Region:</strong> ${escapeHtml(complaint.region || "UNCLASSIFIED")}
      </div>
      <div style="font-size:12px; margin-bottom:4px;">
        <strong>Locality:</strong> ${escapeHtml(complaint.locality || "UNKNOWN")}
      </div>
      <div style="font-size:12px;">
        <strong>Priority:</strong> ${escapeHtml(
          complaint.priority_score !== null && complaint.priority_score !== undefined
            ? String(complaint.priority_score)
            : "UNASSIGNED"
        )}
      </div>
    </div>
  `;
}

function MapComponent({ complaints = [] }) {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const infoWindowRef = useRef(null);
  const markersRef = useRef([]);
  const heatmapRef = useRef(null);
  const [error, setError] = useState("");
  const [isMapReady, setIsMapReady] = useState(false);

  const mapComplaints = useMemo(
    () => complaints.filter((complaint) => hasCoordinates(complaint)),
    [complaints]
  );

  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      try {
        await loadGoogleMapsScript();

        if (!isMounted || mapRef.current || !mapElementRef.current) {
          return;
        }

        mapRef.current = new window.google.maps.Map(mapElementRef.current, {
          center: DELHI_CENTER,
          zoom: 10,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        infoWindowRef.current = new window.google.maps.InfoWindow();
        setError("");
        setIsMapReady(true);
      } catch (loadError) {
        console.error(loadError);
        if (isMounted) {
          setError(loadError.message || "Failed to load Google Maps.");
        }
      }
    };

    void initializeMap();

    return () => {
      isMounted = false;
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
        heatmapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isMapReady || !mapRef.current || !window.google?.maps) {
      return;
    }

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
      heatmapRef.current = null;
    }

    if (!mapComplaints.length) {
      mapRef.current.setCenter(DELHI_CENTER);
      mapRef.current.setZoom(10);
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();

    markersRef.current = mapComplaints.map((complaint) => {
      const position = {
        lat: Number(complaint.lat),
        lng: Number(complaint.lng),
      };

      bounds.extend(position);

      const marker = new window.google.maps.Marker({
        map: mapRef.current,
        position,
        title: complaint.title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: markerColorForComplaint(complaint),
          fillOpacity: 0.95,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 8,
        },
      });

      marker.addListener("click", () => {
        infoWindowRef.current?.setContent(buildInfoWindowContent(complaint));
        infoWindowRef.current?.open({
          anchor: marker,
          map: mapRef.current,
        });
      });

      return marker;
    });

    heatmapRef.current = new window.google.maps.visualization.HeatmapLayer({
      data: mapComplaints.map(
        (complaint) =>
          new window.google.maps.LatLng(Number(complaint.lat), Number(complaint.lng))
      ),
      map: mapRef.current,
      radius: 28,
      opacity: 0.6,
    });

    if (mapComplaints.length === 1) {
      mapRef.current.setCenter(bounds.getCenter());
      mapRef.current.setZoom(14);
      return;
    }

    mapRef.current.fitBounds(bounds, 72);
  }, [isMapReady, mapComplaints]);

  return (
    <section
      style={{
        display: "grid",
        gap: "1rem",
        padding: "1rem",
        borderRadius: "20px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div>
        <div style={{ fontSize: "0.85rem", opacity: 0.8, marginBottom: "0.35rem" }}>
          Delhi complaint map
        </div>
        <h3 style={{ margin: 0 }}>Markers and density heatmap</h3>
      </div>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.95rem" }}>
        <span>{complaints.length} total complaints in current view</span>
        <span>{mapComplaints.length} complaints with coordinates</span>
      </div>

      {error ? (
        <div
          style={{
            padding: "1rem",
            borderRadius: "14px",
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.25)",
          }}
        >
          {error}
        </div>
      ) : null}

      <div
        ref={mapElementRef}
        style={{
          width: "100%",
          minHeight: "420px",
          borderRadius: "18px",
          overflow: "hidden",
          background: "rgba(255,255,255,0.04)",
        }}
      />

      {!mapComplaints.length ? (
        <p style={{ margin: 0, opacity: 0.8 }}>
          Complaints need valid latitude and longitude to appear on the map.
        </p>
      ) : null}
    </section>
  );
}

export default MapComponent;