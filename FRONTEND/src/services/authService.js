import { API_BASE_URL } from "./API.js";

const AUTH_STORAGE_KEY = "civiclens-admin-auth";

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function request(path, options = {}) {
  const response = await fetch(buildUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error(
      payload?.detail || payload?.message || "Authentication request failed."
    );
    error.response = {
      status: response.status,
      data: payload,
    };
    throw error;
  }

  return payload;
}

export async function loginAdmin(username, password) {
  const payload = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export async function fetchCurrentAdmin(token) {
  return request("/api/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getStoredAuth() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Failed to read auth state.", error);
    return null;
  }
}

export function clearStoredAuth() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getStoredToken() {
  return getStoredAuth()?.access_token || null;
}

export { AUTH_STORAGE_KEY };