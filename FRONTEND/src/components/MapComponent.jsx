import { useEffect, useRef, useState } from "react";
import { GOOGLE_MAPS_API_KEY } from "../utils/geocode.js";

const INDIA_CENTER = { lat: 28.6139, lng: 77.2090 };
const GOOGLE_MAPS_SCRIPT_ID = "civiclens-google-maps-script";

let googleMapsLoaderPromise;

function loadGoogleMapsScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser."));
  }

  if (window.google?.maps?.Map && window.google.maps.visualization?.HeatmapLayer) {
    return Promise.resolve(window.google.maps);
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
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildInfoWindowContent(complaint) {
  return `
    <div class="map-info-window">
      <strong>${escapeHtml(complaint.title || "Untitled complaint")}</strong>
      <p>${escapeHtml(complaint.location || "No location provided")}</p>
      <span>${escapeHtml(complaint.category || "Uncategorized")} | ${escapeHtml(complaint.status || "NEW")}</span>
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
  const mapComplaints = complaints.filter((complaint) => hasCoordinates(complaint));

  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      try {
        await loadGoogleMapsScript();

        if (!isMounted || mapRef.current || !mapElementRef.current) {
          return;
        }

        mapRef.current = new window.google.maps.Map(mapElementRef.current, {
          center: INDIA_CENTER,
          zoom: 5,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        infoWindowRef.current = new window.google.maps.InfoWindow();
        setIsMapReady(true);
        setError("");
      } catch (loadError) {
        console.error(loadError);

        if (isMounted) {
          setError("Failed to load Google Maps.");
        }
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
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
      mapRef.current.setCenter(INDIA_CENTER);
      mapRef.current.setZoom(5);
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
      radius: 32,
      opacity: 0.7,
    });

    if (mapComplaints.length === 1) {
      mapRef.current.setCenter(bounds.getCenter());
      mapRef.current.setZoom(13);
      return;
    }

    mapRef.current.fitBounds(bounds, 64);
  }, [isMapReady, mapComplaints]);

  return (
    <section className="map-panel glass-panel reveal-in">
      <div className="map-panel__header">
        <div>
          <span className="section-kicker">Complaint map</span>
          <h2>Live markers and heatmap</h2>
        </div>
        <div className="map-panel__stats">
          <span>{complaints.length} total complaints</span>
          <span>{mapComplaints.length} mapped</span>
        </div>
      </div>

      <p className="map-panel__copy">
        The map starts on India and updates whenever a new complaint is added to the
        shared state. Heatmap density is driven by geocoded complaint locations.
      </p>

      {error ? (
        <div className="map-placeholder">
          <p>{error}</p>
        </div>
      ) : (
        <div className="map-shell">
          <div ref={mapElementRef} className="map-canvas" />
          {!mapComplaints.length ? (
            <div className="map-empty-state">
              <p>Submit a complaint with a location to place markers and build the heatmap.</p>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

export default MapComponent;
