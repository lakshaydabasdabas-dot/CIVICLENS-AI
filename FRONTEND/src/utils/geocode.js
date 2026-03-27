const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyAED8PQOpKOu5WuwLYDjyWiMp5qZvAAxJk";

const GEOCODE_CACHE_KEY = "civiclens:geocode-cache";
const REVERSE_GEOCODE_CACHE_KEY = "civiclens:reverse-geocode-cache";
const geocodeMemoryCache = new Map();
const reverseGeocodeMemoryCache = new Map();
const DEFAULT_REVERSE_GEOCODE_NAME = "Selected Location";
const GEOCODE_TIMEOUT_MS = 8000;

function readCache(cacheKey) {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawCache = window.localStorage.getItem(cacheKey);
    return rawCache ? JSON.parse(rawCache) : {};
  } catch (error) {
    console.error(`Failed to read cache for ${cacheKey}.`, error);
    return {};
  }
}

function writeCache(cacheKey, cache) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(cacheKey, JSON.stringify(cache));
  } catch (error) {
    console.error(`Failed to write cache for ${cacheKey}.`, error);
  }
}

function getLocationCacheKey(location) {
  return location.trim().toLowerCase();
}

function getReverseLocationCacheKey(lat, lng) {
  return `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;
}

function isPlusCodeAddress(value) {
  return /^[A-Z0-9]{4,}\+[A-Z0-9]{2,}\b/i.test((value || "").trim());
}

function getFormattedAddress(results, fallbackName = DEFAULT_REVERSE_GEOCODE_NAME) {
  if (!Array.isArray(results)) {
    return fallbackName;
  }

  const preferredResult = results.find((result) => {
    const formattedAddress = result?.formatted_address?.trim();
    const resultTypes = Array.isArray(result?.types) ? result.types : [];

    return (
      formattedAddress &&
      !isPlusCodeAddress(formattedAddress) &&
      !resultTypes.includes("plus_code")
    );
  });

  return preferredResult?.formatted_address?.trim() || fallbackName;
}

async function requestGeocode(params) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS);

  let response;

  try {
    response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`, {
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Geocoding request timed out.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error("Geocoding request failed.");
  }

  return response.json();
}

export async function getCoordinates(location) {
  const trimmedLocation = location?.trim();

  if (!trimmedLocation) {
    throw new Error("Location is required.");
  }

  const cacheKey = getLocationCacheKey(trimmedLocation);

  if (geocodeMemoryCache.has(cacheKey)) {
    return geocodeMemoryCache.get(cacheKey);
  }

  const storedCache = readCache(GEOCODE_CACHE_KEY);

  if (storedCache[cacheKey]) {
    geocodeMemoryCache.set(cacheKey, storedCache[cacheKey]);
    return storedCache[cacheKey];
  }

  const params = new URLSearchParams({
    address: trimmedLocation,
    components: "country:IN",
    key: GOOGLE_MAPS_API_KEY,
  });

  const payload = await requestGeocode(params);

  if (payload.status !== "OK" || !payload.results?.[0]?.geometry?.location) {
    throw new Error("Location could not be geocoded.");
  }

  const coordinates = {
    lat: payload.results[0].geometry.location.lat,
    lng: payload.results[0].geometry.location.lng,
  };

  geocodeMemoryCache.set(cacheKey, coordinates);
  writeCache(GEOCODE_CACHE_KEY, {
    ...storedCache,
    [cacheKey]: coordinates,
  });

  return coordinates;
}

export async function reverseGeocode(lat, lng, fallbackName = DEFAULT_REVERSE_GEOCODE_NAME) {
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
    throw new Error("Valid coordinates are required.");
  }

  const cacheKey = getReverseLocationCacheKey(lat, lng);

  if (reverseGeocodeMemoryCache.has(cacheKey)) {
    return reverseGeocodeMemoryCache.get(cacheKey);
  }

  const storedCache = readCache(REVERSE_GEOCODE_CACHE_KEY);

  if (storedCache[cacheKey]) {
    reverseGeocodeMemoryCache.set(cacheKey, storedCache[cacheKey]);
    return storedCache[cacheKey];
  }

  const params = new URLSearchParams({
    latlng: `${lat},${lng}`,
    key: GOOGLE_MAPS_API_KEY,
  });

  try {
    const payload = await requestGeocode(params);
    const locationName =
      payload.status === "OK"
        ? getFormattedAddress(payload.results, fallbackName)
        : fallbackName;

    reverseGeocodeMemoryCache.set(cacheKey, locationName);
    writeCache(REVERSE_GEOCODE_CACHE_KEY, {
      ...storedCache,
      [cacheKey]: locationName,
    });

    return locationName;
  } catch (error) {
    console.error("Reverse geocoding failed.", error);
    return fallbackName;
  }
}

export { GOOGLE_MAPS_API_KEY, isPlusCodeAddress };
