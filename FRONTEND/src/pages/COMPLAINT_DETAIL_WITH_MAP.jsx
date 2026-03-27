import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MagneticButton from "../components/MagneticButton";
import { useComplaints } from "../context/useComplaints.js";
import { getComplaintById, updateComplaintStatus } from "../services/API.js";
import { getCoordinates } from "../utils/geocode.js";
import SimpleMap from "../components/SimpleMap.jsx";
import SkeletonBlock from "../components/SkeletonBlock";
import "./ComplaintDetailStyles.css";

function ComplaintDetailWithMap() {
  const { id } = useParams();
  const { updateComplaint } = useComplaints();
  const [complaint, setComplaint] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingStatus, setPendingStatus] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);
  const [coordinates, setCoordinates] = useState({ lat: 28.6139, lng: 77.209 });
  const submittedEmail = complaint?.email || complaint?.submitted_by || "Not provided";
  const submittedByValue =
    complaint?.submitted_by && complaint.submitted_by !== complaint.email
      ? complaint.submitted_by
      : submittedEmail;

  useEffect(() => {
    const loadComplaint = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("🔍 Loading complaint ID:", id);
        const response = await getComplaintById(id);
        console.log("🔍 Complaint data received:", response.data);
        
        if (response.data) {
          setComplaint(response.data);
          
          // Try to geocode the location
          if (response.data.location) {
            try {
              console.log("🔍 Geocoding location:", response.data.location);
              const coords = await getCoordinates(response.data.location);
              console.log("🔍 Geocoded coordinates:", coords);
              setCoordinates(coords);
            } catch (geocodeError) {
              console.warn("⚠️ Geocoding failed:", geocodeError);
              // Use fallback coordinates based on complaint ID
              const fallbackLat = 28.6139 + (id % 10) * 0.01;
              const fallbackLng = 77.209 + (id % 10) * 0.01;
              console.log("🔍 Using fallback coordinates:", { lat: fallbackLat, lng: fallbackLng });
              setCoordinates({ lat: fallbackLat, lng: fallbackLng });
            }
          } else {
            console.log("⚠️ No location in complaint data");
          }
        } else {
          setError("No complaint data received");
        }
      } catch (error) {
        console.error("❌ Error loading complaint:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
        console.log("🔍 Loading complete");
      }
    };

    if (id) {
      loadComplaint();
    } else {
      setError("No complaint ID provided");
      setIsLoading(false);
    }
  }, [id]);

  const handleQuickStatusUpdate = async (nextStatus) => {
    setIsSaving(true);
    setPendingStatus(nextStatus);
    setMessage("");

    try {
      const response = await updateComplaintStatus(id, { status: nextStatus });
      setComplaint(response.data);
      updateComplaint(response.data);
      setMessage(
        nextStatus === "in_progress"
          ? "Complaint marked as in progress."
          : "Complaint marked as resolved."
      );
    } catch (updateError) {
      console.error(updateError);
      setMessage("Failed to update status.");
    } finally {
      setIsSaving(false);
      setPendingStatus("");
    }
  };

  if (isLoading) {
    return (
      <div className="complaint-detail-page">
        <div className="page-header">
          <h1>Loading Complaint Details...</h1>
        </div>
        <div className="detail-grid">
          <div className="detail-section glass-panel">
            <div className="skeleton-stack">
              <SkeletonBlock className="skeleton-line skeleton-line--long" />
              <SkeletonBlock className="skeleton-line skeleton-line--medium" />
              <SkeletonBlock className="skeleton-card" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="complaint-detail-page">
        <div className="page-header">
          <h1>Complaint Not Found</h1>
        </div>
        <div className="detail-section glass-panel">
          <p>Error: {error || "Complaint not found"}</p>
          <p>Complaint ID: {id}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="complaint-detail-page">
      <div className="page-header">
        <h1>Complaint #{complaint.id}: {complaint.title}</h1>
        <p className="subtitle">Detailed view with location map</p>
      </div>

      {message ? (
        <p
          className={`form-message ${message.includes("Failed") ? "form-message--error" : ""}`.trim()}
        >
          {message}
        </p>
      ) : null}

      <div className="detail-grid">
        <div className="detail-section glass-panel">
          <h2>Complaint Details</h2>
          <div className="detail-list">
            <div className="detail-item">
              <span className="label">Title:</span>
              <span className="value">{complaint.title}</span>
            </div>
            <div className="detail-item">
              <span className="label">Description:</span>
              <span className="value">{complaint.description}</span>
            </div>
            <div className="detail-item">
              <span className="label">Location:</span>
              <span className="value">{complaint.location || "Not specified"}</span>
            </div>
            <div className="detail-item">
              <span className="label">Category:</span>
              <span className="value">{complaint.category}</span>
            </div>
            <div className="detail-item">
              <span className="label">Urgency:</span>
              <span className="value">{complaint.urgency}</span>
            </div>
            <div className="detail-item">
              <span className="label">Department:</span>
              <span className="value">{complaint.department}</span>
            </div>
            <div className="detail-item">
              <span className="label">Status:</span>
              <span className="value">{complaint.status}</span>
            </div>
            <div className="detail-item">
              <span className="label">AI Summary:</span>
              <span className="value">{complaint.ai_summary}</span>
            </div>
            <div className="detail-item">
              <span className="label">Submitted by (Email):</span>
              <span className="value">{submittedEmail}</span>
            </div>
            <div className="detail-item">
              <span className="label">Submitted By:</span>
              <span className="value">{submittedByValue}</span>
            </div>
            <div className="detail-item">
              <span className="label">Created:</span>
              <span className="value">
                {new Date(complaint.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="map-section glass-panel">
          <h2>Location Map</h2>
          <div className="map-container">
            <SimpleMap 
              center={coordinates}
              zoom={14}
              markerTitle={`Complaint #${complaint.id}: ${complaint.title}`}
            />
          </div>
          <p className="map-note">
            Showing location: <strong>{complaint.location || "Unknown location"}</strong>
            <br />
            <small>Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}</small>
          </p>
          <div className="status-bar">
            <MagneticButton
              variant="secondary"
              onClick={() => handleQuickStatusUpdate("in_progress")}
              disabled={isSaving || complaint.status === "IN_PROGRESS"}
            >
              {isSaving && pendingStatus === "in_progress" ? "Saving..." : "Mark as In Progress"}
            </MagneticButton>
            <MagneticButton
              variant="primary"
              onClick={() => handleQuickStatusUpdate("resolved")}
              disabled={isSaving || complaint.status === "RESOLVED"}
            >
              {isSaving && pendingStatus === "resolved" ? "Saving..." : "Mark as Resolved"}
            </MagneticButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplaintDetailWithMap;
