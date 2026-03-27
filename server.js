const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", true);
app.use(express.json({ limit: "1mb" }));

const DEFAULT_CENTER = Object.freeze({ lat: 28.6139, lng: 77.209 });
const ALLOWED_STATUSES = new Set(["NEW", "IN_PROGRESS", "RESOLVED"]);
const FRONTEND_DIST_DIR = path.join(__dirname, "FRONTEND", "dist");
const FRONTEND_INDEX_FILE = path.join(FRONTEND_DIST_DIR, "index.html");
const HAS_FRONTEND_BUNDLE = fs.existsSync(FRONTEND_INDEX_FILE);

const SESSION_COOKIE_NAME = "civiclens_session";
const OTP_COOKIE_NAME = "civiclens_otp";
const VERIFIED_EMAILS_COOKIE_NAME = "civiclens_verified";

const MAX_SESSION_COMPLAINTS = readPositiveInteger(process.env.MAX_SESSION_COMPLAINTS, 10);
const OTP_TTL_SECONDS = readPositiveInteger(process.env.OTP_TTL_SECONDS, 600);
const OTP_COOLDOWN_SECONDS = readPositiveInteger(process.env.OTP_COOLDOWN_SECONDS, 60);
const VERIFIED_EMAIL_TTL_SECONDS = readPositiveInteger(
  process.env.VERIFIED_EMAIL_TTL_SECONDS,
  24 * 60 * 60
);
const SESSION_SECRET = getSessionSecret();

if (!process.env.SESSION_SECRET) {
  console.warn(
    "SESSION_SECRET is not configured. Using a deterministic fallback secret. Set SESSION_SECRET to harden signed cookies."
  );
}

app.use((req, res, next) => {
  const allowedOrigin = process.env.CORS_ALLOW_ORIGIN;

  if (allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

function readPort() {\n  const rawPort = process.env.PORT;\n  console.log(`CivicLens: Raw PORT env value: "${rawPort || '<missing>'}"`);\n\n  if (!rawPort) {\n    throw new Error("PORT environment variable is required.");\n  }\n\n  const port = Number.parseInt(rawPort, 10);\n\n  if (!Number.isInteger(port) || port <= 0) {\n    throw new Error("PORT environment variable must be a positive integer.");\n  }\n\n  return port;\n}

function readPositiveInteger(rawValue, fallbackValue) {
  const numericValue = Number.parseInt(rawValue, 10);
  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : fallbackValue;
}

function getSessionSecret() {
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }

  return [
    "civiclens",
    process.env.K_SERVICE || "service",
    process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || "project",
    process.env.K_REVISION || "revision",
  ].join(":");
}

function appendSetCookie(res, cookieValue) {
  const existing = res.getHeader("Set-Cookie");

  if (!existing) {
    res.setHeader("Set-Cookie", cookieValue);
    return;
  }

  if (Array.isArray(existing)) {
    res.setHeader("Set-Cookie", [...existing, cookieValue]);
    return;
  }

  res.setHeader("Set-Cookie", [existing, cookieValue]);
}

function serializeCookie(name, value, options = {}) {
  const attributes = [`${name}=${value}`];

  if (options.maxAge !== undefined) {
    attributes.push(`Max-Age=${options.maxAge}`);
  }

  attributes.push(`Path=${options.path || "/"}`);

  if (options.httpOnly !== false) {
    attributes.push("HttpOnly");
  }

  if (options.sameSite) {
    attributes.push(`SameSite=${options.sameSite}`);
  }

  if (options.secure) {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}

function parseCookies(headerValue = "") {
  return headerValue
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((cookies, entry) => {
      const separatorIndex = entry.indexOf("=");

      if (separatorIndex === -1) {
        return cookies;
      }

      const key = entry.slice(0, separatorIndex).trim();
      const value = entry.slice(separatorIndex + 1).trim();
      cookies[key] = value;
      return cookies;
    }, {});
}

function timingSafeEquals(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function signValue(value) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

function encodeSignedPayload(payload) {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${signValue(encoded)}`;
}

function decodeSignedPayload(rawValue) {
  if (!rawValue || typeof rawValue !== "string") {
    return null;
  }

  const separatorIndex = rawValue.lastIndexOf(".");

  if (separatorIndex === -1) {
    return null;
  }

  const encoded = rawValue.slice(0, separatorIndex);
  const signature = rawValue.slice(separatorIndex + 1);
  const expectedSignature = signValue(encoded);

  if (!timingSafeEquals(signature, expectedSignature)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch (error) {
    return null;
  }
}

function cookieSecurityOptions(req, maxAge) {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: req.secure || process.env.NODE_ENV === "production",
    maxAge,
  };
}

function setSignedCookie(res, req, name, payload, maxAge) {
  appendSetCookie(
    res,
    serializeCookie(name, encodeSignedPayload(payload), cookieSecurityOptions(req, maxAge))
  );
}

function clearCookie(res, req, name) {
  appendSetCookie(
    res,
    serializeCookie(name, "", {
      ...cookieSecurityOptions(req, 0),
      maxAge: 0,
    })
  );
}

function readSignedCookie(req, name) {
  const cookies = parseCookies(req.headers.cookie || "");
  return decodeSignedPayload(cookies[name]);
}

function normalizeWhitespace(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeEmail(value) {
  return normalizeWhitespace(value).toLowerCase();
}

function normalizeLongText(value, maxLength) {
  return String(value || "").trim().replace(/\r\n/g, "\n").slice(0, maxLength);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeLocationKey(value) {
  return normalizeWhitespace(value).toLowerCase();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsKeyword(text, keyword) {
  const normalizedKeyword = normalizeWhitespace(keyword).toLowerCase();
  const pattern = new RegExp(
    `(^|[^a-z0-9])${escapeRegExp(normalizedKeyword).replace(/\s+/g, "\\s+")}([^a-z0-9]|$)`,
    "i"
  );

  return pattern.test(text);
}

function urgencyBand(score) {
  if (score > 85) return "Critical";
  if (score > 70) return "High";
  if (score > 45) return "Medium";
  return "Low";
}

function hashText(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

const KNOWN_LOCATIONS = Object.freeze({
  "sector 21 market": { lat: 28.5958, lng: 77.0911 },
  "mg road metro": { lat: 28.4808, lng: 77.0801 },
  "ward 12 clinic": { lat: 28.6322, lng: 77.2201 },
  "bus depot": { lat: 28.6122, lng: 77.2186 },
  "green park": { lat: 28.5591, lng: 77.2041 },
  "ring road signal": { lat: 28.6428, lng: 77.1074 },
  "central park": { lat: 28.6315, lng: 77.2167 },
  "railway colony": { lat: 28.6691, lng: 77.2278 },
  "city hospital gate": { lat: 28.6289, lng: 77.2116 },
});

function geocodeLocation(locationText) {
  const normalizedLocation = normalizeLocationKey(locationText);

  if (!normalizedLocation) {
    return DEFAULT_CENTER;
  }

  if (KNOWN_LOCATIONS[normalizedLocation]) {
    return KNOWN_LOCATIONS[normalizedLocation];
  }

  const hash = hashText(normalizedLocation);
  const latOffset = ((hash % 1000) / 1000 - 0.5) * 0.32;
  const lngOffset = ((((hash / 1000) | 0) % 1000) / 1000 - 0.5) * 0.32;

  return {
    lat: Number((DEFAULT_CENTER.lat + latOffset).toFixed(6)),
    lng: Number((DEFAULT_CENTER.lng + lngOffset).toFixed(6)),
  };
}

function daysAgoISOString(daysAgo) {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
}

function percentageIncrease(currentValue, previousValue) {
  if (previousValue === 0) {
    return currentValue === 0 ? 0 : 100;
  }

  return Number((((currentValue - previousValue) / previousValue) * 100).toFixed(1));
}

function recentCountWithinDays(items, startDaysAgo, endDaysAgo) {
  const now = Date.now();
  const rangeStart = now - endDaysAgo * 24 * 60 * 60 * 1000;
  const rangeEnd = now - startDaysAgo * 24 * 60 * 60 * 1000;

  return items.filter((item) => {
    const timestamp = new Date(item.created_at || item.timestamp).getTime();
    return timestamp >= rangeStart && timestamp < rangeEnd;
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

function countBy(items, accessor, labelKey) {
  const counts = new Map();

  items.forEach((item) => {
    const key = accessor(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({ [labelKey]: label, count }))
    .sort((left, right) => right.count - left.count || String(left[labelKey]).localeCompare(right[labelKey]));
}

function buildLocationGroups(items) {
  const grouped = new Map();

  items.forEach((complaint) => {
    const locationKey = normalizeLocationKey(complaint.location);
    const existing = grouped.get(locationKey) || {
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
    grouped.set(locationKey, existing);
  });

  return Array.from(grouped.values())
    .map((entry) => ({
      location: entry.location,
      count: entry.count,
      urgent_count: entry.urgent_count,
      lat: entry.lat,
      lng: entry.lng,
      complaints: [...entry.complaints]
        .sort((left, right) => {
          return new Date(right.created_at || right.timestamp) - new Date(left.created_at || left.timestamp);
        })
        .slice(0, 5),
    }))
    .sort((left, right) => right.count - left.count || right.urgent_count - left.urgent_count);
}

function buildStatsPayload(items) {
  const sortedComplaints = [...items].sort((left, right) => {
    return new Date(right.created_at || right.timestamp) - new Date(left.created_at || left.timestamp);
  });

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

function buildMockAnalysis(payload) {
  const title = normalizeWhitespace(payload.title);
  const description = normalizeLongText(payload.description || payload.text, 2000);
  const combinedText = `${title} ${description}`.trim();
  const lower = combinedText.toLowerCase();
  const extractedLocation = normalizeWhitespace(payload.location) || "Unknown";

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
    ruleSet.find((rule) => rule.keywords.some((keyword) => containsKeyword(lower, keyword))) || {
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

function complaintPayloadSeeds() {
  return [
    {
      id: 1,
      title: "Overflowing garbage bins near Sector 21 market",
      description: "Waste has piled up for two days and stray animals are spreading it across the road.",
      department: "Sanitation Department",
      subcategory: "Garbage Collection",
      urgency_score: 64,
      location: "Sector 21 Market",
      status: "NEW",
      daysAgo: 1,
      submitted_by: "seed-data",
      email: "seed-data@civiclens.ai",
    },
    {
      id: 2,
      title: "Streetlight outage outside MG Road metro",
      description: "The stretch near the exit is completely dark and commuters feel unsafe at night.",
      department: "Electrical Department",
      subcategory: "Streetlight & Power",
      urgency_score: 82,
      location: "MG Road Metro",
      status: "IN_PROGRESS",
      daysAgo: 2,
      submitted_by: "seed-data",
      email: "seed-data@civiclens.ai",
    },
    {
      id: 3,
      title: "Sewage leakage behind Ward 12 clinic",
      description: "Drain water is overflowing onto the footpath and causing a foul smell near the clinic gate.",
      department: "Water & Sewerage Department",
      subcategory: "Drainage & Water Leakage",
      urgency_score: 91,
      location: "Ward 12 Clinic",
      status: "NEW",
      daysAgo: 0,
      submitted_by: "seed-data",
      email: "seed-data@civiclens.ai",
    },
    {
      id: 4,
      title: "Potholes outside city bus depot",
      description: "Multiple deep potholes are slowing buses and causing near misses during peak hours.",
      department: "Public Works Department",
      subcategory: "Road & Traffic Infrastructure",
      urgency_score: 76,
      location: "Bus Depot",
      status: "IN_PROGRESS",
      daysAgo: 4,
      submitted_by: "seed-data",
      email: "seed-data@civiclens.ai",
    },
    {
      id: 5,
      title: "Garbage pickup missed in Sector 21 market lane",
      description: "Bins are full again and the lane has become difficult for pedestrians to use.",
      department: "Sanitation Department",
      subcategory: "Garbage Collection",
      urgency_score: 61,
      location: "Sector 21 Market",
      status: "RESOLVED",
      daysAgo: 6,
      submitted_by: "seed-data",
      email: "seed-data@civiclens.ai",
    },
    {
      id: 6,
      title: "Drain blockage near Ward 12 clinic",
      description: "Water is stagnating after every wash cycle and patients are stepping through dirty water.",
      department: "Water & Sewerage Department",
      subcategory: "Drainage & Water Leakage",
      urgency_score: 87,
      location: "Ward 12 Clinic",
      status: "NEW",
      daysAgo: 8,
      submitted_by: "seed-data",
      email: "seed-data@civiclens.ai",
    },
    {
      id: 7,
      title: "Noise complaint near Green Park construction lane",
      description: "Construction debris trucks are operating late into the night and disturbing residents.",
      department: "Environment Department",
      subcategory: "Environmental Nuisance",
      urgency_score: 49,
      location: "Green Park",
      status: "RESOLVED",
      daysAgo: 10,
      submitted_by: "seed-data",
      email: "seed-data@civiclens.ai",
    },
    {
      id: 8,
      title: "Traffic signal malfunction at Ring Road junction",
      description: "The signal has been blinking continuously since morning and vehicles are crossing dangerously.",
      department: "Public Works Department",
      subcategory: "Road & Traffic Infrastructure",
      urgency_score: 89,
      location: "Ring Road Signal",
      status: "IN_PROGRESS",
      daysAgo: 12,
      submitted_by: "seed-data",
      email: "seed-data@civiclens.ai",
    },
  ];
}

function getSampleComplaints() {
  return complaintPayloadSeeds().map((seed) => {
    const coordinates = geocodeLocation(seed.location);
    const createdAt = daysAgoISOString(seed.daysAgo);
    const summary =
      buildMockAnalysis({
        title: seed.title,
        description: seed.description,
        location: seed.location,
      }).summary;

    return {
      id: seed.id,
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
      summary,
      ai_summary: summary,
      lat: coordinates.lat,
      lng: coordinates.lng,
      status: seed.status,
      submitted_by: seed.submitted_by,
      email: seed.email,
      timestamp: createdAt,
      created_at: createdAt,
      persisted: "sample",
    };
  });
}

function buildComplaintRecord(payload) {
  const title = normalizeWhitespace(payload.title).slice(0, 200) || "Untitled complaint";
  const description = normalizeLongText(payload.description || payload.text, 2000);
  const location = normalizeWhitespace(payload.location).slice(0, 200) || "Unknown";
  const email = normalizeEmail(payload.email || payload.submitted_by);
  const submittedBy = normalizeWhitespace(payload.submitted_by || email || "anonymous").slice(0, 200);
  const analysis = buildMockAnalysis({ title, description, location });
  const coordinates = geocodeLocation(analysis.location || location);
  const createdAt = new Date().toISOString();

  return {
    id: Date.now() * 1000 + crypto.randomInt(0, 1000),
    title,
    description,
    text: description ? `${title}. ${description}` : title,
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
    status: "NEW",
    submitted_by: submittedBy,
    email,
    timestamp: createdAt,
    created_at: createdAt,
    persisted: "session",
  };
}

function getSessionState(req) {
  const cookiePayload = readSignedCookie(req, SESSION_COOKIE_NAME);
  const complaints = Array.isArray(cookiePayload?.complaints)
    ? cookiePayload.complaints
        .filter((complaint) => complaint && typeof complaint === "object")
        .slice(0, MAX_SESSION_COMPLAINTS)
    : [];
  const statusOverrides =
    cookiePayload?.status_overrides && typeof cookiePayload.status_overrides === "object"
      ? cookiePayload.status_overrides
      : {};

  return {
    complaints,
    status_overrides: statusOverrides,
  };
}

function persistSessionState(req, res, sessionState) {
  setSignedCookie(
    res,
    req,
    SESSION_COOKIE_NAME,
    {
      complaints: sessionState.complaints.slice(0, MAX_SESSION_COMPLAINTS),
      status_overrides: sessionState.status_overrides,
    },
    30 * 24 * 60 * 60
  );
}

function getVerifiedEmailState(req) {
  const payload = readSignedCookie(req, VERIFIED_EMAILS_COOKIE_NAME);

  if (!Array.isArray(payload?.emails)) {
    return [];
  }

  const now = Date.now();

  return payload.emails.filter((entry) => {
    const email = normalizeEmail(entry?.email);
    const expiresAt = Number(entry?.expires_at || 0);
    return Boolean(email) && expiresAt > now;
  });
}

function persistVerifiedEmailState(req, res, entries) {
  setSignedCookie(
    res,
    req,
    VERIFIED_EMAILS_COOKIE_NAME,
    { emails: entries },
    VERIFIED_EMAIL_TTL_SECONDS
  );
}

function isEmailVerified(req, email) {
  const normalizedEmail = normalizeEmail(email);
  return getVerifiedEmailState(req).some((entry) => normalizeEmail(entry.email) === normalizedEmail);
}

function getMergedComplaints(req) {
  const sessionState = getSessionState(req);
  const sampleComplaints = getSampleComplaints().map((complaint) => ({
    ...complaint,
    status: sessionState.status_overrides[String(complaint.id)] || complaint.status,
  }));
  const sessionComplaints = sessionState.complaints.map((complaint) => ({
    ...complaint,
    status: sessionState.status_overrides[String(complaint.id)] || complaint.status,
  }));

  return [...sessionComplaints, ...sampleComplaints].sort((left, right) => {
    const leftTime = new Date(left.created_at || left.timestamp || 0).getTime();
    const rightTime = new Date(right.created_at || right.timestamp || 0).getTime();

    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    return Number(right.id) - Number(left.id);
  });
}

function hashOtp(email, otp) {
  return crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(`${normalizeEmail(email)}:${String(otp).trim()}`)
    .digest("hex");
}

async function deliverOtp(email, otp) {
  const webhookUrl = process.env.OTP_DELIVERY_WEBHOOK_URL;

  if (!webhookUrl) {
    return {
      delivery: "inline",
      message: `Verification code: ${otp}. It expires in ${Math.floor(OTP_TTL_SECONDS / 60)} minutes.`,
    };
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 3000);

  try {
    const headers = { "Content-Type": "application/json" };

    if (process.env.OTP_DELIVERY_BEARER_TOKEN) {
      headers.Authorization = `Bearer ${process.env.OTP_DELIVERY_BEARER_TOKEN}`;
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email,
        otp,
        expires_in_seconds: OTP_TTL_SECONDS,
        service: "civiclens",
      }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`OTP delivery webhook returned ${response.status}.`);
    }

    return {
      delivery: "webhook",
      message: "Verification code sent.",
    };
  } catch (error) {
    return {
      delivery: "inline",
      message: `Verification code: ${otp}. Email delivery is unavailable right now.`,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function sendJsonError(res, statusCode, message, extra = {}) {
  return res.status(statusCode).json({
    error: message,
    ...extra,
  });
}

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function handleHealth(req, res) {
  return res.json({
    ok: true,
    service: "civiclens-backend",
    timestamp: new Date().toISOString(),
  });
}

function handleConfig(req, res) {
  return res.json({
    defaultCenter: DEFAULT_CENTER,
    frontendBundled: HAS_FRONTEND_BUNDLE,
    mapsEnabled: false,
    sessionStorage: "signed-http-only-cookies",
  });
}

function handleAnalyze(req, res) {
  const title = normalizeWhitespace(req.body?.title);
  const description = normalizeLongText(req.body?.description || req.body?.text, 2000);
  const location = normalizeWhitespace(req.body?.location);
  const content = `${title} ${description}`.trim();

  if (!content) {
    return sendJsonError(res, 400, "Complaint title, description, or text is required.");
  }

  const analysis = buildMockAnalysis({ title, description, location });
  const coordinates = geocodeLocation(analysis.location);

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

async function handleSendOtp(req, res) {
  const email = normalizeEmail(req.body?.email);

  if (!email) {
    return sendJsonError(res, 400, "Email address is required.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendJsonError(res, 400, "Enter a valid email address.");
  }

  const otp = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  const expiresAt = Date.now() + OTP_TTL_SECONDS * 1000;

  setSignedCookie(
    res,
    req,
    OTP_COOKIE_NAME,
    {
      email,
      otp_hash: hashOtp(email, otp),
      expires_at: expiresAt,
    },
    OTP_TTL_SECONDS
  );

  const deliveryResult = await deliverOtp(email, otp);

  return res.json({
    message: deliveryResult.message,
    cooldown_seconds: OTP_COOLDOWN_SECONDS,
    expires_in_seconds: OTP_TTL_SECONDS,
    delivery: deliveryResult.delivery,
  });
}

function handleVerifyOtp(req, res) {
  const email = normalizeEmail(req.body?.email);
  const otp = normalizeWhitespace(req.body?.otp);

  if (!email || !otp) {
    return sendJsonError(res, 400, "Email and OTP are required.");
  }

  const otpCookie = readSignedCookie(req, OTP_COOKIE_NAME);

  if (!otpCookie) {
    return sendJsonError(res, 400, "OTP session not found. Request a new code.");
  }

  if (normalizeEmail(otpCookie.email) !== email) {
    return sendJsonError(res, 400, "OTP does not match the requested email address.");
  }

  if (Number(otpCookie.expires_at || 0) < Date.now()) {
    clearCookie(res, req, OTP_COOKIE_NAME);
    return sendJsonError(res, 400, "OTP has expired. Request a new code.");
  }

  if (otpCookie.otp_hash !== hashOtp(email, otp)) {
    return sendJsonError(res, 400, "Invalid OTP.");
  }

  clearCookie(res, req, OTP_COOKIE_NAME);

  const currentEntries = getVerifiedEmailState(req).filter((entry) => normalizeEmail(entry.email) !== email);
  const verifiedEntry = {
    email,
    expires_at: Date.now() + VERIFIED_EMAIL_TTL_SECONDS * 1000,
  };

  persistVerifiedEmailState(req, res, [verifiedEntry, ...currentEntries].slice(0, 20));

  return res.json({
    verified: true,
    message: "Email verified successfully.",
  });
}

function handleGetComplaints(req, res) {
  return res.json(getMergedComplaints(req));
}

function handleGetComplaintById(req, res) {
  const complaint = getMergedComplaints(req).find((item) => String(item.id) === String(req.params.id));

  if (!complaint) {
    return sendJsonError(res, 404, "Complaint not found.");
  }

  return res.json(complaint);
}

function handleCreateComplaint(req, res) {
  const email = normalizeEmail(req.body?.email || req.body?.submitted_by);
  const title = normalizeWhitespace(req.body?.title);
  const description = normalizeLongText(req.body?.description || req.body?.text, 2000);
  const content = `${title} ${description}`.trim();

  if (!email) {
    return sendJsonError(res, 400, "Email address is required.");
  }

  if (!content) {
    return sendJsonError(res, 400, "Complaint title, description, or text is required.");
  }

  if (!isEmailVerified(req, email)) {
    return sendJsonError(res, 403, "Verify your email before submitting the complaint.");
  }

  const complaint = buildComplaintRecord(req.body || {});
  const sessionState = getSessionState(req);

  sessionState.complaints = [complaint, ...sessionState.complaints].slice(0, MAX_SESSION_COMPLAINTS);
  sessionState.status_overrides[String(complaint.id)] = complaint.status;
  persistSessionState(req, res, sessionState);

  return res.status(201).json(complaint);
}

function handleUpdateComplaintStatus(req, res) {
  const requestedStatus = normalizeWhitespace(req.body?.status).toUpperCase();

  if (!ALLOWED_STATUSES.has(requestedStatus)) {
    return sendJsonError(res, 400, "Status must be NEW, IN_PROGRESS, or RESOLVED.");
  }

  const sessionState = getSessionState(req);
  const complaintId = String(req.params.id);
  const existingComplaint = getMergedComplaints(req).find((item) => String(item.id) === complaintId);

  if (!existingComplaint) {
    return sendJsonError(res, 404, "Complaint not found.");
  }

  sessionState.complaints = sessionState.complaints.map((complaint) => {
    if (String(complaint.id) !== complaintId) {
      return complaint;
    }

    return {
      ...complaint,
      status: requestedStatus,
    };
  });
  sessionState.status_overrides[complaintId] = requestedStatus;
  persistSessionState(req, res, sessionState);

  return res.json({
    ...existingComplaint,
    status: requestedStatus,
  });
}

function handleGetStats(req, res) {
  return res.json(buildStatsPayload(getMergedComplaints(req)));
}

const apiRouter = express.Router();

apiRouter.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

apiRouter.get("/health/", handleHealth);
apiRouter.get("/config", handleConfig);
apiRouter.post("/analyze/", handleAnalyze);
apiRouter.post("/auth/send-otp", asyncHandler(handleSendOtp));
apiRouter.post("/auth/verify-otp", handleVerifyOtp);
apiRouter.post("/complaints/", handleCreateComplaint);
apiRouter.get("/complaints/", handleGetComplaints);
apiRouter.get("/complaints/:id", handleGetComplaintById);
apiRouter.patch("/complaints/:id/status", handleUpdateComplaintStatus);
apiRouter.get("/dashboard/stats", handleGetStats);

app.use("/api", apiRouter);
app.use("/api", (req, res) => sendJsonError(res, 404, "Route not found."));

app.get("/health", handleHealth);
app.get("/config", handleConfig);
app.post("/analyze", handleAnalyze);
app.post("/complaint", handleCreateComplaint);
app.get("/complaints", handleGetComplaints);
app.get("/complaints/:id", handleGetComplaintById);
app.patch("/complaints/:id/status", handleUpdateComplaintStatus);
app.get("/stats", handleGetStats);

if (HAS_FRONTEND_BUNDLE) {
  app.use(
    express.static(FRONTEND_DIST_DIR, {
      index: false,
      maxAge: "1h",
      etag: true,
    })
  );

  app.get("*", (req, res) => {
    res.sendFile(FRONTEND_INDEX_FILE);
  });
} else {
  app.get("/", (req, res) => {
    res.json({
      service: "civiclens-backend",
      ok: true,
      frontendBundled: false,
    });
  });
}

app.use((req, res) => {
  sendJsonError(res, 404, "Route not found.");
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error?.type === "entity.parse.failed") {
    return sendJsonError(res, 400, "Request body must be valid JSON.");
  }

  console.error("Unhandled request error:", error);
  return sendJsonError(res, 500, "Internal server error.");
});

console.log("CivicLens: Starting on Cloud Run compatible config");\nconsole.log("CivicLens: Reading PORT env...");\nconst port = readPort();\nconsole.log(`CivicLens: PORT=${port} validated successfully`);\nconsole.log("CivicLens: Starting Express server on 0.0.0.0...");\nconst server = app.listen(port, "0.0.0.0", () => {\n  console.log(`CivicLens: ✅ Server listening on 0.0.0.0:${port}`);\n  console.log("CivicLens: Health endpoint ready at /api/health");\n});

function shutdown(signal) {
  console.log(`${signal} received, shutting down.`);
  server.close(() => {
    process.exit(0);
  });

  setTimeout(() => {
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  shutdown("uncaughtException");
});
