const path = require("path");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

app.use(cors());
app.use(express.json());

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 };
const complaints = [];
let nextComplaintId = 1;

function daysAgoISOString(daysAgo) {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeLocation(value) {
  return (value || "Unknown")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function titleCase(value) {
  return (value || "Unknown")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function urgencyBand(score) {
  if (score > 85) return "Critical";
  if (score > 70) return "High";
  if (score > 45) return "Medium";
  return "Low";
}

function percentageIncrease(currentValue, previousValue) {
  if (previousValue === 0) {
    return currentValue === 0 ? 0 : 100;
  }

  return Number((((currentValue - previousValue) / previousValue) * 100).toFixed(1));
}

function recentCountWithinDays(items, startDaysAgo, endDaysAgo) {
  const now = Date.now();
  const start = now - endDaysAgo * 24 * 60 * 60 * 1000;
  const end = now - startDaysAgo * 24 * 60 * 60 * 1000;

  return items.filter((item) => {
    const timestamp = new Date(item.timestamp).getTime();
    return timestamp >= start && timestamp < end;
  }).length;
}

function buildTrend(items) {
  const currentWindow = recentCountWithinDays(items, 0, 7);
  const previousWindow = recentCountWithinDays(items, 7, 14);

  return {
    last_7_days: currentWindow,
    previous_7_days: previousWindow,
    percentage_increase: percentageIncrease(currentWindow, previousWindow),
  };
}

function hashText(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

const knownLocations = {
  "sector 21 market": { lat: 28.5958, lng: 77.0911 },
  "mg road metro": { lat: 28.4808, lng: 77.0801 },
  "ward 12 clinic": { lat: 28.6322, lng: 77.2201 },
  "bus depot": { lat: 28.6122, lng: 77.2186 },
  "green park": { lat: 28.5591, lng: 77.2041 },
  "ring road signal": { lat: 28.6428, lng: 77.1074 },
  "central park": { lat: 28.6315, lng: 77.2167 },
  "railway colony": { lat: 28.6691, lng: 77.2278 },
  "city hospital gate": { lat: 28.6289, lng: 77.2116 },
};

function fallbackGeocode(locationText) {
  const normalized = normalizeLocation(locationText);

  if (knownLocations[normalized]) {
    return knownLocations[normalized];
  }

  const hash = hashText(normalized || "unknown-location");
  const latOffset = ((hash % 1000) / 1000 - 0.5) * 0.32;
  const lngOffset = ((((hash / 1000) | 0) % 1000) / 1000 - 0.5) * 0.32;

  return {
    lat: Number((DEFAULT_CENTER.lat + latOffset).toFixed(6)),
    lng: Number((DEFAULT_CENTER.lng + lngOffset).toFixed(6)),
  };
}

async function geocodeLocation(locationText) {
  if (!locationText) {
    return DEFAULT_CENTER;
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return fallbackGeocode(locationText);
  }

  try {
    const encodedAddress = encodeURIComponent(locationText);
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();

    if (data.status === "OK" && data.results?.[0]?.geometry?.location) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }
  } catch (error) {
    console.error("Google geocoding failed, using fallback coordinates.", error.message);
  }

  return fallbackGeocode(locationText);
}

function buildMockAnalysis(payload) {
  const title = (payload.title || "").trim();
  const description = (payload.description || payload.text || "").trim();
  const combinedText = `${title} ${description}`.trim();
  const lower = combinedText.toLowerCase();
  const extractedLocation = (payload.location || "Unknown").trim() || "Unknown";

  const ruleSet = [
    {
      keywords: ["streetlight", "light", "dark", "electric", "wire", "power"],
      department: "Electrical Department",
      subcategory: "Streetlight & Power",
      baseUrgency: 72,
    },
    {
      keywords: ["garbage", "trash", "waste", "bin", "dump"],
      department: "Sanitation Department",
      subcategory: "Garbage Collection",
      baseUrgency: 58,
    },
    {
      keywords: ["sewage", "drain", "water", "leak", "flood", "overflow"],
      department: "Water & Sewerage Department",
      subcategory: "Drainage & Water Leakage",
      baseUrgency: 78,
    },
    {
      keywords: ["pothole", "road", "signal", "traffic", "footpath"],
      department: "Public Works Department",
      subcategory: "Road & Traffic Infrastructure",
      baseUrgency: 69,
    },
    {
      keywords: ["tree", "park", "noise", "smoke", "pollution"],
      department: "Environment Department",
      subcategory: "Environmental Nuisance",
      baseUrgency: 46,
    },
    {
      keywords: ["theft", "unsafe", "harassment", "security", "dangerous"],
      department: "Public Safety Department",
      subcategory: "Public Safety",
      baseUrgency: 84,
    },
  ];

  const matchedRule =
    ruleSet.find((rule) => rule.keywords.some((keyword) => lower.includes(keyword))) || {
      department: "Civic Response Cell",
      subcategory: "General Civic Issue",
      baseUrgency: 52,
    };

  let urgencyScore = matchedRule.baseUrgency;

  const urgencyBoosts = [
    { phrase: "urgent", score: 10 },
    { phrase: "immediately", score: 10 },
    { phrase: "accident", score: 14 },
    { phrase: "injury", score: 16 },
    { phrase: "hospital", score: 8 },
    { phrase: "school", score: 6 },
    { phrase: "night", score: 7 },
    { phrase: "children", score: 7 },
    { phrase: "major", score: 8 },
    { phrase: "overflow", score: 8 },
  ];

  urgencyBoosts.forEach((boost) => {
    if (lower.includes(boost.phrase)) {
      urgencyScore += boost.score;
    }
  });

  if (combinedText.length > 180) {
    urgencyScore += 4;
  }

  urgencyScore = clamp(urgencyScore, 20, 99);

  const summarySource = description || title || "Civic issue reported by resident";
  const compactSummary = summarySource.length > 160 ? `${summarySource.slice(0, 157)}...` : summarySource;

  return {
    department: matchedRule.department,
    subcategory: matchedRule.subcategory,
    urgency_score: urgencyScore,
    location: extractedLocation,
    summary: `${matchedRule.subcategory} flagged near ${extractedLocation}. ${compactSummary}`,
  };
}

function buildComplaintFromSeed(seed) {
  const complaint = {
    id: nextComplaintId++,
    title: seed.title,
    description: seed.description,
    text: `${seed.title}. ${seed.description}`,
    department: seed.department,
    subcategory: seed.subcategory,
    category: seed.subcategory,
    urgency_score: seed.urgency_score,
    urgency: urgencyBand(seed.urgency_score),
    location: seed.location,
    extracted_location: seed.location,
    summary: seed.summary,
    ai_summary: seed.summary,
    lat: seed.lat,
    lng: seed.lng,
    timestamp: seed.timestamp,
    status: seed.status || "NEW",
    submitted_by: seed.submitted_by || "seed-data",
  };

  complaints.push(complaint);
}

function seedComplaints() {
  [
    {
      title: "Overflowing garbage bins near Sector 21 market",
      description: "Waste has piled up for two days and stray animals are spreading it across the road.",
      department: "Sanitation Department",
      subcategory: "Garbage Collection",
      urgency_score: 64,
      location: "Sector 21 Market",
      lat: 28.5958,
      lng: 77.0911,
      summary: "Garbage collection backlog reported near Sector 21 Market. Area requires scheduled cleanup.",
      timestamp: daysAgoISOString(1),
      status: "NEW",
    },
    {
      title: "Streetlight outage outside MG Road metro",
      description: "The stretch near the exit is completely dark and commuters feel unsafe at night.",
      department: "Electrical Department",
      subcategory: "Streetlight & Power",
      urgency_score: 82,
      location: "MG Road Metro",
      lat: 28.4808,
      lng: 77.0801,
      summary: "Streetlight failure reported near MG Road Metro. Immediate night-time restoration recommended.",
      timestamp: daysAgoISOString(2),
      status: "IN_PROGRESS",
    },
    {
      title: "Sewage leakage behind Ward 12 clinic",
      description: "Drain water is overflowing onto the footpath and causing a foul smell near the clinic gate.",
      department: "Water & Sewerage Department",
      subcategory: "Drainage & Water Leakage",
      urgency_score: 91,
      location: "Ward 12 Clinic",
      lat: 28.6322,
      lng: 77.2201,
      summary: "Sewage overflow reported near Ward 12 Clinic. Health risk is high and cleanup is urgent.",
      timestamp: daysAgoISOString(0),
      status: "NEW",
    },
    {
      title: "Potholes outside city bus depot",
      description: "Multiple deep potholes are slowing buses and causing near misses during peak hours.",
      department: "Public Works Department",
      subcategory: "Road & Traffic Infrastructure",
      urgency_score: 76,
      location: "Bus Depot",
      lat: 28.6122,
      lng: 77.2186,
      summary: "Road damage reported outside the bus depot. Repair is needed to reduce traffic and safety risk.",
      timestamp: daysAgoISOString(4),
      status: "IN_PROGRESS",
    },
    {
      title: "Garbage pickup missed in Sector 21 market lane",
      description: "Bins are full again and the lane has become difficult for pedestrians to use.",
      department: "Sanitation Department",
      subcategory: "Garbage Collection",
      urgency_score: 61,
      location: "Sector 21 Market",
      lat: 28.5958,
      lng: 77.0911,
      summary: "Repeated sanitation complaint near Sector 21 Market. Complaint volume indicates a hot zone.",
      timestamp: daysAgoISOString(6),
      status: "RESOLVED",
    },
    {
      title: "Drain blockage near Ward 12 clinic",
      description: "Water is stagnating after every wash cycle and patients are stepping through dirty water.",
      department: "Water & Sewerage Department",
      subcategory: "Drainage & Water Leakage",
      urgency_score: 87,
      location: "Ward 12 Clinic",
      lat: 28.6322,
      lng: 77.2201,
      summary: "Drain blockage reported near Ward 12 Clinic. Repeated complaint count makes this a hot zone.",
      timestamp: daysAgoISOString(8),
      status: "NEW",
    },
    {
      title: "Noise complaint near Green Park construction lane",
      description: "Construction debris trucks are operating late into the night and disturbing residents.",
      department: "Environment Department",
      subcategory: "Environmental Nuisance",
      urgency_score: 49,
      location: "Green Park",
      lat: 28.5591,
      lng: 77.2041,
      summary: "Night-time noise complaint reported near Green Park. Monitoring and enforcement may be required.",
      timestamp: daysAgoISOString(10),
      status: "RESOLVED",
    },
    {
      title: "Traffic signal malfunction at Ring Road junction",
      description: "The signal has been blinking continuously since morning and vehicles are crossing dangerously.",
      department: "Public Works Department",
      subcategory: "Road & Traffic Infrastructure",
      urgency_score: 89,
      location: "Ring Road Signal",
      lat: 28.6428,
      lng: 77.1074,
      summary: "Traffic signal malfunction reported at Ring Road junction. Immediate traffic engineering support required.",
      timestamp: daysAgoISOString(12),
      status: "IN_PROGRESS",
    },
  ].forEach(buildComplaintFromSeed);
}

seedComplaints();

async function buildComplaint(payload) {
  const analysis = buildMockAnalysis(payload);
  const coordinates = await geocodeLocation(analysis.location || payload.location);

  const complaint = {
    id: nextComplaintId++,
    title: (payload.title || "Untitled complaint").trim(),
    description: (payload.description || payload.text || "").trim(),
    text: (payload.text || `${payload.title || ""}. ${payload.description || ""}`).trim(),
    department: analysis.department,
    subcategory: analysis.subcategory,
    category: analysis.subcategory,
    urgency_score: analysis.urgency_score,
    urgency: urgencyBand(analysis.urgency_score),
    location: analysis.location,
    extracted_location: analysis.location,
    summary: analysis.summary,
    ai_summary: analysis.summary,
    lat: coordinates.lat,
    lng: coordinates.lng,
    timestamp: new Date().toISOString(),
    status: payload.status || "NEW",
    submitted_by: payload.submitted_by || "anonymous",
  };

  complaints.unshift(complaint);
  return complaint;
}

function buildLocationGroups(items) {
  const grouped = new Map();

  items.forEach((complaint) => {
    const key = normalizeLocation(complaint.location);
    const existing = grouped.get(key) || {
      key,
      location: complaint.location,
      count: 0,
      urgent_count: 0,
      lat: complaint.lat,
      lng: complaint.lng,
      complaints: [],
    };

    existing.count += 1;
    existing.urgent_count += complaint.urgency_score > 70 ? 1 : 0;
    existing.complaints.push(complaint);
    grouped.set(key, existing);
  });

  return Array.from(grouped.values())
    .map((entry) => ({
      location: entry.location,
      count: entry.count,
      urgent_count: entry.urgent_count,
      lat: entry.lat,
      lng: entry.lng,
      complaints: [...entry.complaints]
        .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
        .slice(0, 5),
    }))
    .sort((left, right) => right.count - left.count || right.urgent_count - left.urgent_count);
}

function countBy(items, accessor, labelKey) {
  const counts = new Map();

  items.forEach((item) => {
    const key = accessor(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({ [labelKey]: label, count }))
    .sort((left, right) => right.count - left.count || String(left[labelKey]).localeCompare(String(right[labelKey])));
}

function getStatsPayload() {
  const sortedComplaints = [...complaints].sort(
    (left, right) => new Date(right.timestamp) - new Date(left.timestamp)
  );
  const urgentComplaints = sortedComplaints.filter((complaint) => complaint.urgency_score > 70);
  const locationGroups = buildLocationGroups(sortedComplaints);
  const trend = buildTrend(sortedComplaints);

  return {
    total_complaints: sortedComplaints.length,
    urgent_complaints: urgentComplaints.length,
    complaints_grouped_by_location: locationGroups.map((group) => ({
      location: group.location,
      count: group.count,
    })),
    hot_zones: locationGroups.slice(0, 5).map((group) => ({
      location: group.location,
      count: group.count,
      lat: group.lat,
      lng: group.lng,
      urgent_count: group.urgent_count,
    })),
    percentage_increase: trend.percentage_increase,
    trend,
    recent_complaints: sortedComplaints.slice(0, 8),
    map_points: locationGroups,

    new_complaints: sortedComplaints.filter((complaint) => complaint.status === "NEW").length,
    in_progress_complaints: sortedComplaints.filter((complaint) => complaint.status === "IN_PROGRESS").length,
    resolved_complaints: sortedComplaints.filter((complaint) => complaint.status === "RESOLVED").length,
    complaints_by_category: countBy(sortedComplaints, (item) => item.category, "category"),
    complaints_by_urgency: countBy(sortedComplaints, (item) => item.urgency, "urgency"),
    complaints_by_department: countBy(sortedComplaints, (item) => item.department, "department"),
  };
}

async function handleAnalyze(req, res) {
  const { title = "", description = "", text = "", location = "" } = req.body || {};
  const content = `${title} ${description} ${text}`.trim();

  if (!content) {
    return res.status(400).json({ error: "Complaint title, description, or text is required." });
  }

  const analysis = buildMockAnalysis({ title, description, text, location });
  const coordinates = await geocodeLocation(analysis.location);

  return res.json({
    ...analysis,
    lat: coordinates.lat,
    lng: coordinates.lng,
    extracted_location: analysis.location,
    category: analysis.subcategory,
    urgency: urgencyBand(analysis.urgency_score),
    ai_summary: analysis.summary,
  });
}

async function handleCreateComplaint(req, res) {
  const { title = "", description = "", text = "" } = req.body || {};
  const content = `${title} ${description} ${text}`.trim();

  if (!content) {
    return res.status(400).json({ error: "Complaint title, description, or text is required." });
  }

  const complaint = await buildComplaint(req.body || {});
  return res.status(201).json(complaint);
}

function handleGetComplaints(req, res) {
  const sorted = [...complaints].sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp));
  return res.json(sorted);
}

function handleGetComplaintById(req, res) {
  const complaintId = Number(req.params.id);
  const complaint = complaints.find((item) => item.id === complaintId);

  if (!complaint) {
    return res.status(404).json({ error: "Complaint not found." });
  }

  return res.json(complaint);
}

function handleUpdateComplaintStatus(req, res) {
  const complaintId = Number(req.params.id);
  const complaint = complaints.find((item) => item.id === complaintId);

  if (!complaint) {
    return res.status(404).json({ error: "Complaint not found." });
  }

  const allowedStatuses = new Set(["NEW", "IN_PROGRESS", "RESOLVED"]);
  const status = String(req.body?.status || "").toUpperCase();

  if (!allowedStatuses.has(status)) {
    return res.status(400).json({ error: "Status must be NEW, IN_PROGRESS, or RESOLVED." });
  }

  complaint.status = status;
  return res.json(complaint);
}

function handleGetStats(req, res) {
  return res.json(getStatsPayload());
}

function handleGetConfig(req, res) {
  return res.json({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    mapsEnabled: Boolean(GOOGLE_MAPS_API_KEY),
    defaultCenter: DEFAULT_CENTER,
  });
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/health", (req, res) => res.json({ ok: true, service: "civiclens-demo" }));
app.get("/config", handleGetConfig);
app.post("/analyze", handleAnalyze);
app.post("/complaint", handleCreateComplaint);
app.get("/complaints", handleGetComplaints);
app.get("/complaints/:id", handleGetComplaintById);
app.patch("/complaints/:id/status", handleUpdateComplaintStatus);
app.get("/stats", handleGetStats);

app.get("/api/health/", (req, res) => res.json({ ok: true, service: "civiclens-demo" }));
app.post("/api/analyze/", handleAnalyze);
app.post("/api/complaints/", handleCreateComplaint);
app.get("/api/complaints/", handleGetComplaints);
app.get("/api/complaints/:id", handleGetComplaintById);
app.patch("/api/complaints/:id/status", handleUpdateComplaintStatus);
app.get("/api/dashboard/stats", handleGetStats);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

app.listen(PORT, () => {
  console.log(`CivicLens demo server running on http://localhost:${PORT}`);
});
