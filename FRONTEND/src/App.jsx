import { Link, Route, Routes } from "react-router-dom";

import Home from "./pages/HOME.jsx";
import SubmitComplaint from "./pages/SUBMIT_COMPLAINT.jsx";
import AdminDashboard from "./pages/ADMIN_DASHBOARD.jsx";
import ComplaintDetails from "./pages/COMPLAINT_DETAILS.jsx";
import TrackComplaints from "./pages/TRACK_COMPLAINTS.jsx";
import Insights from "./pages/INSIGHTS.jsx";

function Layout({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #07111f 0%, #0b1728 45%, #0f1d32 100%)",
        color: "#f8fafc",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "blur(14px)",
          background: "rgba(7,17,31,0.75)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <Link
            to="/"
            style={{
              color: "#f8fafc",
              textDecoration: "none",
              fontWeight: 800,
              fontSize: "1.1rem",
              letterSpacing: "0.02em",
            }}
          >
            CivicLens AI
          </Link>

          <nav
            style={{
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <Link to="/" style={navLinkStyle}>Home</Link>
            <Link to="/submit" style={navLinkStyle}>Submit</Link>
            <Link to="/track" style={navLinkStyle}>Track</Link>
            <Link to="/dashboard" style={navLinkStyle}>Dashboard</Link>
            <Link to="/insights" style={navLinkStyle}>Insights</Link>
          </nav>
        </div>
      </header>

      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "1.5rem 1.25rem 3rem",
        }}
      >
        {children}
      </main>
    </div>
  );
}

const navLinkStyle = {
  color: "#cbd5e1",
  textDecoration: "none",
  fontWeight: 600,
};

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/submit" element={<SubmitComplaint />} />
        <Route path="/track" element={<TrackComplaints />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/complaint/:id" element={<ComplaintDetails />} />
      </Routes>
    </Layout>
  );
}

export default App;