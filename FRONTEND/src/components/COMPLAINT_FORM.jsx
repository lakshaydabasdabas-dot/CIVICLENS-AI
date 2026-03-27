import { useState } from "react";
import MagneticButton from "./MagneticButton";
import LocationPickerMap from "./LocationPickerMap.jsx";
import SkeletonBlock from "./SkeletonBlock";
import { createComplaint } from "../services/API.js";
import { useComplaints } from "../context/useComplaints.js";
import { useComplaintLocation } from "../hooks/useComplaintLocation.js";

function AnalysisChip({ label, value }) {
  return (
    <div className="analysis-chip">
      <span>{label}</span>
      <strong>{value || "N/A"}</strong>
    </div>
  );
}

function ComplaintForm() {
  const { addComplaint } = useComplaints();
  const {
    locationInput,
    locationState,
    locationError,
    isResolvingLocation,
    updateLocationInput,
    selectLocationFromMap,
    resolveLocation,
    resetLocation,
  } = useComplaintLocation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [message, setMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setIsAnalyzing(true);
    setMessage("");

    try {
      if (!title.trim() || !description.trim()) {
        throw new Error("Title and description are required.");
      }

      const resolvedLocation = await resolveLocation();

      const response = await createComplaint({
        title: title.trim(),
        description: description.trim(),
        location: resolvedLocation.name,
        lat: resolvedLocation.lat,
        lng: resolvedLocation.lng,
        submitted_by: "Lakshay",
      });

      const complaint = response.data;

      setAnalysis({
        category: complaint.category,
        department: complaint.department,
        urgency: complaint.urgency,
        priority_score: complaint.priority_score,
        ai_summary: complaint.ai_summary,
        region: complaint.region,
        locality: complaint.locality,
        duplicate_of: complaint.duplicate_of,
        similarity_score: complaint.similarity_score,
      });

      addComplaint(complaint);
      setMessage("Complaint submitted successfully.");

      setTitle("");
      setDescription("");
      resetLocation();
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          error.message ||
          "Failed to submit complaint."
      );
    } finally {
      setIsAnalyzing(false);
      setIsSubmitting(false);
    }
  };

  const hasErrorMessage =
    message.toLowerCase().includes("failed") ||
    message.toLowerCase().includes("required") ||
    message.toLowerCase().includes("invalid");

  return (
    <div className="complaint-form-layout">
      <form className="glass-panel reveal-in" onSubmit={handleSubmit}>
        <div className="form-header">
          <span className="section-kicker">Complaint details</span>
          <h2>Register a civic grievance</h2>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="complaint-title">
            Complaint title
          </label>
          <input
            id="complaint-title"
            className="field-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Example: Streetlight outage near Rohini sector road"
            required
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="complaint-description">
            Description
          </label>
          <textarea
            id="complaint-description"
            className="field-input"
            rows={6}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the issue with enough context for triage, routing, and duplicate detection."
            required
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="complaint-location">
            Location
          </label>
          <input
            id="complaint-location"
            className="field-input"
            value={locationInput}
            onChange={(event) => updateLocationInput(event.target.value)}
            onBlur={() => {
              if (locationInput.trim()) {
                void resolveLocation().catch(() => {});
              }
            }}
            placeholder="Locality, ward, road, colony, or public service area"
            required
          />
          {locationError ? (
            <p className="form-message form-message--error">{locationError}</p>
          ) : null}
        </div>

        <div className="form-actions">
          <MagneticButton
            variant="primary"
            type="submit"
            magnetic={!isSubmitting}
            disabled={isSubmitting || isResolvingLocation}
          >
            {isSubmitting ? "Submitting..." : "Submit Complaint"}
          </MagneticButton>
        </div>
      </form>

      <div className="analysis-panel glass-panel reveal-in">
        <div className="analysis-panel__header">
          <span className="section-kicker">AI preview</span>
          <h2>Analysis output</h2>
        </div>

        <LocationPickerMap
          selectedLocation={locationState}
          onLocationSelect={selectLocationFromMap}
        />

        {isAnalyzing ? (
          <div className="skeleton-stack">
            <SkeletonBlock className="skeleton-line skeleton-line--long" />
            <SkeletonBlock className="skeleton-line skeleton-line--short" />
            <SkeletonBlock className="skeleton-card" />
            <SkeletonBlock className="skeleton-card" />
          </div>
        ) : analysis ? (
          <div className="analysis-results">
            <div className="analysis-results__grid">
              <AnalysisChip label="Category" value={analysis.category} />
              <AnalysisChip label="Department" value={analysis.department} />
              <AnalysisChip label="Urgency" value={analysis.urgency} />
              <AnalysisChip
                label="Priority score"
                value={analysis.priority_score}
              />
              <AnalysisChip label="Region" value={analysis.region} />
              <AnalysisChip label="Locality" value={analysis.locality} />
            </div>

            <p className="analysis-summary">{analysis.ai_summary}</p>

            {analysis.duplicate_of ? (
              <div className="form-message">
                Possible duplicate of complaint #{analysis.duplicate_of}
                {analysis.similarity_score !== null &&
                analysis.similarity_score !== undefined
                  ? ` (score: ${analysis.similarity_score})`
                  : ""}
              </div>
            ) : (
              <div className="form-message">
                No strong duplicate match found.
              </div>
            )}
          </div>
        ) : (
          <p className="empty-state">
            Type a location or click the map to sync the address.
            AI analysis runs automatically when you submit the complaint.
          </p>
        )}

        {message ? (
          <p
            className={`form-message ${
              hasErrorMessage ? "form-message--error" : ""
            }`.trim()}
          >
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default ComplaintForm;