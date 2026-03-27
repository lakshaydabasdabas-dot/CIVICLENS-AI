import { useCallback, useEffect, useRef, useState } from "react";
import { loadGoogleMapsApi } from "../utils/googleMapsLoader.js";

const DELHI_CENTER = { lat: 28.6139, lng: 77.2090 };
const DEFAULT_MAP_ZOOM = 5;
const USER_LOCATION_ZOOM = 15;
const GEOLOCATION_TIMEOUT_MS = 3000;
const MAX_MAP_CENTER_RETRIES = 3;
const MAP_CENTER_RETRY_DELAY_MS = 500;

function hasCoordinates(location) {
  const lat = location?.lat;
  const lng = location?.lng;

  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return false;
  }

  const numericLat = Number(lat);
  const numericLng = Number(lng);

  return (
    Number.isFinite(numericLat) &&
    Number.isFinite(numericLng) &&
    numericLat !== 0 &&
    numericLng !== 0
  );
}

function positionsMatch(leftPosition, rightPosition) {
  if (!leftPosition || !rightPosition) {
    return false;
  }

  return (
    Math.abs(Number(leftPosition.lat) - Number(rightPosition.lat)) < 0.000001 &&
    Math.abs(Number(leftPosition.lng) - Number(rightPosition.lng)) < 0.000001
  );
}

function hasValidMapCoordinates(position) {
  return (
    Number.isFinite(Number(position?.lat)) &&
    Number.isFinite(Number(position?.lng)) &&
    Number(position.lat) !== 0 &&
    Number(position.lng) !== 0
  );
}

function hasStrictGeolocationCoordinates(lat, lng) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat !== 0 &&
    lng !== 0
  );
}

function LocationPickerMap({ selectedLocation, onLocationSelect }) {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const markerTitleRef = useRef("Selected Location");
  const clickListenerRef = useRef(null);
  const retryTimeoutIdsRef = useRef([]);
  const onLocationSelectRef = useRef(onLocationSelect);
  const selectedLocationRef = useRef(selectedLocation);
  const geolocationAttemptedRef = useRef(false);
  const [error, setError] = useState("");
  const [isMapReady, setIsMapReady] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(true);

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    selectedLocationRef.current = selectedLocation;
  }, [selectedLocation]);

  const setMarkerPosition = useCallback((position, title = "Selected Location") => {
    markerTitleRef.current = title;

    if (!markerRef.current) {
      markerRef.current = new window.google.maps.Marker({
        map: mapRef.current,
        position,
        title,
      });
      return;
    }

    markerRef.current.setPosition(position);
    markerRef.current.setTitle(title);
  }, []);

  const updateMapToLocation = useCallback((position, title = "Selected Location") => {
    if (!hasValidMapCoordinates(position)) {
      console.error("Invalid geolocation coordinates. Skipping map update.", position);
      return;
    }

    if (!mapRef.current) {
      return;
    }

    console.log("SET CENTER CALLED FROM:", "selectedLocation sync", position.lat, position.lng);
    setMarkerPosition(position, title);
    mapRef.current.setCenter(position);
    mapRef.current.setZoom(USER_LOCATION_ZOOM);
  }, [setMarkerPosition]);

  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      try {
        await loadGoogleMapsApi();

        if (!isMounted) {
          return;
        }

        if (mapRef.current || !mapElementRef.current) {
          return;
        }

        mapRef.current = new window.google.maps.Map(mapElementRef.current, {
          center: DELHI_CENTER,
          zoom: DEFAULT_MAP_ZOOM,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        console.log("Map initialized");

        clickListenerRef.current = mapRef.current.addListener("click", (event) => {
          if (!event.latLng) {
            return;
          }

          const position = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
          };

          setMarkerPosition(position, "Selected Location");
          mapRef.current?.panTo(position);

          if ((mapRef.current?.getZoom() || 0) < USER_LOCATION_ZOOM) {
            mapRef.current?.setZoom(USER_LOCATION_ZOOM);
          }

          onLocationSelectRef.current?.(position);
        });

        setError("");
        setIsMapReady(true);
      } catch (loadError) {
        console.error(loadError);

        if (isMounted) {
          setError("Failed to load the location picker map.");
        }
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      retryTimeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      retryTimeoutIdsRef.current = [];
      clickListenerRef.current?.remove();

      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [setMarkerPosition]);

  useEffect(() => {
    let isMounted = true;
    let unavailableTimeoutId;

    if (!isMapReady || geolocationAttemptedRef.current) {
      return undefined;
    }

    geolocationAttemptedRef.current = true;

    if (typeof window === "undefined" || !navigator.geolocation) {
      console.error("GEO ERROR:", {
        code: "POSITION_UNAVAILABLE",
        message: "Geolocation API unavailable.",
      });
      unavailableTimeoutId = window.setTimeout(() => {
        if (isMounted) {
          setIsFetchingLocation(false);
        }
      }, 0);
      return undefined;
    }

    const applyUserLocationToMap = (lat, lng, retryCount = 0) => {
      console.log("Map instance:", mapRef.current);
      console.log("FINAL COORDINATES:", lat, lng);

      if (!hasStrictGeolocationCoordinates(lat, lng)) {
        console.error("INVALID COORDINATES:", lat, lng);
        return;
      }

      if (mapRef.current) {
        console.log("SET CENTER CALLED FROM:", "geolocation success", lat, lng);
        mapRef.current.setCenter({ lat, lng });
        mapRef.current.setZoom(USER_LOCATION_ZOOM);

        if (!markerRef.current) {
          markerRef.current = new window.google.maps.Marker({
            position: { lat, lng },
            map: mapRef.current,
            title: "You are here",
          });
        } else {
          markerRef.current.setMap(mapRef.current);
          markerRef.current.setPosition({ lat, lng });
          markerRef.current.setTitle("You are here");
        }

        return;
      }

      if (retryCount >= MAX_MAP_CENTER_RETRIES) {
        console.error("Map instance unavailable after retries. Skipping geolocation update.");
        return;
      }

      const timeoutId = window.setTimeout(() => {
        applyUserLocationToMap(lat, lng, retryCount + 1);
      }, MAP_CENTER_RETRY_DELAY_MS);

      retryTimeoutIdsRef.current.push(timeoutId);
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMounted) {
          return;
        }

        setIsFetchingLocation(false);

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        console.log("GEO SUCCESS:", lat, lng);
        console.log("FINAL COORDINATES:", lat, lng);

        if (!hasStrictGeolocationCoordinates(lat, lng)) {
          console.error("INVALID COORDINATES:", lat, lng);
          return;
        }

        if (selectedLocationRef.current?.name?.trim() || hasCoordinates(selectedLocationRef.current)) {
          return;
        }

        applyUserLocationToMap(lat, lng);
        onLocationSelectRef.current?.({ lat, lng });
      },
      (geoError) => {
        if (!isMounted) {
          return;
        }

        setIsFetchingLocation(false);
        console.error("GEO ERROR:", geoError);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 300000,
        timeout: GEOLOCATION_TIMEOUT_MS,
      }
    );

    return () => {
      isMounted = false;
      if (unavailableTimeoutId) {
        window.clearTimeout(unavailableTimeoutId);
      }
    };
  }, [isMapReady, setMarkerPosition]);

  useEffect(() => {
    if (!isMapReady || !mapRef.current || !window.google?.maps || !hasCoordinates(selectedLocation)) {
      return;
    }

    const position = {
      lat: Number(selectedLocation.lat),
      lng: Number(selectedLocation.lng),
    };

    const currentPosition = markerRef.current?.getPosition();
    const nextMarkerTitle =
      currentPosition &&
      positionsMatch(
        {
          lat: currentPosition.lat(),
          lng: currentPosition.lng(),
        },
        position
      )
        ? markerTitleRef.current
        : "Selected Location";

    updateMapToLocation(position, nextMarkerTitle);
    mapRef.current.panTo(position);
  }, [isMapReady, selectedLocation, updateMapToLocation]);

  if (error) {
    return <p className="form-message form-message--error">{error}</p>;
  }

  return (
    <div className="chart-wrapper" style={{ position: "relative" }}>
      <div
        ref={mapElementRef}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "18px",
          overflow: "hidden",
        }}
      />
      {isFetchingLocation ? (
        <p
          className="empty-state"
          style={{
            position: "absolute",
            left: "18px",
            right: "18px",
            bottom: "18px",
            margin: 0,
            pointerEvents: "none",
          }}
        >
          Fetching your location...
        </p>
      ) : null}
    </div>
  );
}

export default LocationPickerMap;
