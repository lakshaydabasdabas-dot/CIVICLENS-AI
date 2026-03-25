import { useState } from "react";
import MagneticButton from "./MagneticButton";
import SkeletonBlock from "./SkeletonBlock";
import { analyzeComplaint, createComplaint } from "../services/API.js";

function ComplaintForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [message, setMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setMessage("");

    try {
      const response = await analyzeComplaint({
        title,
        description,
        location,
      });

      setAnalysis(response.data);
      setMessage("AI analysis completed.");
    } catch (error) {
      console.error(error);
      setMessage("Failed to analyze complaint.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      await createComplaint({
        title,
        description,
        location,
        submitted_by: "Lakshay",
      });

      setMessage("Complaint submitted successfully.");
      setTitle("");
      setDescription("");
      setLocation("");
      setAnalysis(null);
    } catch (error) {
      console.error(error);
      setMessage("Failed to submit complaint.");
    } finally {
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
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Campus, ward, building, or public service area"
          />
        </div>

        <div className="form-actions">
          <MagneticButton
            variant="secondary"
            onClick={handleAnalyze}
            disabled={isAnalyzing || isSubmitting}
          >
            {isAnalyzing ? "Analyzing..." : "AI Analyze"}
          </MagneticButton>

          <MagneticButton
            variant="primary"
            type="submit"
            magnetic={!isSubmitting}
            disabled={isAnalyzing || isSubmitting}
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
            Run AI analysis to preview category, department, urgency, and the
            generated summary before you submit.
          </p>
        )}

        {message ? <p className="form-message">{message}</p> : null}
      </div>
    </div>
  );
}

export default ComplaintForm;
