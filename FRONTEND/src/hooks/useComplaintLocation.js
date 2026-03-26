import { useEffect, useRef, useState } from "react";
import { getCoordinates, reverseGeocode } from "../utils/geocode.js";

const EMPTY_LOCATION = {
  name: "",
  lat: null,
  lng: null,
};

function hasCoordinates(location) {
  return Number.isFinite(Number(location?.lat)) && Number.isFinite(Number(location?.lng));
}

function normalizeLocationName(value) {
  return value.trim().toLowerCase();
}

export function useComplaintLocation() {
  const [locationInput, setLocationInput] = useState("");
  const [locationState, setLocationState] = useState(EMPTY_LOCATION);
  const [locationError, setLocationError] = useState("");
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const requestIdRef = useRef(0);
  const skipNextTextSyncRef = useRef(false);

  useEffect(() => {
    const trimmedLocation = locationInput.trim();

    if (!trimmedLocation) {
      setLocationState(EMPTY_LOCATION);
      setLocationError("");
      return undefined;
    }

    if (skipNextTextSyncRef.current) {
      skipNextTextSyncRef.current = false;
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setIsResolvingLocation(true);

      try {
        const coordinates = await getCoordinates(trimmedLocation);

        if (requestId !== requestIdRef.current) {
          return;
        }

        setLocationState({
          name: trimmedLocation,
          ...coordinates,
        });
        setLocationError("");
      } catch {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setLocationState((currentLocation) => ({
          name: trimmedLocation,
          lat:
            normalizeLocationName(currentLocation.name) ===
            normalizeLocationName(trimmedLocation)
              ? currentLocation.lat
              : null,
          lng:
            normalizeLocationName(currentLocation.name) ===
            normalizeLocationName(trimmedLocation)
              ? currentLocation.lng
              : null,
        }));
        setLocationError("Invalid location. Refine the text or pick a point on the map.");
      } finally {
        if (requestId === requestIdRef.current) {
          setIsResolvingLocation(false);
        }
      }
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [locationInput]);

  const updateLocationInput = (value) => {
    setLocationInput(value);
    setLocationState((currentLocation) => ({
      name: value,
      lat:
        normalizeLocationName(currentLocation.name) === normalizeLocationName(value)
          ? currentLocation.lat
          : null,
      lng:
        normalizeLocationName(currentLocation.name) === normalizeLocationName(value)
          ? currentLocation.lng
          : null,
    }));
    setLocationError("");
  };

  const selectLocationFromMap = async ({ lat, lng }) => {
    setIsResolvingLocation(true);

    try {
      const locationName = await reverseGeocode(lat, lng, "Selected Location");
      skipNextTextSyncRef.current = true;
      setLocationInput(locationName);
      setLocationState({
        name: locationName,
        lat,
        lng,
      });
      setLocationError("");
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const resolveLocation = async () => {
    const trimmedLocation = locationInput.trim();

    if (!trimmedLocation) {
      throw new Error("Location is required.");
    }

    if (
      hasCoordinates(locationState) &&
      normalizeLocationName(locationState.name) === normalizeLocationName(trimmedLocation)
    ) {
      return {
        name: trimmedLocation,
        lat: Number(locationState.lat),
        lng: Number(locationState.lng),
      };
    }

    setIsResolvingLocation(true);

    try {
      const coordinates = await getCoordinates(trimmedLocation);
      const resolvedLocation = {
        name: trimmedLocation,
        ...coordinates,
      };

      setLocationState(resolvedLocation);
      setLocationError("");
      return resolvedLocation;
    } catch {
      setLocationError("Invalid location. Refine the text or pick a point on the map.");
      throw new Error("Invalid location. Refine the text or pick a point on the map.");
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const resetLocation = () => {
    requestIdRef.current += 1;
    setLocationInput("");
    setLocationState(EMPTY_LOCATION);
    setLocationError("");
    setIsResolvingLocation(false);
  };

  return {
    locationInput,
    locationState,
    locationError,
    isResolvingLocation,
    updateLocationInput,
    selectLocationFromMap,
    resolveLocation,
    resetLocation,
  };
}
