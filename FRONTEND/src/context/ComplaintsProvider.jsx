import { useEffect, useState } from "react";
import { ComplaintsContext } from "./ComplaintsContext.js";
import { getAllComplaints } from "../services/API.js";
import { getCoordinates } from "../utils/geocode.js";

function hasCoordinates(complaint) {
  return Number.isFinite(Number(complaint?.lat)) && Number.isFinite(Number(complaint?.lng));
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
    byId.set(complaint.id, complaint);
  });

  incoming.forEach((complaint) => {
    const previousComplaint = byId.get(complaint.id);

    byId.set(complaint.id, {
      ...previousComplaint,
      ...complaint,
      lat: complaint.lat ?? previousComplaint?.lat,
      lng: complaint.lng ?? previousComplaint?.lng,
    });
  });

  return sortComplaints(Array.from(byId.values()));
}

async function geocodeComplaintLocation(complaint) {
  if (!complaint?.location || hasCoordinates(complaint)) {
    return complaint;
  }

  try {
    const coordinates = await getCoordinates(complaint.location);
    return {
      ...complaint,
      ...coordinates,
    };
  } catch (error) {
    console.error(`Failed to geocode "${complaint.location}".`, error);
    return complaint;
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

      try {
        const response = await getAllComplaints();

        if (!isMounted) {
          return;
        }

        setComplaints((currentComplaints) =>
          mergeComplaints(response.data, currentComplaints)
        );

        setIsLoading(false);

        const hydratedComplaints = await Promise.all(
          response.data.map((complaint) => geocodeComplaintLocation(complaint))
        );

        if (!isMounted) {
          return;
        }

        setComplaints((currentComplaints) =>
          mergeComplaints(hydratedComplaints, currentComplaints)
        );
      } catch (loadError) {
        console.error(loadError);

        if (isMounted) {
          setError("Failed to load complaints.");
          setIsLoading(false);
        }
      }
    };

    loadComplaints();

    return () => {
      isMounted = false;
    };
  }, []);

  const addComplaint = (complaint) => {
    setComplaints((currentComplaints) =>
      mergeComplaints([complaint], currentComplaints)
    );
  };

  const updateComplaint = (complaint) => {
    setComplaints((currentComplaints) =>
      mergeComplaints([complaint], currentComplaints)
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
