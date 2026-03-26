import { useState } from "react";
import MagneticButton from "./MagneticButton";
import LocationPickerMap from "./LocationPickerMap.jsx";
import SkeletonBlock from "./SkeletonBlock";
import { createComplaint } from "../services/API.js";
import { useComplaints } from "../context/useComplaints.js";
import { useComplaintLocation } from "../hooks/useComplaintLocation.js";

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
        submitted_by: "Lakshay",
      });

      setAnalysis({
        category: response.data.category,
        department: response.data.department,
        urgency: response.data.urgency,
        ai_summary: response.data.ai_summary,
      });

      addComplaint({
        ...response.data,
        location: resolvedLocation.name,
        lat: resolvedLocation.lat,
        lng: resolvedLocation.lng,
      });

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

  return (
    <div className="form-layout">
      <form className="complaint-form glass-panel reveal-in" onSubmit={handleSubmit}>
        <div className="field-group">
          <label className="field-label" htmlFor="complaint-title">
            Complaint title
          </label>
          <input
            id="complaint-title"
            className="field-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Example: Streetlight outage near hostel block"
            required
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="complaint-description">
            Description
          </label>
          <textarea
            id="complaint-description"
            className="field-input field-input--textarea"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the issue with enough context for triage and routing."
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
            placeholder="Campus, ward, building, or public service area"
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
            <div className="analysis-chip">
              <span>Category</span>
              <strong>{analysis.category}</strong>
            </div>
            <div className="analysis-chip">
              <span>Department</span>
              <strong>{analysis.department}</strong>
            </div>
            <div className="analysis-chip">
              <span>Urgency</span>
              <strong>{analysis.urgency}</strong>
            </div>
            <p className="analysis-summary">{analysis.ai_summary}</p>
          </div>
        ) : (
          <p className="empty-state">
            Type a location or click the map to sync the address. AI analysis runs
            automatically when you submit the complaint.
          </p>
        )}

        {message ? (
          <p
            className={`form-message ${
              message.toLowerCase().includes("failed") || message.toLowerCase().includes("required")
                ? "form-message--error"
                : ""
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
