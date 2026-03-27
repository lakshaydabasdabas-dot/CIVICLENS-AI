const DEFAULT_GRID_SIZE = 0.1;
const DEFAULT_MIN_CLUSTER_SIZE = 2;
const DEFAULT_MAX_HOTSPOTS = 10;

const URGENCY_PRIORITY = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function getNumericId(value) {
  const numericId = Number(value);
  return Number.isFinite(numericId) ? numericId : 0;
}

function hasCoordinates(complaint) {
  const lat = Number(complaint?.lat ?? complaint?.locationData?.lat ?? complaint?.location?.lat);
  const lng = Number(complaint?.lng ?? complaint?.locationData?.lng ?? complaint?.location?.lng);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat !== 0 &&
    lng !== 0
  );
}

function getComplaintCoordinates(complaint) {
  if (!hasCoordinates(complaint)) {
    return null;
  }

  return {
    lat: Number(complaint.lat ?? complaint?.locationData?.lat ?? complaint?.location?.lat),
    lng: Number(complaint.lng ?? complaint?.locationData?.lng ?? complaint?.location?.lng),
  };
}

function getComplaintAddress(complaint) {
  return (
    complaint?.locationData?.address ||
    complaint?.formatted_address ||
    complaint?.address ||
    complaint?.location?.address ||
    complaint?.location?.name ||
    complaint?.location ||
    ""
  )
    .trim();
}

function getHotspotLabelCandidate(complaint) {
  const address = getComplaintAddress(complaint);

  if (!address) {
    return "";
  }

  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) {
    return address;
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return parts.slice(0, 2).join(", ");
}

function getComplaintTimestamp(complaint) {
  return new Date(complaint?.created_at || 0).getTime();
}

function getUrgencyPriority(complaint) {
  const urgency = String(complaint?.urgency || "").trim().toLowerCase();
  return URGENCY_PRIORITY[urgency] || 0;
}

function sortComplaintsForHotspot(complaints) {
  return [...complaints].sort((left, right) => {
    const urgencyDifference = getUrgencyPriority(right) - getUrgencyPriority(left);

    if (urgencyDifference !== 0) {
      return urgencyDifference;
    }

    const timestampDifference = getComplaintTimestamp(right) - getComplaintTimestamp(left);

    if (timestampDifference !== 0) {
      return timestampDifference;
    }

    return getNumericId(right?.id) - getNumericId(left?.id);
  });
}

function buildCategorySummary(complaints) {
  const categoryCounts = complaints.reduce((counts, complaint) => {
    const category = complaint?.category || "Uncategorized";
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {});

  return Object.entries(categoryCounts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([category, count]) => ({ category, count }));
}

function buildHotspotName(complaints, center) {
  const nameCounts = complaints.reduce((counts, complaint) => {
    const candidate = getHotspotLabelCandidate(complaint);

    if (!candidate) {
      return counts;
    }

    counts[candidate] = (counts[candidate] || 0) + 1;
    return counts;
  }, {});

  const rankedNames = Object.entries(nameCounts).sort(
    (left, right) => right[1] - left[1] || left[0].length - right[0].length
  );

  if (rankedNames.length) {
    return rankedNames[0][0];
  }

  return `Cluster ${center.lat.toFixed(2)}, ${center.lng.toFixed(2)}`;
}

function buildGridKey(lat, lng, gridSize) {
  const gridLat = Math.floor(lat / gridSize) * gridSize;
  const gridLng = Math.floor(lng / gridSize) * gridSize;

  return {
    gridLat,
    gridLng,
    key: `${gridLat.toFixed(6)},${gridLng.toFixed(6)}`,
  };
}

function sortHotspotsByCountInternal(hotspots) {
  return [...hotspots].sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }

    const latestDifference =
      getComplaintTimestamp(right.complaints[0]) - getComplaintTimestamp(left.complaints[0]);

    if (latestDifference !== 0) {
      return latestDifference;
    }

    return left.name.localeCompare(right.name);
  });
}

export function createHotspotClusters(complaints, options = {}) {
  const {
    gridSize = DEFAULT_GRID_SIZE,
    minClusterSize = DEFAULT_MIN_CLUSTER_SIZE,
    maxHotspots = DEFAULT_MAX_HOTSPOTS,
  } = options;

  const validComplaints = complaints.filter(hasCoordinates);

  if (!validComplaints.length) {
    return [];
  }

  const gridMap = new Map();

  validComplaints.forEach((complaint) => {
    const coordinates = getComplaintCoordinates(complaint);

    if (!coordinates) {
      return;
    }

    const { gridLat, gridLng, key } = buildGridKey(coordinates.lat, coordinates.lng, gridSize);

    if (!gridMap.has(key)) {
      gridMap.set(key, {
        gridLat,
        gridLng,
        complaints: [],
        complaintIds: [],
        totalLat: 0,
        totalLng: 0,
        minLat: coordinates.lat,
        maxLat: coordinates.lat,
        minLng: coordinates.lng,
        maxLng: coordinates.lng,
      });
    }

    const cluster = gridMap.get(key);
    cluster.complaints.push(complaint);
    cluster.complaintIds.push(complaint.id);
    cluster.totalLat += coordinates.lat;
    cluster.totalLng += coordinates.lng;
    cluster.minLat = Math.min(cluster.minLat, coordinates.lat);
    cluster.maxLat = Math.max(cluster.maxLat, coordinates.lat);
    cluster.minLng = Math.min(cluster.minLng, coordinates.lng);
    cluster.maxLng = Math.max(cluster.maxLng, coordinates.lng);
  });

  const hotspots = Array.from(gridMap.values())
    .filter((cluster) => cluster.complaints.length >= minClusterSize)
    .map((cluster) => {
      const sortedComplaints = sortComplaintsForHotspot(cluster.complaints);
      const count = sortedComplaints.length;
      const center = {
        lat: cluster.totalLat / count,
        lng: cluster.totalLng / count,
      };
      const topCategories = buildCategorySummary(sortedComplaints);

      return {
        id: `hotspot-${cluster.gridLat.toFixed(3)}-${cluster.gridLng.toFixed(3)}`,
        name: buildHotspotName(sortedComplaints, center),
        center,
        count,
        complaintIds: [...cluster.complaintIds],
        complaints: sortedComplaints,
        topComplaints: sortedComplaints.slice(0, 5),
        dominantCategory: topCategories[0]?.category || "Mixed",
        topCategories: topCategories.slice(0, 3),
        latestComplaintAt: sortedComplaints[0]?.created_at || null,
        bounds: {
          minLat: cluster.minLat,
          maxLat: cluster.maxLat,
          minLng: cluster.minLng,
          maxLng: cluster.maxLng,
        },
        gridBounds: {
          minLat: cluster.gridLat,
          maxLat: cluster.gridLat + gridSize,
          minLng: cluster.gridLng,
          maxLng: cluster.gridLng + gridSize,
        },
      };
    });

  return sortHotspotsByCountInternal(hotspots).slice(0, maxHotspots);
}

export function sortHotspotsByCount(hotspots) {
  return sortHotspotsByCountInternal(hotspots);
}

export function getHotspotById(hotspots, hotspotId) {
  return hotspots.find((hotspot) => hotspot.id === hotspotId) || null;
}

export function getHotspotStats(hotspots) {
  if (!hotspots.length) {
    return {
      totalHotspots: 0,
      totalComplaintsInHotspots: 0,
      averageClusterSize: 0,
      largestHotspot: null,
      topCategories: [],
    };
  }

  const totalComplaintsInHotspots = hotspots.reduce(
    (sum, hotspot) => sum + hotspot.count,
    0
  );
  const largestHotspot = hotspots[0];
  const topCategories = buildCategorySummary(hotspots.flatMap((hotspot) => hotspot.complaints))
    .slice(0, 5);

  return {
    totalHotspots: hotspots.length,
    totalComplaintsInHotspots,
    averageClusterSize: Number((totalComplaintsInHotspots / hotspots.length).toFixed(1)),
    largestHotspot: {
      id: largestHotspot.id,
      name: largestHotspot.name,
      count: largestHotspot.count,
      dominantCategory: largestHotspot.dominantCategory,
      center: largestHotspot.center,
    },
    topCategories,
  };
}

export function getHotspotTrend(hotspots, timeRange = "week") {
  const now = Date.now();
  const daysByRange = {
    day: 1,
    week: 7,
    month: 30,
  };
  const daysAgo = daysByRange[timeRange] || daysByRange.week;
  const currentWindowStart = now - daysAgo * 24 * 60 * 60 * 1000;
  const previousWindowStart = now - daysAgo * 2 * 24 * 60 * 60 * 1000;

  const recentCount = hotspots.flatMap((hotspot) => hotspot.complaints).filter((complaint) => {
    return getComplaintTimestamp(complaint) >= currentWindowStart;
  }).length;

  const previousCount = hotspots.flatMap((hotspot) => hotspot.complaints).filter((complaint) => {
    const createdAt = getComplaintTimestamp(complaint);
    return createdAt >= previousWindowStart && createdAt < currentWindowStart;
  }).length;

  let percentageChange = 0;

  if (previousCount > 0) {
    percentageChange = ((recentCount - previousCount) / previousCount) * 100;
  } else if (recentCount > 0) {
    percentageChange = 100;
  }

  return {
    recentCount,
    previousCount,
    percentageChange: Number(percentageChange.toFixed(1)),
    trend:
      percentageChange > 0
        ? "increasing"
        : percentageChange < 0
          ? "decreasing"
          : "stable",
  };
}

export function filterHotspotsByCategory(hotspots, category) {
  return hotspots.filter((hotspot) => hotspot.dominantCategory === category);
}

export function createDistanceBasedClusters(complaints, options = {}) {
  const { maxDistance = 5 } = options;
  const validComplaints = complaints.filter(hasCoordinates);

  if (!validComplaints.length) {
    return [];
  }

  function calculateDistance(lat1, lng1, lat2, lng2) {
    const earthRadiusKm = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  const clusters = [];
  const visited = new Set();

  validComplaints.forEach((complaint, index) => {
    if (visited.has(index)) {
      return;
    }

    const coordinates = getComplaintCoordinates(complaint);

    if (!coordinates) {
      return;
    }

    const clusterComplaints = [complaint];
    visited.add(index);

    for (let otherIndex = index + 1; otherIndex < validComplaints.length; otherIndex += 1) {
      if (visited.has(otherIndex)) {
        continue;
      }

      const otherComplaint = validComplaints[otherIndex];
      const otherCoordinates = getComplaintCoordinates(otherComplaint);

      if (!otherCoordinates) {
        continue;
      }

      const distance = calculateDistance(
        coordinates.lat,
        coordinates.lng,
        otherCoordinates.lat,
        otherCoordinates.lng
      );

      if (distance <= maxDistance) {
        clusterComplaints.push(otherComplaint);
        visited.add(otherIndex);
      }
    }

    if (clusterComplaints.length >= 2) {
      clusters.push(...createHotspotClusters(clusterComplaints, { minClusterSize: 2 }));
    }
  });

  return sortHotspotsByCountInternal(clusters);
}

export function generateHeatmapData(hotspots) {
  return hotspots.flatMap((hotspot) =>
    hotspot.complaints.map((complaint) => ({
      location: new window.google.maps.LatLng(Number(complaint.lat), Number(complaint.lng)),
      weight: 1,
    }))
  );
}
