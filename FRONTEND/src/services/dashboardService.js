import { getDashboardStats } from "./API.js";

export async function fetchDashboardStats() {
  const response = await getDashboardStats();
  return response.data;
}

export function normalizeGroupedData(items = [], labelKey) {
  return items
    .map((item) => ({
      label: item?.[labelKey] || "Unknown",
      count: Number(item?.count || 0),
    }))
    .sort((left, right) => right.count - left.count);
}