import { useEffect, useRef } from "react";
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
import HotspotAnalysis from "../components/HotspotAnalysis.jsx";
import HotspotMap from "../components/HotspotMap.jsx";
import InteractiveCard from "../components/InteractiveCard";
import SkeletonBlock from "../components/SkeletonBlock";
import { useComplaints } from "../context/useComplaints.js";
import { createPageAnimations } from "../interactions/animations";
import { buildComplaintDataLayers, sortComplaintsByLatest } from "../utils/complaintDataLayers.js";
import { getHotspotStats, getHotspotTrend } from "../utils/hotspotClustering.js";

const pieColors = ["#e7b86f", "#79d4b2", "#8cb6ff", "#f28b74", "#d6a2ff", "#9be4ff"];
const chartMargin = {
  top: 20,
  right: 30,
  left: 20,
  bottom: 72,
};
const tooltipContentStyle = {
  backgroundColor: "#111827",
  border: "1px solid #374151",
  borderRadius: "8px",
  color: "#E5E7EB",
};

const DashboardSkeleton = () => (
  <>
    <div className="stats-grid">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="dashboard-card glass-panel">
          <SkeletonBlock className="skeleton-line skeleton-line--short" />
          <SkeletonBlock className="skeleton-line skeleton-line--medium" />
        </div>
      ))}
    </div>

    <div className="chart-grid chart-grid--analytics">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="chart-card glass-panel">
          <SkeletonBlock className="skeleton-line skeleton-line--medium" />
          <SkeletonBlock className="skeleton-chart" />
        </div>
      ))}
    </div>
    <div className="chart-grid chart-grid--supplemental">
      <div className="chart-card glass-panel">
        <SkeletonBlock className="skeleton-line skeleton-line--medium" />
        <SkeletonBlock className="skeleton-chart" />
      </div>
    </div>
  </>
);

function countBy(items, key, fallbackLabel) {
  const counts = items.reduce((accumulator, item) => {
    const label = item[key] || fallbackLabel;
    accumulator[label] = (accumulator[label] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts)
    .map(([label, count]) => ({ [key]: label, count }))
    .sort((left, right) => right.count - left.count);
}

function getComplaintLocationLabel(complaint) {
  return complaint.locationData?.address || complaint.location || "Unknown location";
}

function humanizeLabel(label) {
  return String(label || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatLabel(label, maxLength = 12) {
  const readableLabel = humanizeLabel(label);
  return readableLabel.length > maxLength ? `${readableLabel.slice(0, maxLength)}…` : readableLabel;
}

function renderLegendLabel(value) {
  return <span style={{ color: "#E5E7EB" }}>{formatLabel(value, 16)}</span>;
}

function buildDashboardStats(rawComplaints, dedupedComplaints) {
  return {
    total_complaints: rawComplaints.length,
    new_complaints: dedupedComplaints.filter((complaint) => complaint.status === "NEW").length,
    in_progress_complaints: dedupedComplaints.filter(
      (complaint) => complaint.status === "IN_PROGRESS"
    ).length,
    resolved_complaints: dedupedComplaints.filter(
      (complaint) => complaint.status === "RESOLVED"
    ).length,
    complaints_by_category: countBy(dedupedComplaints, "category", "Uncategorized"),
    complaints_by_urgency: countBy(dedupedComplaints, "urgency", "Unknown"),
    complaints_by_department: countBy(dedupedComplaints, "department", "Unassigned"),
  };
}

function AdminDashboard() {
  const pageRef = useRef(null);
  const tableRef = useRef(null);
  const { complaints, error, isLoading } = useComplaints();
  const rawComplaints = complaints;
  const { dedupedComplaints, clusteredComplaints } = buildComplaintDataLayers(rawComplaints);

  useEffect(() => createPageAnimations(pageRef.current), []);
  const stats = buildDashboardStats(rawComplaints, dedupedComplaints);
  const resolvedComplaints = sortComplaintsByLatest(
    dedupedComplaints.filter((complaint) => complaint.status === "RESOLVED")
  );
  const recentComplaints = sortComplaintsByLatest(
    dedupedComplaints.filter((complaint) => complaint.status !== "RESOLVED")
  );

  // Overview hotspots are clustered from deduped complaints; detail markers use raw complaints.
  const hotspots = clusteredComplaints;
  const hotspotStats = getHotspotStats(hotspots);
  const hotspotTrend = getHotspotTrend(hotspots, "week");

  const scrollToTable = () => {
    tableRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleSummaryCardKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    scrollToTable();
  };

  const handleComplaintClick = (complaintId, event) => {
    event.preventDefault();

    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const complaintUrl = `${baseUrl}#/complaint-map/${complaintId}`;

    window.open(complaintUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div ref={pageRef} className="content-page">
      <section className="page-hero reveal-in">
        <span className="section-kicker">Admin dashboard</span>
        <h1 className="page-title gradient-reveal">
          Monitor complaint volume, urgency mix, routing distribution, and recent cases.
        </h1>
        <p className="page-copy">
          Track complaint volume, urgency, routing, and recent cases in one place.
        </p>
      </section>

      {error ? <p className="form-message form-message--error">{error}</p> : null}

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="stats-grid stagger-group">
            <InteractiveCard
              className="dashboard-card dashboard-card--action glass-panel"
              role="button"
              tabIndex={0}
              onClick={scrollToTable}
              onKeyDown={handleSummaryCardKeyDown}
            >
              <span className="metric-card__label">Total complaints</span>
              <strong className="dashboard-value">{stats.total_complaints}</strong>
            </InteractiveCard>
            <InteractiveCard
              className="dashboard-card dashboard-card--action glass-panel"
              role="button"
              tabIndex={0}
              onClick={scrollToTable}
              onKeyDown={handleSummaryCardKeyDown}
            >
              <span className="metric-card__label">New</span>
              <strong className="dashboard-value">{stats.new_complaints}</strong>
            </InteractiveCard>
            <InteractiveCard
              className="dashboard-card dashboard-card--action glass-panel"
              role="button"
              tabIndex={0}
              onClick={scrollToTable}
              onKeyDown={handleSummaryCardKeyDown}
            >
              <span className="metric-card__label">In progress</span>
              <strong className="dashboard-value">{stats.in_progress_complaints}</strong>
            </InteractiveCard>
            <InteractiveCard
              className="dashboard-card dashboard-card--action glass-panel"
              role="button"
              tabIndex={0}
              onClick={scrollToTable}
              onKeyDown={handleSummaryCardKeyDown}
            >
              <span className="metric-card__label">Resolved</span>
              <strong className="dashboard-value">{stats.resolved_complaints}</strong>
            </InteractiveCard>
            <InteractiveCard className="dashboard-card glass-panel">
              <span className="metric-card__label">Hotspots</span>
              <strong className="dashboard-value">{hotspotStats.totalHotspots}</strong>
            </InteractiveCard>
          </div>

          <HotspotMap
            rawComplaints={rawComplaints}
            hotspots={hotspots}
            title="Interactive hotspot map"
            description="Overview mode clusters deduplicated complaints. Click a hotspot to inspect every raw complaint marker inside that region."
          />

          <div className="chart-grid chart-grid--analytics stagger-group">
            <div className="chart-card glass-panel">
              <h3>Complaints by category</h3>
              <div className="chart-wrapper">
                <div className="chart-wrapper__inner">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.complaints_by_category} margin={chartMargin}>
                      <defs>
                        <linearGradient id="dashboardCategoryBarGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FFD166" />
                          <stop offset="100%" stopColor="#FFB703" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="rgba(148, 163, 184, 0.18)" />
                      <XAxis
                        dataKey="category"
                        interval={0}
                        angle={-35}
                        textAnchor="end"
                        height={78}
                        tickMargin={14}
                        tick={{ fill: "#E5E7EB", fontSize: 12 }}
                        tickFormatter={(value) => formatLabel(value, 14)}
                        axisLine={{ stroke: "rgba(148, 163, 184, 0.24)" }}
                        tickLine={{ stroke: "rgba(148, 163, 184, 0.24)" }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: "#E5E7EB", fontSize: 12 }}
                        axisLine={{ stroke: "rgba(148, 163, 184, 0.24)" }}
                        tickLine={{ stroke: "rgba(148, 163, 184, 0.24)" }}
                      />
                      <Tooltip
                        contentStyle={tooltipContentStyle}
                        cursor={{ fill: "rgba(255, 209, 102, 0.08)" }}
                        labelFormatter={(value) => humanizeLabel(value)}
                        formatter={(value) => [value, "Complaints"]}
                      />
                      <Bar
                        dataKey="count"
                        radius={[10, 10, 0, 0]}
                        fill="url(#dashboardCategoryBarGradient)"
                        animationDuration={700}
                        animationEasing="ease-out"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="chart-card glass-panel">
              <h3>Complaints by urgency</h3>
              <div className="chart-wrapper">
                <div className="chart-wrapper__inner">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 28 }}>
                      <Pie
                        data={stats.complaints_by_urgency}
                        dataKey="count"
                        nameKey="urgency"
                        outerRadius={92}
                        innerRadius={52}
                        paddingAngle={4}
                        labelLine={false}
                      >
                        {stats.complaints_by_urgency.map((entry, index) => (
                          <Cell
                            key={`${entry.urgency}-${index}`}
                            fill={pieColors[index % pieColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipContentStyle}
                        formatter={(value) => [value, "Complaints"]}
                        labelFormatter={(value) => humanizeLabel(value)}
                      />
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        wrapperStyle={{ paddingTop: "12px" }}
                        formatter={renderLegendLabel}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="chart-card glass-panel">
              <h3>Complaints by department</h3>
              <div className="chart-wrapper">
                <div className="chart-wrapper__inner">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.complaints_by_department} margin={chartMargin}>
                      <defs>
                        <linearGradient
                          id="dashboardDepartmentBarGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#9CC4FF" />
                          <stop offset="100%" stopColor="#5B8CFF" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="rgba(148, 163, 184, 0.18)" />
                      <XAxis
                        dataKey="department"
                        interval={0}
                        angle={-35}
                        textAnchor="end"
                        height={78}
                        tickMargin={14}
                        tick={{ fill: "#E5E7EB", fontSize: 12 }}
                        tickFormatter={(value) => formatLabel(value, 14)}
                        axisLine={{ stroke: "rgba(148, 163, 184, 0.24)" }}
                        tickLine={{ stroke: "rgba(148, 163, 184, 0.24)" }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: "#E5E7EB", fontSize: 12 }}
                        axisLine={{ stroke: "rgba(148, 163, 184, 0.24)" }}
                        tickLine={{ stroke: "rgba(148, 163, 184, 0.24)" }}
                      />
                      <Tooltip
                        contentStyle={tooltipContentStyle}
                        cursor={{ fill: "rgba(156, 196, 255, 0.08)" }}
                        labelFormatter={(value) => humanizeLabel(value)}
                        formatter={(value) => [value, "Complaints"]}
                      />
                      <Bar
                        dataKey="count"
                        radius={[10, 10, 0, 0]}
                        fill="url(#dashboardDepartmentBarGradient)"
                        animationDuration={700}
                        animationEasing="ease-out"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="chart-grid chart-grid--supplemental stagger-group">
            <HotspotAnalysis hotspots={hotspots} hotspotTrend={hotspotTrend} />
          </div>

          <div ref={tableRef} className="table-panel table-panel--anchor glass-panel reveal-in">
            <h2>Resolved complaints</h2>
            <p className="table-note">
              <strong>Resolved complaints stay here for reference after closure</strong>
            </p>
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Location</th>
                    <th>Category</th>
                    <th>Urgency</th>
                    <th>Department</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {resolvedComplaints.length ? (
                    resolvedComplaints.map((complaint) => (
                      <tr key={complaint.id}>
                        <td>{complaint.id}</td>
                        <td>
                          <a
                            href={`#/complaint-map/${complaint.id}`}
                            onClick={(e) => handleComplaintClick(complaint.id, e)}
                            className="text-link"
                            title="Click to open detailed view with map"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {complaint.title}
                          </a>
                        </td>
                        <td>{getComplaintLocationLabel(complaint)}</td>
                        <td>{complaint.category}</td>
                        <td>{complaint.urgency}</td>
                        <td>{complaint.department}</td>
                        <td>{complaint.status}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7}>No resolved complaints yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="table-panel glass-panel reveal-in">
            <h2>Recent complaints</h2>
            <p className="table-note">
              <strong>Click any complaint title to open detailed view with map in a new tab</strong>
            </p>
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Location</th>
                    <th>Category</th>
                    <th>Urgency</th>
                    <th>Department</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentComplaints.length ? (
                    recentComplaints.map((complaint) => (
                      <tr key={complaint.id}>
                        <td>{complaint.id}</td>
                        <td>
                          <a
                            href={`#/complaint-map/${complaint.id}`}
                            onClick={(e) => handleComplaintClick(complaint.id, e)}
                            className="text-link"
                            title="Click to open detailed view with map"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {complaint.title}
                          </a>
                        </td>
                        <td>{getComplaintLocationLabel(complaint)}</td>
                        <td>{complaint.category}</td>
                        <td>{complaint.urgency}</td>
                        <td>{complaint.department}</td>
                        <td>{complaint.status}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7}>No active complaints to show.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
