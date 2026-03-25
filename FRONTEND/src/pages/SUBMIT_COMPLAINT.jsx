import { useEffect, useRef } from "react";
import ComplaintForm from "../components/COMPLAINT_FORM";
import { createPageAnimations } from "../interactions/animations";

function SubmitComplaint() {
  const pageRef = useRef(null);

  useEffect(() => createPageAnimations(pageRef.current), []);

  return (
    <div ref={pageRef} className="content-page">
      <section className="page-hero reveal-in">
        <span className="section-kicker">Complaint intake</span>
        <h1 className="page-title gradient-reveal">
          Submit grievance details and let the AI triage layer do the first pass.
        </h1>
        <p className="page-copy">
          This flow preserves the core backend behavior while upgrading the UI with
          magnetic buttons, glass panels, animated borders, and loading skeletons.
        </p>
      </section>

      <ComplaintForm />
    </div>
  );
}

export default SubmitComplaint;
