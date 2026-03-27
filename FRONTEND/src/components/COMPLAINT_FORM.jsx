import { useState } from "react";
import { useComplaints } from "../context/useComplaints.js";
import { getCoordinates } from "../utils/geocode.js";
import LocationPickerMap from "./LocationPickerMap.jsx";

function StatPill({ label, value }) {
  return (
    <div
      style={{
        padding: "0.85rem 0.95rem",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ fontSize: "0.82rem", opacity: 0.72 }}>{label}</div>
      <div style={{ marginTop: "0.28rem", fontWeight: 700 }}>
        {value ?? "N/A"}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: "0.48rem" }}>
      <span style={{ fontSize: "0.96rem", fontWeight: 700 }}>{label}</span>
      {children}
    </label>
  );
}

function ComplaintForm() {
  const { addComplaint } = useComplaints();

  const [submittedBy, setSubmittedBy] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [latestComplaint, setLatestComplaint] = useState(null);

  const handleMapLocationSelect = ({ name, lat, lng }) => {
    setLocationInput(name);
    setSelectedCoordinates({ lat, lng, name });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setLatestComplaint(null);

    try {
      if (!title.trim() || !description.trim() || !locationInput.trim()) {
        throw new Error("Please fill title, description, and location.");
      }

      let resolvedLocation = selectedCoordinates;

      if (
        !resolvedLocation ||
        !Number.isFinite(Number(resolvedLocation.lat)) ||
        !Number.isFinite(Number(resolvedLocation.lng))
      ) {
        resolvedLocation = await getCoordinates(locationInput.trim());
      }

      const complaint = await addComplaint({
        title: title.trim(),
        description: description.trim(),
        location: resolvedLocation.name || locationInput.trim(),
        lat: resolvedLocation.lat,
        lng: resolvedLocation.lng,
        submitted_by: submittedBy.trim() || "anonymous_user",
      });

      setLatestComplaint(complaint);
      setMessage("Complaint submitted successfully.");
      setTitle("");
      setDescription("");
      setLocationInput("");
      setSelectedCoordinates(null);
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Failed to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  const isError =
    message.toLowerCase().includes("fail") ||
    message.toLowerCase().includes("please") ||
    message.toLowerCase().includes("required");

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.08fr 0.92fr",
        gap: "1.25rem",
        alignItems: "start",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: "1rem",
          padding: "1.35rem",
          borderRadius: "26px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 14px 36px rgba(0,0,0,0.18)",
        }}
      >
        <div>
          <div style={{ fontSize: "0.88rem", opacity: 0.78 }}>Complaint details</div>
          <h2 style={{ margin: "0.35rem 0 0" }}>Register a grievance</h2>
        </div>

        <Field label="Username">
          <input
            value={submittedBy}
            onChange={(e) => setSubmittedBy(e.target.value)}
            placeholder="Enter your username"
            style={inputStyle}
          />
        </Field>

        <Field label="Complaint title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Example: Electricity outage in Rohini Sector 9"
            style={inputStyle}
          />
        </Field>

        <Field label="Complaint description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="Describe the issue clearly, including urgency and what is happening on ground."
            style={{ ...inputStyle, resize: "vertical", minHeight: "140px" }}
          />
        </Field>

        <Field label="Location">
          <input
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            placeholder="Example: Rohini Sector 9, Delhi"
            style={inputStyle}
          />
        </Field>

        <LocationPickerMap
          selectedLocation={selectedCoordinates}
          onLocationSelect={handleMapLocationSelect}
        />

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "1rem 1.15rem",
            borderRadius: "16px",
            border: "none",
            cursor: "pointer",
            fontWeight: 800,
            fontSize: "0.98rem",
            background: "#f8fafc",
            color: "#0f172a",
            boxShadow: "0 10px 26px rgba(0,0,0,0.2)",
          }}
        >
          {submitting ? "Submitting..." : "Submit Complaint"}
        </button>

        {message ? (
          <div
            style={{
              padding: "0.95rem 1rem",
              borderRadius: "14px",
              background: isError
                ? "rgba(239,68,68,0.12)"
                : "rgba(34,197,94,0.12)",
              border: isError
                ? "1px solid rgba(239,68,68,0.24)"
                : "1px solid rgba(34,197,94,0.24)",
            }}
          >
            {message}
          </div>
        ) : null}
      </form>

      <section
        style={{
          display: "grid",
          gap: "1rem",
          padding: "1.35rem",
          borderRadius: "26px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 14px 36px rgba(0,0,0,0.18)",
        }}
      >
        <div>
          <div style={{ fontSize: "0.88rem", opacity: 0.78 }}>AI intake preview</div>
          <h2 style={{ margin: "0.35rem 0 0" }}>Latest complaint intelligence</h2>
        </div>

        {latestComplaint ? (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.8rem",
              }}
            >
              <StatPill label="Complaint ID" value={latestComplaint.id} />
              <StatPill label="Category" value={latestComplaint.category} />
              <StatPill label="Urgency" value={latestComplaint.urgency} />
              <StatPill label="Priority Score" value={latestComplaint.priority_score} />
              <StatPill label="Department" value={latestComplaint.department} />
              <StatPill label="Locality" value={latestComplaint.locality} />
              <StatPill label="Region" value={latestComplaint.region} />
              <StatPill label="Duplicate Of" value={latestComplaint.duplicate_of} />
            </div>

            <div
              style={{
                padding: "1rem",
                borderRadius: "18px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ fontSize: "0.86rem", opacity: 0.74, marginBottom: "0.45rem" }}>
                AI Summary
              </div>
              <div style={{ lineHeight: 1.75 }}>
                {latestComplaint.ai_summary || "No summary available."}
              </div>
            </div>
          </>
        ) : (
          <div
            style={{
              padding: "1rem",
              borderRadius: "18px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              lineHeight: 1.75,
              opacity: 0.86,
            }}
          >
            Once a complaint is submitted, this panel will show the generated category,
            urgency, priority, routing department, duplicate signal, and location
            intelligence.
          </div>
        )}

        <div
          style={{
            padding: "1rem",
            borderRadius: "18px",
            background: "linear-gradient(135deg, rgba(96,165,250,0.12), rgba(34,197,94,0.08))",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Why this matters</h3>
          <p style={{ margin: 0, lineHeight: 1.75, opacity: 0.9 }}>
            Good complaint intake is the foundation of the whole system. A cleaner
            and more professional submission flow improves trust, demo quality, and
            the quality of downstream classification, clustering, and routing.
          </p>
        </div>
      </section>
    </div>
  );
}

const inputStyle = {
  padding: "0.92rem 1rem",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "inherit",
  fontSize: "0.97rem",
};

export default ComplaintForm;