function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function applyComplaintFilters(complaints = [], filters = {}) {
  const search = normalizeText(filters.search);

  return complaints.filter((complaint) => {
    const matchesRegion =
      !filters.region || filters.region === "ALL"
        ? true
        : (complaint.region || "UNCLASSIFIED") === filters.region;

    const matchesLocality =
      !filters.locality || filters.locality === "ALL"
        ? true
        : (complaint.locality || "UNKNOWN") === filters.locality;

    const matchesCategory =
      !filters.category || filters.category === "ALL"
        ? true
        : (complaint.category || "UNASSIGNED") === filters.category;

    const matchesUrgency =
      !filters.urgency || filters.urgency === "ALL"
        ? true
        : (complaint.urgency || "UNASSIGNED") === filters.urgency;

    const matchesDepartment =
      !filters.department || filters.department === "ALL"
        ? true
        : (complaint.department || "UNASSIGNED") === filters.department;

    const matchesStatus =
      !filters.status || filters.status === "ALL"
        ? true
        : (complaint.status || "NEW") === filters.status;

    const matchesSearch = !search
      ? true
      : [
          complaint.title,
          complaint.description,
          complaint.location,
          complaint.locality,
          complaint.region,
          complaint.category,
          complaint.department,
        ]
          .filter(Boolean)
          .some((field) => normalizeText(field).includes(search));

    return (
      matchesRegion &&
      matchesLocality &&
      matchesCategory &&
      matchesUrgency &&
      matchesDepartment &&
      matchesStatus &&
      matchesSearch
    );
  });
}

export function countBy(items = [], key, fallbackLabel = "Unknown") {
  const counts = items.reduce((accumulator, item) => {
    const label = item?.[key] || fallbackLabel;
    accumulator[label] = (accumulator[label] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count);
}

export function buildPriorityBandSummary(complaints = []) {
  const summary = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    UNASSIGNED: 0,
  };

  complaints.forEach((complaint) => {
    const score = Number(complaint?.priority_score);
    let band = "UNASSIGNED";

    if (Number.isFinite(score)) {
      if (score >= 75) band = "CRITICAL";
      else if (score >= 50) band = "HIGH";
      else if (score >= 30) band = "MEDIUM";
      else band = "LOW";
    }

    summary[band] += 1;
  });

  return Object.entries(summary).map(([label, count]) => ({ label, count }));
}

export function buildLocalityHotspots(complaints = []) {
  const hotspotMap = {};

  complaints.forEach((complaint) => {
    const locality = complaint?.locality || "UNKNOWN";
    const region = complaint?.region || "UNCLASSIFIED";
    const category = complaint?.category || "UNASSIGNED";
    const urgency = complaint?.urgency || "UNASSIGNED";
    const duplicateCount = complaint?.duplicate_of ? 1 : 0;
    const priority = Number(complaint?.priority_score || 0);

    if (!hotspotMap[locality]) {
      hotspotMap[locality] = {
        locality,
        region,
        complaintCount: 0,
        duplicateCount: 0,
        highestPriority: 0,
        topCategoryMap: {},
        topUrgencyMap: {},
      };
    }

    hotspotMap[locality].complaintCount += 1;
    hotspotMap[locality].duplicateCount += duplicateCount;
    hotspotMap[locality].highestPriority = Math.max(
      hotspotMap[locality].highestPriority,
      priority
    );
    hotspotMap[locality].topCategoryMap[category] =
      (hotspotMap[locality].topCategoryMap[category] || 0) + 1;
    hotspotMap[locality].topUrgencyMap[urgency] =
      (hotspotMap[locality].topUrgencyMap[urgency] || 0) + 1;
  });

  return Object.values(hotspotMap)
    .map((entry) => {
      const topCategory = Object.entries(entry.topCategoryMap).sort(
        (left, right) => right[1] - left[1]
      )[0]?.[0] || "UNASSIGNED";

      const topUrgency = Object.entries(entry.topUrgencyMap).sort(
        (left, right) => right[1] - left[1]
      )[0]?.[0] || "UNASSIGNED";

      return {
        locality: entry.locality,
        region: entry.region,
        complaintCount: entry.complaintCount,
        duplicateCount: entry.duplicateCount,
        highestPriority: entry.highestPriority,
        topCategory,
        topUrgency,
      };
    })
    .sort((left, right) => {
      if (right.complaintCount !== left.complaintCount) {
        return right.complaintCount - left.complaintCount;
      }
      return right.highestPriority - left.highestPriority;
    });
}

export function buildUniqueOptions(complaints = [], key, fallbackLabel) {
  const values = new Set();

  complaints.forEach((complaint) => {
    values.add(complaint?.[key] || fallbackLabel);
  });

  return Array.from(values).sort((left, right) => left.localeCompare(right));
}