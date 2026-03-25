import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import InteractiveCard from "../components/InteractiveCard";
import SkeletonBlock from "../components/SkeletonBlock";
import { createPageAnimations } from "../interactions/animations";
import { getAllComplaints, getDashboardStats } from "../services/API.js";

const pieColors = ["#e7b86f", "#79d4b2", "#8cb6ff", "#f28b74", "#d6a2ff", "#9be4ff"];

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

    <div className="chart-grid">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="chart-card glass-panel">
          <SkeletonBlock className="skeleton-line skeleton-line--medium" />
          <SkeletonBlock className="skeleton-chart" />
        </div>
      ))}
    </div>
  </>
);

function AdminDashboard() {
  const pageRef = useRef(null);
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => createPageAnimations(pageRef.current), []);

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [statsResponse, complaintsResponse] = await Promise.all([
          getDashboardStats(),
          getAllComplaints(),
        ]);

        setStats(statsResponse.data);
        setComplaints(complaintsResponse.data);
      } catch (loadError) {
        console.error(loadError);
        setError("Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div ref={pageRef} className="content-page">
      <section className="page-hero reveal-in">
        <span className="section-kicker">Admin dashboard</span>
        <h1 className="page-title gradient-reveal">
          Monitor complaint volume, urgency mix, routing distribution, and recent cases.
        </h1>
        <p className="page-copy">
          The async data layer is unchanged, but the presentation now uses skeleton
          states, glass panels, animated reveals, and interactive surfaces.
        </p>
      </section>

      {error ? <p className="form-message form-message--error">{error}</p> : null}

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {stats ? (
            <div className="stats-grid stagger-group">
              <InteractiveCard className="dashboard-card glass-panel">
                <span className="metric-card__label">Total complaints</span>
                <strong className="dashboard-value">{stats.total_complaints}</strong>
              </InteractiveCard>
              <InteractiveCard className="dashboard-card glass-panel">
                <span className="metric-card__label">New</span>
                <strong className="dashboard-value">{stats.new_complaints}</strong>
              </InteractiveCard>
              <InteractiveCard className="dashboard-card glass-panel">
                <span className="metric-card__label">In progress</span>
                <strong className="dashboard-value">{stats.in_progress_complaints}</strong>
              </InteractiveCard>
              <InteractiveCard className="dashboard-card glass-panel">
                <span className="metric-card__label">Resolved</span>
                <strong className="dashboard-value">{stats.resolved_complaints}</strong>
              </InteractiveCard>
            </div>
          ) : null}

          {stats ? (
            <div className="chart-grid stagger-group">
              <div className="chart-card glass-panel">
                <h3>Complaints by category</h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={stats.complaints_by_category}>
                      <XAxis dataKey="category" stroke="#d6e1ff" />
                      <YAxis stroke="#8ea2cf" />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(8, 16, 34, 0.92)",
                          border: "1px solid rgba(231, 184, 111, 0.3)",
                          borderRadius: "16px",
                        }}
                      />
                      <Bar dataKey="count" radius={[10, 10, 0, 0]} fill="#e7b86f" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card glass-panel">
                <h3>Complaints by urgency</h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={stats.complaints_by_urgency}
                        dataKey="count"
                        nameKey="urgency"
                        outerRadius={110}
                        innerRadius={56}
                        label
                      >
                        {stats.complaints_by_urgency.map((entry, index) => (
                          <Cell
                            key={`${entry.urgency}-${index}`}
                            fill={pieColors[index % pieColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "rgba(8, 16, 34, 0.92)",
                          border: "1px solid rgba(231, 184, 111, 0.3)",
                          borderRadius: "16px",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card glass-panel">
                <h3>Complaints by department</h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={stats.complaints_by_department}>
                      <XAxis dataKey="department" stroke="#d6e1ff" />
                      <YAxis stroke="#8ea2cf" />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(8, 16, 34, 0.92)",
                          border: "1px solid rgba(231, 184, 111, 0.3)",
                          borderRadius: "16px",
                        }}
                      />
                      <Bar dataKey="count" radius={[10, 10, 0, 0]} fill="#8cb6ff" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : null}

          <div className="table-panel glass-panel reveal-in">
            <h2>Recent complaints</h2>
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Urgency</th>
                    <th>Department</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((complaint) => (
                    <tr key={complaint.id}>
                      <td>{complaint.id}</td>
                      <td>
                        <Link
                          to={`/complaint/${complaint.id}`}
                          className="text-link"
                          data-interactive="true"
                          data-cursor-scale="1.15"
                        >
                          {complaint.title}
                        </Link>
                      </td>
                      <td>{complaint.category}</td>
                      <td>{complaint.urgency}</td>
                      <td>{complaint.department}</td>
                      <td>{complaint.status}</td>
                    </tr>
                  ))}
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
