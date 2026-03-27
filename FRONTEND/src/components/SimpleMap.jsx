import { useEffect, useRef, useState } from "react";
import { loadGoogleMapsApi } from "../utils/googleMapsLoader.js";

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

function hasCoordinates(center) {
  return (
    Number.isFinite(Number(center?.lat)) &&
    Number.isFinite(Number(center?.lng)) &&
    Number(center?.lat) !== 0 &&
    Number(center?.lng) !== 0
  );
}

function SimpleMap({ center, zoom = 14, markerTitle = "Complaint Location" }) {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [mapError, setMapError] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  const targetCenter = hasCoordinates(center)
    ? { lat: Number(center.lat), lng: Number(center.lng) }
    : DEFAULT_CENTER;

  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      try {
        await loadGoogleMapsApi();

        if (!isMounted || mapRef.current || !mapElementRef.current) {
          return;
        }

        mapRef.current = new window.google.maps.Map(mapElementRef.current, {
          center: targetCenter,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          clickableIcons: false,
        });

        markerRef.current = new window.google.maps.Marker({
          position: targetCenter,
          map: mapRef.current,
          title: markerTitle,
        });

        setIsLoaded(true);
        setMapError("");
      } catch (error) {
        console.error(error);

        if (isMounted) {
          setMapError("Failed to load the map.");
        }
      }
    };

    initializeMap();

    return () => {
      isMounted = false;

      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !markerRef.current) {
      return;
    }

    markerRef.current.setTitle(markerTitle);
    markerRef.current.setPosition(targetCenter);
    mapRef.current.setCenter(targetCenter);
    mapRef.current.setZoom(zoom);
  }, [isLoaded, markerTitle, targetCenter, zoom]);

  if (mapError) {
    return (
      <div className="map-placeholder">
        <p>{mapError}</p>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        ref={mapElementRef}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      />
      {!isLoaded ? (
        <div className="map-empty-state">
          <p>Loading map...</p>
        </div>
      ) : null}
    </div>
  );
}

export default SimpleMap;
