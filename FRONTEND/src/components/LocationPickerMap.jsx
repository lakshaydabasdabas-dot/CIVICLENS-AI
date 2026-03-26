import { useCallback, useEffect, useRef, useState } from "react";
import { loadGoogleMapsApi } from "../utils/googleMapsLoader.js";

const DELHI_CENTER = { lat: 28.6139, lng: 77.2090 };
const USER_LOCATION_ZOOM = 14;

function hasCoordinates(location) {
  return Number.isFinite(Number(location?.lat)) && Number.isFinite(Number(location?.lng));
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

function LocationPickerMap({ selectedLocation, onLocationSelect }) {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const markerTitleRef = useRef("Selected Location");
  const clickListenerRef = useRef(null);
  const onLocationSelectRef = useRef(onLocationSelect);
  const selectedLocationRef = useRef(selectedLocation);
  const initialLocationAttemptedRef = useRef(false);
  const [error, setError] = useState("");
  const [isMapReady, setIsMapReady] = useState(false);

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

  const updateMapToLocation = useCallback((position, markerTitle = "Selected Location") => {
    if (!mapRef.current) {
      return;
    }

    setMarkerPosition(position, markerTitle);
    mapRef.current.setCenter(position);
    mapRef.current.setZoom(USER_LOCATION_ZOOM);
  }, [setMarkerPosition]);

  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      try {
        await loadGoogleMapsApi();

        if (!isMounted || mapRef.current || !mapElementRef.current) {
          return;
        }

        mapRef.current = new window.google.maps.Map(mapElementRef.current, {
          center: DELHI_CENTER,
          zoom: 5,
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
      clickListenerRef.current?.remove();

      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [setMarkerPosition]);

  useEffect(() => {
    if (!isMapReady || !mapRef.current || initialLocationAttemptedRef.current) {
      return;
    }

    initialLocationAttemptedRef.current = true;

    console.log("Requesting location");

    if (!navigator.geolocation) {
      console.log("Location error", "Geolocation API unavailable");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (currentPosition) => {
        if (!mapRef.current) {
          return;
        }

        const userLocation = {
          lat: currentPosition.coords.latitude,
          lng: currentPosition.coords.longitude,
        };

        console.log("Location received", userLocation);

        if (selectedLocationRef.current?.name?.trim() || hasCoordinates(selectedLocationRef.current)) {
          return;
        }

        updateMapToLocation(userLocation, "You are here");
        onLocationSelectRef.current?.(userLocation);
      },
      (geoError) => {
        console.log("Location error", geoError);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, [isMapReady, updateMapToLocation]);

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

    setMarkerPosition(position, nextMarkerTitle);
    mapRef.current.panTo(position);

    if ((mapRef.current.getZoom() || 0) < USER_LOCATION_ZOOM) {
      mapRef.current.setZoom(USER_LOCATION_ZOOM);
    }
  }, [isMapReady, selectedLocation, setMarkerPosition]);

  if (error) {
    return <p className="form-message form-message--error">{error}</p>;
  }

  return (
    <div className="chart-wrapper">
      <div
        ref={mapElementRef}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "18px",
          overflow: "hidden",
        }}
      />
    </div>
  );
}

export default LocationPickerMap;
