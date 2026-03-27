import { useEffect, useState } from "react";
import { ComplaintsContext } from "./ComplaintsContext.js";
import { getAllComplaints } from "../services/API.js";
import { getCoordinates, isPlusCodeAddress, reverseGeocode } from "../utils/geocode.js";

function hasCoordinates(complaint) {
  const lat = complaint?.lat;
  const lng = complaint?.lng;

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

function getComplaintAddress(complaint) {
  if (typeof complaint?.location === "string" && complaint.location.trim()) {
    return complaint.location.trim();
  }

  const address =
    complaint?.locationData?.address ||
    complaint?.formatted_address ||
    complaint?.address ||
    complaint?.location?.address ||
    complaint?.location?.name;

  return typeof address === "string" ? address.trim() : "";
}

function normalizeComplaint(complaint) {
  const address = getComplaintAddress(complaint);
  const lat = Number(complaint?.lat ?? complaint?.locationData?.lat ?? complaint?.location?.lat);
  const lng = Number(complaint?.lng ?? complaint?.locationData?.lng ?? complaint?.location?.lng);
  const aiSummary = complaint?.ai_summary || complaint?.summary || "";

  return {
    ...complaint,
    location: address,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    ai_summary: aiSummary,
    summary: aiSummary,
    locationData: {
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
      address,
    },
  };
}

function sortComplaints(items) {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.created_at || 0).getTime();
    const rightTime = new Date(right.created_at || 0).getTime();

    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    return (right.id || 0) - (left.id || 0);
  });
}

function mergeComplaints(incoming, existing) {
  const byId = new Map();

  existing.forEach((complaint) => {
    const normalizedComplaint = normalizeComplaint(complaint);
    byId.set(normalizedComplaint.id, normalizedComplaint);
  });

  incoming.forEach((complaint) => {
    const normalizedComplaint = normalizeComplaint(complaint);
    const previousComplaint = byId.get(normalizedComplaint.id);

    byId.set(normalizedComplaint.id, normalizeComplaint({
      ...previousComplaint,
      ...normalizedComplaint,
      lat: normalizedComplaint.lat ?? previousComplaint?.lat,
      lng: normalizedComplaint.lng ?? previousComplaint?.lng,
      location:
        normalizedComplaint.location ||
        previousComplaint?.location ||
        previousComplaint?.locationData?.address ||
        "",
      locationData: {
        lat: normalizedComplaint.lat ?? previousComplaint?.lat ?? null,
        lng: normalizedComplaint.lng ?? previousComplaint?.lng ?? null,
        address:
          normalizedComplaint.location ||
          previousComplaint?.location ||
          previousComplaint?.locationData?.address ||
          "",
      },
    }));
  });

  return sortComplaints(Array.from(byId.values()));
}

async function hydrateComplaintLocation(complaint) {
  const normalizedComplaint = normalizeComplaint(complaint);

  if (hasCoordinates(normalizedComplaint) && normalizedComplaint.location) {
    if (!isPlusCodeAddress(normalizedComplaint.location)) {
      return normalizedComplaint;
    }

    try {
      const address = await reverseGeocode(
        normalizedComplaint.lat,
        normalizedComplaint.lng,
        "Selected Location"
      );

      return normalizeComplaint({
        ...normalizedComplaint,
        location: address,
      });
    } catch (error) {
      console.error(`Failed to reverse geocode complaint ${normalizedComplaint.id}.`, error);
      return normalizedComplaint;
    }
  }

  if (hasCoordinates(normalizedComplaint)) {
    try {
      const address = await reverseGeocode(
        normalizedComplaint.lat,
        normalizedComplaint.lng,
        "Selected Location"
      );

      return normalizeComplaint({
        ...normalizedComplaint,
        location: address,
      });
    } catch (error) {
      console.error(`Failed to reverse geocode complaint ${normalizedComplaint.id}.`, error);
      return normalizedComplaint;
    }
  }

  if (!normalizedComplaint.location) {
    return normalizedComplaint;
  }

  try {
    const coordinates = await getCoordinates(normalizedComplaint.location);
    return normalizeComplaint({
      ...normalizedComplaint,
      ...coordinates,
    });
  } catch (error) {
    console.error(`Failed to geocode "${normalizedComplaint.location}".`, error);
    return normalizedComplaint;
  }
}

export function ComplaintsProvider({ children }) {
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadComplaints = async () => {
      setIsLoading(true);
      setError("");
      let complaintRows = [];

      try {
        const response = await getAllComplaints();
        complaintRows = Array.isArray(response.data) ? response.data : [];

        if (!isMounted) {
          return;
        }

        setComplaints((currentComplaints) =>
          mergeComplaints(complaintRows, currentComplaints)
        );

        setIsLoading(false);
      } catch (loadError) {
        console.error(loadError);

        if (isMounted) {
          setError(
            loadError?.response?.data?.detail ||
              loadError?.message ||
              "Failed to load complaints."
          );
          setIsLoading(false);
        }

        return;
      }

      const hydrationResults = await Promise.allSettled(
        complaintRows.map((complaint) => hydrateComplaintLocation(complaint))
      );

      if (!isMounted) {
        return;
      }

      const hydratedComplaints = hydrationResults
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

      const hydrationFailures = hydrationResults.filter(
        (result) => result.status === "rejected"
      );

      if (hydrationFailures.length > 0) {
        console.warn(
          `Complaint location hydration failed for ${hydrationFailures.length} item(s).`,
          hydrationFailures.map((result) => result.reason)
        );
      }

      if (hydratedComplaints.length === 0) {
        return;
      }

      setComplaints((currentComplaints) =>
        mergeComplaints(hydratedComplaints, currentComplaints)
      );
    };

    loadComplaints();

    return () => {
      isMounted = false;
    };
  }, []);

  const addComplaint = (complaint) => {
    setComplaints((currentComplaints) =>
      mergeComplaints([normalizeComplaint(complaint)], currentComplaints)
    );
  };

  const updateComplaint = (complaint) => {
    setComplaints((currentComplaints) =>
      mergeComplaints([normalizeComplaint(complaint)], currentComplaints)
    );
  };

  return (
    <ComplaintsContext.Provider
      value={{
        complaints,
        addComplaint,
        updateComplaint,
        isLoading,
        error,
      }}
    >
      {children}
    </ComplaintsContext.Provider>
  );
}
