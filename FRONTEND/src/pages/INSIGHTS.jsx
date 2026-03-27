import { useEffect, useState } from "react";
import { API_BASE_URL } from "../services/API.js";

function Insights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/insights/admin-summary`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.detail || "Failed to load insights.");
        }

        setInsights(data);
      } catch (error) {
        console.error(error);
        setMessage(error.message || "Failed to load insights.");
      } finally {
        setLoading(false);
      }
    };

    void loadInsights();
  }, []);

  if (loading) {
    return <p style={{ opacity: 0.8 }}>Loading insights...</p>;
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <section
        style={{
          borderRadius: "28px",
          padding: "1.6rem",
          background:
            "radial-gradient(circle at top right, rgba(96,165,250,0.18), transparent 28%), linear-gradient(135deg, rgba(15,23,42,0.96), rgba(17,24,39,0.92))",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 16px 42px rgba(0,0,0,0.24)",
        }}
      >
        <div style={{ fontSize: "0.9rem", opacity: 0.78 }}>Admin Insights</div>
        <h1 style={{ margin: "0.35rem 0 0.55rem" }}>Smart complaint intelligence summary</h1>
        <p style={{ margin: 0, opacity: 0.88, lineHeight: 1.8 }}>
          A hackathon-friendly intelligence layer that highlights the top localities,
          departments, categories, and critical complaint pressure.
        </p>
      </section>

      {message ? (
        <div
          style={{
            padding: "0.95rem 1rem",
            borderRadius: "14px",
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.24)",
          }}
        >
          {message}
        </div>
      ) : null}

      {insights ? (
        <>
          <section
            style={{
              padding: "1rem",
              borderRadius: "20px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>AI-Style Summary</h3>
            <p style={{ margin: 0, lineHeight: 1.75 }}>{insights.summary}</p>
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "1rem",
            }}
          >
            <ListCard title="Top Localities" items={insights.top_localities} />
            <ListCard title="Top Categories" items={insights.top_categories} />
            <ListCard title="Top Departments" items={insights.top_departments} />
          </section>

          <section
            style={{
              padding: "1rem",
              borderRadius: "20px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Critical Complaint Count</h3>
            <p style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800 }}>
              {insights.critical_count}
            </p>
          </section>
        </>
      ) : null}
    </div>
  );
}

function ListCard({ title, items = [] }) {
  return (
    <section
      style={{
        padding: "1rem",
        borderRadius: "20px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <div style={{ display: "grid", gap: "0.6rem" }}>
        {items.length ? (
          items.map(([label, count]) => (
            <div
              key={`${title}-${label}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                padding: "0.75rem 0.85rem",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span>{label}</span>
              <strong>{count}</strong>
            </div>
          ))
        ) : (
          <p style={{ margin: 0, opacity: 0.78 }}>No data available.</p>
        )}
      </div>
    </section>
  );
}

export default Insights;