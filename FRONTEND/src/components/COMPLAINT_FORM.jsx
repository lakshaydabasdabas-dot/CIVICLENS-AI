import { useEffect, useState } from "react";
import MagneticButton from "./MagneticButton";
import LocationPickerMap from "./LocationPickerMap.jsx";
import SkeletonBlock from "./SkeletonBlock";
import { createComplaint, sendOTP, verifyOTP } from "../services/API.js";
import { useComplaints } from "../context/useComplaints.js";
import { useComplaintLocation } from "../hooks/useComplaintLocation.js";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function ComplaintForm() {
  const { addComplaint } = useComplaints();
  const {
    locationInput,
    locationState,
    locationError,
    updateLocationInput,
    selectLocationFromMap,
    resolveLocation,
    resetLocation,
  } = useComplaintLocation();
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [description, setDescription] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [message, setMessage] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationMessageIsError, setVerificationMessageIsError] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [isOTPRequested, setIsOTPRequested] = useState(false);
  const [otpCooldownSeconds, setOtpCooldownSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();
  const canSubmitComplaint = isEmailVerified && verifiedEmail === normalizedEmail && !isSubmitting;

  const resetVerificationState = () => {
    setOtp("");
    setIsOTPRequested(false);
    setIsEmailVerified(false);
    setVerifiedEmail("");
    setVerificationMessage("");
    setVerificationMessageIsError(false);
    setOtpCooldownSeconds(0);
  };

  const handleEmailChange = (event) => {
    const nextEmail = event.target.value;
    const nextNormalizedEmail = nextEmail.trim().toLowerCase();
    const emailChanged = nextNormalizedEmail !== normalizedEmail;

    setEmail(nextEmail);

    if (emailChanged) {
      resetVerificationState();
    }
  };

  const handleSendOTP = async () => {
    setVerificationMessage("");
    setVerificationMessageIsError(false);

    try {
      if (!normalizedEmail) {
        throw new Error("Email address is required.");
      }

      if (!isValidEmail(normalizedEmail)) {
        throw new Error("Enter a valid email address.");
      }

      setIsSendingOTP(true);
      const response = await sendOTP({ email: normalizedEmail });
      setIsOTPRequested(true);
      setIsEmailVerified(false);
      setVerifiedEmail("");
      setOtp("");
      setOtpCooldownSeconds(response.data?.cooldown_seconds || 60);
      setVerificationMessage(response.data?.message || "OTP sent to your email.");
    } catch (error) {
      console.error(error);
      setVerificationMessage(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          error.message ||
          "Failed to send OTP."
      );
      setVerificationMessageIsError(true);
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    setVerificationMessage("");
    setVerificationMessageIsError(false);

    try {
      if (!normalizedEmail) {
        throw new Error("Email address is required.");
      }

      if (!otp.trim()) {
        throw new Error("Enter the OTP sent to your email.");
      }

      setIsVerifyingOTP(true);
      const response = await verifyOTP({ email: normalizedEmail, otp: otp.trim() });
      setIsEmailVerified(true);
      setVerifiedEmail(normalizedEmail);
      setVerificationMessage(
        response.data?.message || "Email verified successfully."
      );
      setOtpCooldownSeconds(0);
    } catch (error) {
      console.error(error);
      setVerificationMessage(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          error.message ||
          "Failed to verify OTP."
      );
      setVerificationMessageIsError(true);
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setIsAnalyzing(true);
    setMessage("");

    try {
      if (!title.trim() || !description.trim() || !normalizedEmail) {
        throw new Error("Title, email address, and description are required.");
      }

      if (!isValidEmail(normalizedEmail)) {
        throw new Error("Enter a valid email address.");
      }

      if (!isEmailVerified || verifiedEmail !== normalizedEmail) {
        throw new Error("Verify your email before submitting the complaint.");
      }

      const resolvedLocation = await resolveLocation();
      const structuredLocation = {
        lat: resolvedLocation.lat,
        lng: resolvedLocation.lng,
        address: resolvedLocation.address || resolvedLocation.name,
      };
      const response = await createComplaint({
        title: title.trim(),
        email: normalizedEmail,
        description: description.trim(),
        location: structuredLocation.address,
        submitted_by: normalizedEmail,
      });

      setAnalysis({
        category: response.data.category,
        department: response.data.department,
        urgency: response.data.urgency,
        ai_summary: response.data.ai_summary || response.data.summary,
      });

      addComplaint({
        ...response.data,
        email: response.data.email || normalizedEmail,
        location: structuredLocation.address,
        lat: structuredLocation.lat,
        lng: structuredLocation.lng,
        locationData: structuredLocation,
        ai_summary: response.data.ai_summary || response.data.summary,
        summary: response.data.summary || response.data.ai_summary,
      });

      setMessage("Complaint submitted successfully.");
      setTitle("");
      setEmail("");
      setOtp("");
      setDescription("");
      setIsEmailVerified(false);
      setVerifiedEmail("");
      setIsOTPRequested(false);
      setVerificationMessage("");
      setVerificationMessageIsError(false);
      setOtpCooldownSeconds(0);
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

  useEffect(() => {
    if (otpCooldownSeconds <= 0) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setOtpCooldownSeconds((currentSeconds) => (currentSeconds > 0 ? currentSeconds - 1 : 0));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [otpCooldownSeconds]);

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
          <label className="field-label" htmlFor="complaint-email">
            Email address
          </label>
          <input
            id="complaint-email"
            className="field-input"
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Enter your email for updates"
            autoComplete="email"
            required
          />

          <div className="form-actions">
            <MagneticButton
              type="button"
              variant="secondary"
              magnetic={!isSendingOTP}
              onClick={handleSendOTP}
              disabled={isSendingOTP || otpCooldownSeconds > 0}
            >
              {isSendingOTP
                ? "Sending OTP..."
                : otpCooldownSeconds > 0
                  ? `Send OTP (${otpCooldownSeconds}s)`
                  : "Send OTP"}
            </MagneticButton>
          </div>

          {isOTPRequested || isEmailVerified ? (
            <>
              <label className="field-label" htmlFor="complaint-otp">
                Enter OTP
              </label>
              <input
                id="complaint-otp"
                className="field-input"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="Enter OTP"
                inputMode="numeric"
              />
              <div className="form-actions">
                <MagneticButton
                  type="button"
                  variant="secondary"
                  magnetic={!isVerifyingOTP}
                  onClick={handleVerifyOTP}
                  disabled={isVerifyingOTP || isEmailVerified}
                >
                  {isVerifyingOTP ? "Verifying..." : isEmailVerified ? "Verified" : "Verify OTP"}
                </MagneticButton>
              </div>
            </>
          ) : null}

          {verificationMessage ? (
            <p
              className={`form-message ${verificationMessageIsError ? "form-message--error" : ""}`.trim()}
            >
              {verificationMessage}
            </p>
          ) : null}
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
            disabled={!canSubmitComplaint}
          >
            {isSubmitting ? "Submitting..." : "Submit Complaint"}
          </MagneticButton>
        </div>
      </form>

      <div className="analysis-panel glass-panel reveal-in">
        <div className="analysis-panel__header">
          <span className="section-kicker">Classification preview</span>
          <h2>Suggested output</h2>
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
            Type a location or click the map to sync the address. Classification
            runs automatically when you submit the complaint.
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
