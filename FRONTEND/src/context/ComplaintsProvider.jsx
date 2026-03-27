import { useCallback, useEffect, useMemo, useState } from "react";
import { ComplaintsContext } from "./ComplaintsContext.js";
import {
  createComplaint as createComplaintRequest,
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const refreshComplaints = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [complaintList, stats] = await Promise.all([
        getComplaints(),
        getDashboardStats().catch(() => null),
      ]);

      const cleanComplaints = Array.isArray(complaintList) ? complaintList : [];
      setComplaints(cleanComplaints);
      setDashboardStats(stats || buildClientStats(cleanComplaints));
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load complaints.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refreshComplaints();
  }, [refreshComplaints]);

  const addComplaint = useCallback(async (payload) => {
    const newComplaint = await createComplaintRequest(payload);
    setComplaints((current) => [newComplaint, ...current]);
    return newComplaint;
  }, []);

  const updateComplaintStatus = useCallback(async (id, status) => {
    const updated = await updateComplaintStatusRequest(id, status);
    setComplaints((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    );
    return updated;
  }, []);

  const filteredComplaints = useMemo(
    () => applyComplaintFilters(complaints, filters),
    [complaints, filters]
  );

  const filteredStats = useMemo(
    () => buildClientStats(filteredComplaints),
    [filteredComplaints]
  );

  const hotspots = useMemo(
    () => buildLocalityHotspots(filteredComplaints).slice(0, 10),
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

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const value = useMemo(
    () => ({
      complaints,
      filteredComplaints,
      dashboardStats,
      filteredStats,
      hotspots,
      loading,
      refreshing,
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
      loading,
      refreshing,
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