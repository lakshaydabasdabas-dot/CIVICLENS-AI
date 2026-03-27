import { GOOGLE_MAPS_API_KEY } from "./geocode.js";

const GOOGLE_MAPS_SCRIPT_ID = "civiclens-google-maps-script";

let googleMapsLoaderPromise;

function hasLoadedGoogleMaps() {
  return Boolean(window.google?.maps?.Map);
}

export function loadGoogleMapsApi() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser."));
  }

  if (hasLoadedGoogleMaps()) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsLoaderPromise) {
    return googleMapsLoaderPromise;
  }

  googleMapsLoaderPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);

    const handleLoad = () => {
      if (hasLoadedGoogleMaps()) {
        resolve(window.google.maps);
        return;
      }

      googleMapsLoaderPromise = undefined;
      reject(new Error("Google Maps loaded without map support."));
    };

    const handleError = () => {
      googleMapsLoaderPromise = undefined;
      reject(new Error("Failed to load Google Maps."));
    };

    if (existingScript) {
      if (hasLoadedGoogleMaps()) {
        handleLoad();
        return;
      }

      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    document.head.appendChild(script);
  });

  return googleMapsLoaderPromise;
}
