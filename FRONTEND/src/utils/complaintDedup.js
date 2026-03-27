const TITLE_SIMILARITY_THRESHOLD = 0.8;
const DUPLICATE_DISTANCE_THRESHOLD_METERS = 75;
const GEO_BUCKET_SIZE_DEGREES = DUPLICATE_DISTANCE_THRESHOLD_METERS / 111320;

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "at",
  "be",
  "for",
  "from",
  "in",
  "is",
  "of",
  "on",
  "the",
  "to",
  "with",
  "problem",
  "issue",
  "complaint",
  "case",
  "report",
  "reported",
]);

const URGENCY_RANK = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function cleanText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value, { removeStopWords = true } = {}) {
  const cleanedValue = cleanText(value);

  if (!cleanedValue || !removeStopWords) {
    return cleanedValue;
  }

  const filteredTokens = cleanedValue
    .split(" ")
    .filter((token) => token && !STOP_WORDS.has(token));

  return filteredTokens.length ? filteredTokens.join(" ") : cleanedValue;
}

function tokenize(value) {
  return normalizeText(value)
    .split(" ")
    .filter(Boolean);
}

function getComplaintCoordinates(complaint) {
  const lat = Number(complaint?.lat ?? complaint?.locationData?.lat ?? complaint?.location?.lat);
  const lng = Number(complaint?.lng ?? complaint?.locationData?.lng ?? complaint?.location?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

function getComplaintLocationText(complaint) {
  return (
    complaint?.locationData?.address ||
    complaint?.formatted_address ||
    complaint?.address ||
    complaint?.location?.address ||
    complaint?.location?.name ||
    complaint?.location ||
    ""
  );
}

function calculateLevenshteinDistance(left, right) {
  const leftLength = left.length;
  const rightLength = right.length;

  if (leftLength === 0) {
    return rightLength;
  }

  if (rightLength === 0) {
    return leftLength;
  }

  const previousRow = Array.from({ length: rightLength + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= leftLength; leftIndex += 1) {
    let previousDiagonal = previousRow[0];
    previousRow[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= rightLength; rightIndex += 1) {
      const storedValue = previousRow[rightIndex];
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;

      previousRow[rightIndex] = Math.min(
        previousRow[rightIndex] + 1,
        previousRow[rightIndex - 1] + 1,
        previousDiagonal + substitutionCost
      );

      previousDiagonal = storedValue;
    }
  }

  return previousRow[rightLength];
}

function getTitleSimilarity(leftTitle, rightTitle) {
  const normalizedLeft = normalizeText(leftTitle);
  const normalizedRight = normalizeText(rightTitle);

  if (!normalizedLeft && !normalizedRight) {
    return 1;
  }

  if (!normalizedLeft || !normalizedRight) {
    return 0;
  }

  if (normalizedLeft === normalizedRight) {
    return 1;
  }

  const leftTokens = tokenize(normalizedLeft);
  const rightTokens = tokenize(normalizedRight);
  const rightTokenSet = new Set(rightTokens);
  const leftTokenSet = new Set(leftTokens);

  let sharedTokenCount = 0;
  leftTokenSet.forEach((token) => {
    if (rightTokenSet.has(token)) {
      sharedTokenCount += 1;
    }
  });

  const minimumTokenCount = Math.min(leftTokenSet.size, rightTokenSet.size);
  const tokenContainment =
    minimumTokenCount > 0 ? sharedTokenCount / minimumTokenCount : 0;
  const tokenDice =
    leftTokenSet.size + rightTokenSet.size > 0
      ? (2 * sharedTokenCount) / (leftTokenSet.size + rightTokenSet.size)
      : 0;

  const maxLength = Math.max(normalizedLeft.length, normalizedRight.length);
  const levenshteinSimilarity =
    maxLength > 0
      ? 1 - calculateLevenshteinDistance(normalizedLeft, normalizedRight) / maxLength
      : 1;

  const includesSimilarity =
    normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft)
      ? tokenContainment
      : 0;

  return Math.max(levenshteinSimilarity, tokenContainment, tokenDice, includesSimilarity);
}

function getDistanceInMeters(leftCoordinates, rightCoordinates) {
  if (!leftCoordinates || !rightCoordinates) {
    return Number.POSITIVE_INFINITY;
  }

  const earthRadiusMeters = 6371000;
  const toRadians = (value) => (value * Math.PI) / 180;
  const latDelta = toRadians(rightCoordinates.lat - leftCoordinates.lat);
  const lngDelta = toRadians(rightCoordinates.lng - leftCoordinates.lng);
  const leftLat = toRadians(leftCoordinates.lat);
  const rightLat = toRadians(rightCoordinates.lat);
  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(leftLat) * Math.cos(rightLat) * Math.sin(lngDelta / 2) ** 2;
  const centralAngle = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return earthRadiusMeters * centralAngle;
}

function hasSameLocation(leftMetadata, rightMetadata) {
  if (
    leftMetadata.normalizedLocation &&
    rightMetadata.normalizedLocation &&
    leftMetadata.normalizedLocation === rightMetadata.normalizedLocation
  ) {
    return true;
  }

  return (
    getDistanceInMeters(leftMetadata.coordinates, rightMetadata.coordinates) <=
    DUPLICATE_DISTANCE_THRESHOLD_METERS
  );
}

function getCoordinateBucketParts(coordinates) {
  if (!coordinates) {
    return null;
  }

  return {
    latBucket: Math.floor(coordinates.lat / GEO_BUCKET_SIZE_DEGREES),
    lngBucket: Math.floor(coordinates.lng / GEO_BUCKET_SIZE_DEGREES),
  };
}

function getNearbyCoordinateBucketKeys(bucketParts) {
  if (!bucketParts) {
    return [];
  }

  const bucketKeys = [];

  for (let latOffset = -1; latOffset <= 1; latOffset += 1) {
    for (let lngOffset = -1; lngOffset <= 1; lngOffset += 1) {
      bucketKeys.push(
        `${bucketParts.latBucket + latOffset}:${bucketParts.lngBucket + lngOffset}`
      );
    }
  }

  return bucketKeys;
}

function getComplaintNumericId(complaint) {
  return Number(complaint?.id ?? complaint?.complaintId ?? 0) || 0;
}

function getComplaintTimestamp(complaint) {
  const createdAtTime = Number(new Date(complaint?.created_at || complaint?.updated_at || 0));
  return Number.isFinite(createdAtTime) ? createdAtTime : 0;
}

function getUrgencyRank(complaint) {
  return URGENCY_RANK[normalizeText(complaint?.urgency, { removeStopWords: false })] || 0;
}

function getCompletenessScore(complaint) {
  return [
    complaint?.location ? 1 : 0,
    getComplaintCoordinates(complaint) ? 1 : 0,
    complaint?.description ? 1 : 0,
  ].reduce((total, score) => total + score, 0);
}

function compareComplaintsForKeeping(leftComplaint, rightComplaint) {
  const urgencyDifference = getUrgencyRank(rightComplaint) - getUrgencyRank(leftComplaint);

  if (urgencyDifference !== 0) {
    return urgencyDifference;
  }

  const timestampDifference = getComplaintTimestamp(rightComplaint) - getComplaintTimestamp(leftComplaint);

  if (timestampDifference !== 0) {
    return timestampDifference;
  }

  const idDifference = getComplaintNumericId(rightComplaint) - getComplaintNumericId(leftComplaint);

  if (idDifference !== 0) {
    return idDifference;
  }

  return getCompletenessScore(rightComplaint) - getCompletenessScore(leftComplaint);
}

function buildComplaintMetadata(complaint) {
  const normalizedTitle = normalizeText(complaint?.title || complaint?.description || "");
  const normalizedLocation = normalizeText(getComplaintLocationText(complaint));
  const coordinates = getComplaintCoordinates(complaint);
  const coordinateBucketParts = getCoordinateBucketParts(coordinates);
  const locationKey =
    normalizedLocation ||
    (coordinateBucketParts
      ? `${coordinateBucketParts.latBucket}:${coordinateBucketParts.lngBucket}`
      : "");

  return {
    complaint,
    normalizedTitle,
    normalizedLocation,
    coordinates,
    exactKey: normalizedTitle && locationKey ? `${normalizedTitle}::${locationKey}` : "",
    coordinateBucketKey: coordinateBucketParts
      ? `${coordinateBucketParts.latBucket}:${coordinateBucketParts.lngBucket}`
      : "",
    nearbyCoordinateBucketKeys: getNearbyCoordinateBucketKeys(coordinateBucketParts),
  };
}

function addComplaintToBucket(bucketMap, bucketKey, complaintMetadata) {
  if (!bucketKey) {
    return;
  }

  const existingBucket = bucketMap.get(bucketKey);

  if (existingBucket) {
    existingBucket.push(complaintMetadata);
    return;
  }

  bucketMap.set(bucketKey, [complaintMetadata]);
}

function getCandidateMatches(complaintMetadata, locationBuckets, coordinateBuckets) {
  const candidates = new Set();

  if (complaintMetadata.normalizedLocation) {
    const locationMatches = locationBuckets.get(complaintMetadata.normalizedLocation) || [];
    locationMatches.forEach((candidate) => candidates.add(candidate));
  }

  complaintMetadata.nearbyCoordinateBucketKeys.forEach((bucketKey) => {
    const coordinateMatches = coordinateBuckets.get(bucketKey) || [];
    coordinateMatches.forEach((candidate) => candidates.add(candidate));
  });

  return Array.from(candidates);
}

function isDuplicateComplaint(candidateMetadata, keptMetadata) {
  if (!hasSameLocation(candidateMetadata, keptMetadata)) {
    return false;
  }

  return (
    getTitleSimilarity(candidateMetadata.normalizedTitle, keptMetadata.normalizedTitle) >=
    TITLE_SIMILARITY_THRESHOLD
  );
}

function defaultSortByLatest(items) {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.created_at || 0).getTime();
    const rightTime = new Date(right.created_at || 0).getTime();

    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    return getComplaintNumericId(right) - getComplaintNumericId(left);
  });
}

export function dedupeComplaintsByContentAndLocation(complaints, sortByLatest = defaultSortByLatest) {
  const exactMatches = new Map();
  const locationBuckets = new Map();
  const coordinateBuckets = new Map();
  const uniqueComplaints = [];
  const prioritizedComplaints = [...complaints].sort(compareComplaintsForKeeping);

  prioritizedComplaints.forEach((complaint) => {
    const complaintMetadata = buildComplaintMetadata(complaint);

    if (complaintMetadata.exactKey && exactMatches.has(complaintMetadata.exactKey)) {
      return;
    }

    const hasSemanticDuplicate = getCandidateMatches(
      complaintMetadata,
      locationBuckets,
      coordinateBuckets
    ).some((keptComplaintMetadata) => isDuplicateComplaint(complaintMetadata, keptComplaintMetadata));

    if (hasSemanticDuplicate) {
      return;
    }

    uniqueComplaints.push(complaint);

    if (complaintMetadata.exactKey) {
      exactMatches.set(complaintMetadata.exactKey, complaintMetadata);
    }

    addComplaintToBucket(locationBuckets, complaintMetadata.normalizedLocation, complaintMetadata);
    addComplaintToBucket(
      coordinateBuckets,
      complaintMetadata.coordinateBucketKey,
      complaintMetadata
    );
  });

  return sortByLatest(uniqueComplaints);
}
