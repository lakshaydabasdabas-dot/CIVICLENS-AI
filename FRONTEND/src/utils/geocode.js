export const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "").trim();

export async function getCoordinates(address) {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Missing VITE_GOOGLE_MAPS_API_KEY");
  }

  const trimmed = String(address || "").trim();
  if (!trimmed) {
    throw new Error("Location is required.");
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      trimmed
    )}&components=country:IN&key=${GOOGLE_MAPS_API_KEY}`
  );

  const data = await response.json();

  if (data.status !== "OK" || !data.results?.[0]?.geometry?.location) {
    throw new Error("Unable to geocode the location.");
  }

  return {
    name: data.results[0].formatted_address,
    lat: data.results[0].geometry.location.lat,
    lng: data.results[0].geometry.location.lng,
  };
}

export async function reverseGeocode(lat, lng) {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Missing VITE_GOOGLE_MAPS_API_KEY");
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
  );

  const data = await response.json();

  if (data.status !== "OK" || !data.results?.[0]?.formatted_address) {
    return `Selected location (${lat}, ${lng})`;
  }

  return data.results[0].formatted_address;
}