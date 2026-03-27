import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import MapComponent from "../components/MapComponent.jsx";
import RegionFilter from "../components/RegionFilter.jsx";
import HotspotLegend from "../components/HotspotLegend.jsx";
import { useComplaints } from "../context/useComplaints.js";
import {
  buildPriorityBandSummary,
  countBy,
} from "../services/clusterService.js";

const PIE_COLORS = [
  "#e7b86f",
  "#79d4b2",
  "#8cb6ff",
  "#f28b74",
  "#d6a2ff",
  "#9be4ff",
  "#ef4444",
  "#22c55e",
];

function StatCard({ label, value, subtitle }) {
  return (
    <div
      style={{
        padding: "1.1rem",
        borderRadius: "18px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ fontSize: "0.88rem", opacity: 0.78, marginBottom: "0.5rem" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.9rem", fontWeight: 800 }}>{value}</div>
      {subtitle ? (
        <div style={{ marginTop: "0.35rem", fontSize: "0.9rem", opacity: 0.72 }}>
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

function SectionCard({ title, children, subtitle }) {
  return (
    <section
      style={{
        padding: "1rem",
        borderRadius: "20px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        {subtitle ? (
          <p style={{ margin: "0.35rem 0 0", opacity: 0.78 }}>{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function AdminDashboard() {
  const {
    complaints,
    filteredComplaints,
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
  } = useComplaints();

  const categoryData = useMemo(
    () =>
      countBy(filteredComplaints, "category", "UNASSIGNED").map((entry) => ({
        category: entry.label,
        count: entry.count,
      })),
    [filteredComplaints]
  );

  const urgencyData = useMemo(
    () =>
      countBy(filteredComplaints, "urgency", "UNASSIGNED").map((entry) => ({
        urgency: entry.label,
        count: entry.count,
      })),
    [filteredComplaints]
  );

  const departmentData = useMemo(
    () =>
      countBy(filteredComplaints, "department", "UNASSIGNED").map((entry) => ({
        department: entry.label,
        count: entry.count,
      })),
    [filteredComplaints]
  );

  const regionData = useMemo(
    () =>
      countBy(filteredComplaints, "region", "UNCLASSIFIED").map((entry) => ({
        region: entry.label,
        count: entry.count,
      })),
    [filteredComplaints]
  );

  const priorityBandData = useMemo(
    () =>
      buildPriorityBandSummary(filteredComplaints).map((entry) => ({
        band: entry.label,
        count: entry.count,
      })),
    [filteredComplaints]
  );

  const topRecentComplaints = useMemo(
    () => filteredComplaints.slice(0, 12),
    [filteredComplaints]
  );

  const onFilterChange = (key, value) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }));
  };

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <section
        style={{
          display: "grid",
          gap: "0.75rem",
          padding: "1rem",
          borderRadius: "20px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ fontSize: "0.9rem", opacity: 0.78 }}>Admin dashboard</div>
        <h1 style={{ margin: 0 }}>Complaint intelligence and locality insights</h1>
        <p style={{ margin: 0, opacity: 0.8 }}>
          Monitor complaint volume, urgency, region routing, duplicate-heavy
          pockets, and locality hotspots.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => void refreshComplaints()}
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "12px",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {isRefreshing ? "Refreshing..." : "Refresh data"}
          </button>
          <div style={{ display: "flex", alignItems: "center", opacity: 0.75 }}>
            Total loaded: {complaints.length} | Current filtered view:{" "}
            {filteredComplaints.length}
          </div>
        </div>

        {error ? (
          <div
            style={{
              padding: "0.95rem 1rem",
              borderRadius: "14px",
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.25)",
            }}
          >
            {error}
          </div>
        ) : null}
      </section>

      <RegionFilter
        filters={filters}
        options={filterOptions}
        onFilterChange={onFilterChange}
        onReset={resetFilters}
      />

      {isLoading ? (
        <div
          style={{
            padding: "1.2rem",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          Loading complaint intelligence...
        </div>
      ) : (
        <>
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            <StatCard
              label="Total complaints"
              value={filteredStats.total_complaints}
              subtitle="Current filtered view"
            />
            <StatCard
              label="New"
              value={filteredStats.new_complaints}
              subtitle="Awaiting action"
            />
            <StatCard
              label="In progress"
              value={filteredStats.in_progress_complaints}
              subtitle="Under review or assigned"
            />
            <StatCard
              label="Resolved"
              value={filteredStats.resolved_complaints}
              subtitle="Closed complaints"
            />
            <StatCard
              label="Duplicates detected"
              value={filteredStats.duplicates_detected}
              subtitle="Potential repeated reports"
            />
          </section>

          <HotspotLegend />

          <MapComponent complaints={filteredComplaints} />

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "1rem",
            }}
          >
            <SectionCard title="Complaints by category">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="category" hide />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Complaints">
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`${entry.category}-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>

            <SectionCard title="Complaints by urgency">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={urgencyData}
                    dataKey="count"
                    nameKey="urgency"
                    outerRadius={100}
                    label
                  >
                    {urgencyData.map((entry, index) => (
                      <Cell
                        key={`${entry.urgency}-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </SectionCard>

            <SectionCard title="Complaints by department">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="department" hide />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Complaints">
                    {departmentData.map((entry, index) => (
                      <Cell
                        key={`${entry.department}-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>

            <SectionCard title="Complaints by region">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={regionData}
                    dataKey="count"
                    nameKey="region"
                    outerRadius={100}
                    label
                  >
                    {regionData.map((entry, index) => (
                      <Cell
                        key={`${entry.region}-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </SectionCard>

            <SectionCard title="Priority band distribution">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={priorityBandData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="band" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Complaints">
                    {priorityBandData.map((entry, index) => (
                      <Cell
                        key={`${entry.band}-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>

            <SectionCard
              title="Top locality hotspots"
              subtitle="High-volume areas in the current filtered view"
            >
              <div style={{ display: "grid", gap: "0.8rem" }}>
                {hotspots.length ? (
                  hotspots.map((hotspot) => (
                    <div
                      key={`${hotspot.locality}-${hotspot.region}`}
                      style={{
                        padding: "0.9rem",
                        borderRadius: "14px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{hotspot.locality}</div>
                      <div style={{ opacity: 0.78, marginTop: "0.2rem" }}>
                        {hotspot.region}
                      </div>
                      <div style={{ marginTop: "0.55rem", fontSize: "0.92rem" }}>
                        Complaints: {hotspot.complaintCount} | Duplicates:{" "}
                        {hotspot.duplicateCount} | Top category:{" "}
                        {hotspot.topCategory} | Top urgency: {hotspot.topUrgency}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ margin: 0, opacity: 0.8 }}>
                    No hotspots available for the selected filters.
                  </p>
                )}
              </div>
            </SectionCard>
          </section>

          <SectionCard
            title="Recent complaints"
            subtitle="Latest complaints in the filtered dashboard view"
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left" }}>
                    <th style={{ padding: "0.75rem" }}>ID</th>
                    <th style={{ padding: "0.75rem" }}>Title</th>
                    <th style={{ padding: "0.75rem" }}>Locality</th>
                    <th style={{ padding: "0.75rem" }}>Region</th>
                    <th style={{ padding: "0.75rem" }}>Category</th>
                    <th style={{ padding: "0.75rem" }}>Urgency</th>
                    <th style={{ padding: "0.75rem" }}>Priority</th>
                    <th style={{ padding: "0.75rem" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topRecentComplaints.map((complaint) => (
                    <tr key={complaint.id}>
                      <td style={{ padding: "0.75rem" }}>{complaint.id}</td>
                      <td style={{ padding: "0.75rem" }}>
                        <Link to={`/complaint/${complaint.id}`}>
                          {complaint.title}
                        </Link>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {complaint.locality || "UNKNOWN"}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {complaint.region || "UNCLASSIFIED"}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {complaint.category || "UNASSIGNED"}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {complaint.urgency || "UNASSIGNED"}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {complaint.priority_score ?? "N/A"}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {complaint.status || "NEW"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!topRecentComplaints.length ? (
                <p style={{ marginTop: "1rem", opacity: 0.8 }}>
                  No complaints available for the selected filters.
                </p>
              ) : null}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;