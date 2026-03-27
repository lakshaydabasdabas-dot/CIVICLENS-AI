import { dedupeComplaintsByContentAndLocation } from "./complaintDedup.js";
import { createHotspotClusters } from "./hotspotClustering.js";

export function sortComplaintsByLatest(items) {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.created_at || 0).getTime();
    const rightTime = new Date(right.created_at || 0).getTime();

    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    return (Number(right.id) || 0) - (Number(left.id) || 0);
  });
}

export function deduplicateComplaints(complaints = []) {
  return dedupeComplaintsByContentAndLocation(complaints, sortComplaintsByLatest);
}

export function buildComplaintDataLayers(rawComplaints = [], hotspotOptions = {}) {
  const dedupedComplaints = deduplicateComplaints(rawComplaints);
  const clusteredComplaints = createHotspotClusters(dedupedComplaints, hotspotOptions);

  return {
    rawComplaints,
    dedupedComplaints,
    clusteredComplaints,
  };
}

export function getComplaintCoordinates(complaint) {
  const lat = Number(complaint?.lat ?? complaint?.locationData?.lat ?? complaint?.location?.lat);
  const lng = Number(complaint?.lng ?? complaint?.locationData?.lng ?? complaint?.location?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) {
    return null;
  }

  return { lat, lng };
}

export function complaintBelongsToHotspot(complaint, hotspot) {
  const coordinates = getComplaintCoordinates(complaint);
  const gridBounds = hotspot?.gridBounds;

  if (!coordinates || !gridBounds) {
    return false;
  }

  return (
    coordinates.lat >= gridBounds.minLat &&
    coordinates.lat < gridBounds.maxLat &&
    coordinates.lng >= gridBounds.minLng &&
    coordinates.lng < gridBounds.maxLng
  );
}

export function getRawComplaintsForHotspot(rawComplaints = [], hotspot) {
  return rawComplaints.filter((complaint) => complaintBelongsToHotspot(complaint, hotspot));
}
