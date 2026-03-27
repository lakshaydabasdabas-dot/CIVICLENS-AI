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
          Submit complaint details and let automated classification do the first pass.
        </h1>
        <p className="page-copy">
          Add the complaint, confirm the location, and review the suggested category
          before submission.
        </p>
      </section>

      <ComplaintForm />
    </div>
  );
}

export default SubmitComplaint;
