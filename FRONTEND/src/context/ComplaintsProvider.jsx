import { useCallback, useEffect, useMemo, useState } from "react";
import { ComplaintsContext } from "./ComplaintsContext.js";
import {
  getComplaints,
  getDashboardStats,
  updateComplaintStatus as updateComplaintStatusRequest,
} from "../services/API.js";
import {
  applyComplaintFilters,
  buildLocalityHotspots,
  buildPriorityBandSummary,
  buildUniqueOptions,
  countBy,
} from "../services/clusterService.js";

const INITIAL_FILTERS = {
  search: "",
  region: "ALL",
  locality: "ALL",
  category: "ALL",
  urgency: "ALL",
  department: "ALL",
  status: "ALL",
};

function buildClientStats(complaints = []) {
  return {
    total_complaints: complaints.length,
    new_complaints: complaints.filter((item) => item.status === "NEW").length,
    in_progress_complaints: complaints.filter(
      (item) => item.status === "IN_PROGRESS"
    ).length,
    resolved_complaints: complaints.filter((item) => item.status === "RESOLVED")
      .length,
    duplicates_detected: complaints.filter((item) => item.duplicate_of !== null)
      .length,
    complaints_by_category: countBy(complaints, "category", "UNASSIGNED").map(
      (entry) => ({
        category: entry.label,
        count: entry.count,
      })
    ),
    complaints_by_urgency: countBy(complaints, "urgency", "UNASSIGNED").map(
      (entry) => ({
        urgency: entry.label,
        count: entry.count,
      })
    ),
    complaints_by_department: countBy(
      complaints,
      "department",
      "UNASSIGNED"
    ).map((entry) => ({
      department: entry.label,
      count: entry.count,
    })),
    complaints_by_region: countBy(complaints, "region", "UNCLASSIFIED").map(
      (entry) => ({
        region: entry.label,
        count: entry.count,
      })
    ),
    complaints_by_locality: countBy(complaints, "locality", "UNKNOWN")
      .slice(0, 10)
      .map((entry) => ({
        locality: entry.label,
        count: entry.count,
      })),
    complaints_by_priority_band: buildPriorityBandSummary(complaints).map(
      (entry) => ({
        band: entry.label,
        count: entry.count,
      })
    ),
  };
}

export function ComplaintsProvider({ children }) {
  const [complaints, setComplaints] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError("");

    try {
      const [complaintsResponse, statsResponse] = await Promise.all([
        getComplaints(),
        getDashboardStats().catch(() => ({ data: null })),
      ]);

      const complaintItems = Array.isArray(complaintsResponse.data)
        ? complaintsResponse.data
        : [];

      setComplaints(complaintItems);
      setDashboardStats(statsResponse.data || buildClientStats(complaintItems));
    } catch (loadError) {
      console.error(loadError);
      setError(
        loadError?.response?.data?.detail ||
          loadError?.message ||
          "Failed to load complaints."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredComplaints = useMemo(
    () => applyComplaintFilters(complaints, filters),
    [complaints, filters]
  );

  const filteredStats = useMemo(
    () => buildClientStats(filteredComplaints),
    [filteredComplaints]
  );

  const hotspots = useMemo(
    () => buildLocalityHotspots(filteredComplaints).slice(0, 8),
    [filteredComplaints]
  );

  const filterOptions = useMemo(
    () => ({
      regions: buildUniqueOptions(complaints, "region", "UNCLASSIFIED"),
      localities: buildUniqueOptions(complaints, "locality", "UNKNOWN"),
      categories: buildUniqueOptions(complaints, "category", "UNASSIGNED"),
      urgencies: buildUniqueOptions(complaints, "urgency", "UNASSIGNED"),
      departments: buildUniqueOptions(complaints, "department", "UNASSIGNED"),
      statuses: buildUniqueOptions(complaints, "status", "NEW"),
    }),
    [complaints]
  );

  const refreshComplaints = useCallback(async () => {
    await loadData({ silent: true });
  }, [loadData]);

  const addComplaint = useCallback((complaint) => {
    setComplaints((currentComplaints) => [complaint, ...currentComplaints]);
    setDashboardStats((currentStats) =>
      currentStats
        ? buildClientStats([complaint, ...complaints])
        : currentStats
    );
  }, [complaints]);

  const updateComplaintStatus = useCallback(async (complaintId, status) => {
    const response = await updateComplaintStatusRequest(complaintId, status);
    const updatedComplaint = response.data;

    setComplaints((currentComplaints) =>
      currentComplaints.map((complaint) =>
        complaint.id === updatedComplaint.id ? updatedComplaint : complaint
      )
    );

    return updatedComplaint;
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const value = useMemo(
    () => ({
      complaints,
      filteredComplaints,
      dashboardStats: dashboardStats || buildClientStats(complaints),
      filteredStats,
      hotspots,
      isLoading,
      isRefreshing,
      error,
      filters,
      setFilters,
      resetFilters,
      filterOptions,
      refreshComplaints,
      addComplaint,
      updateComplaintStatus,
    }),
    [
      complaints,
      filteredComplaints,
      dashboardStats,
      filteredStats,
      hotspots,
      isLoading,
      isRefreshing,
      error,
      filters,
      resetFilters,
      filterOptions,
      refreshComplaints,
      addComplaint,
      updateComplaintStatus,
    ]
  );

  return (
    <ComplaintsContext.Provider value={value}>
      {children}
    </ComplaintsContext.Provider>
  );
}