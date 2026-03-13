import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardStats, getAllComplaints } from "../services/API.js";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const statsResponse = await getDashboardStats();
      const complaintsResponse = await getAllComplaints();

      setStats(statsResponse.data);
      setComplaints(complaintsResponse.data);
    } catch (err) {
      setError("Failed to load dashboard data.");
      console.error(err);
    }
  };

  const pieColors = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2"];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Admin Dashboard</h1>
      <p style={styles.subtitle}>
        Monitor complaint volumes, urgency levels, routing distribution, and recent cases.
      </p>

      {error && <p style={styles.error}>{error}</p>}

      {stats && (
        <>
          <div style={styles.statsGrid}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Total Complaints</h3>
              <p style={styles.cardValue}>{stats.total_complaints}</p>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>New</h3>
              <p style={styles.cardValue}>{stats.new_complaints}</p>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>In Progress</h3>
              <p style={styles.cardValue}>{stats.in_progress_complaints}</p>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Resolved</h3>
              <p style={styles.cardValue}>{stats.resolved_complaints}</p>
            </div>
          </div>

          <div style={styles.chartGrid}>
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Complaints by Category</h3>
              <div style={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.complaints_by_category}>
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Complaints by Urgency</h3>
              <div style={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.complaints_by_urgency}
                      dataKey="count"
                      nameKey="urgency"
                      outerRadius={100}
                      label
                    >
                      {stats.complaints_by_urgency.map((entry, index) => (
                        <Cell key={`urgency-cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Complaints by Department</h3>
              <div style={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.complaints_by_department}>
                    <XAxis dataKey="department" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      <div style={styles.tableContainer}>
        <h2 style={styles.sectionTitle}>Recent Complaints</h2>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Urgency</th>
              <th style={styles.th}>Department</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>

          <tbody>
            {complaints.map((complaint) => (
              <tr key={complaint.id}>
                <td style={styles.td}>{complaint.id}</td>
                <td style={styles.td}>
                  <Link to={`/complaint/${complaint.id}`} style={styles.link}>
                    {complaint.title}
                  </Link>
                </td>
                <td style={styles.td}>{complaint.category}</td>
                <td style={styles.td}>{complaint.urgency}</td>
                <td style={styles.td}>{complaint.department}</td>
                <td style={styles.td}>{complaint.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    padding: "32px",
    background: "#f7f9fc",
  },
  title: {
    textAlign: "center",
    marginBottom: "8px",
    color: "#1f2937",
    fontSize: "2.3rem",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: "28px",
    color: "#6b7280",
  },
  error: {
    color: "#dc2626",
    textAlign: "center",
    marginBottom: "16px",
    fontWeight: "600",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "28px",
  },
  card: {
    background: "#ffffff",
    padding: "22px",
    borderRadius: "14px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  cardTitle: {
    marginBottom: "10px",
    color: "#4b5563",
    fontSize: "1rem",
  },
  cardValue: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  chartGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "20px",
    marginBottom: "32px",
  },
  chartCard: {
    background: "#ffffff",
    padding: "20px",
    borderRadius: "14px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },
  chartTitle: {
    marginBottom: "16px",
    color: "#1f2937",
    textAlign: "center",
  },
  chartWrapper: {
    width: "100%",
    height: "300px",
  },
  tableContainer: {
    background: "#ffffff",
    padding: "20px",
    borderRadius: "14px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    overflowX: "auto",
  },
  sectionTitle: {
    marginBottom: "16px",
    color: "#1f2937",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
    color: "#374151",
    background: "#f9fafb",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
    color: "#374151",
  },
  link: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: "600",
  },
};

export default AdminDashboard;