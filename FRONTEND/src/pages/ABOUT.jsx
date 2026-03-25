import { useEffect, useRef } from "react";
import InteractiveCard from "../components/InteractiveCard";
import { createPageAnimations } from "../interactions/animations";

const sections = [
  {
    title: "Who we are",
    body: "We are first-year B.Tech CSE students at DTU building tools that make grievance systems more transparent, accountable, and legible.",
  },
  {
    title: "About the project",
    body: "CivicLens AI transforms raw complaints into structured administrative action through classification, urgency scoring, routing, and analytics.",
  },
  {
    title: "Why it matters",
    body: "Many grievance systems still run on manual review, scattered tracking, and delayed responses. Better routing and prioritization directly improve service quality.",
  },
  {
    title: "Long-term direction",
    body: "The platform starts with campuses and local civic institutions, then scales toward broader governance environments where trust and response time matter.",
  },
];

function About() {
  const pageRef = useRef(null);

  useEffect(() => createPageAnimations(pageRef.current), []);

  return (
    <div ref={pageRef} className="content-page">
      <section className="page-hero reveal-in">
        <span className="section-kicker">About CivicLens AI</span>
        <h1 className="page-title gradient-reveal">
          A student-built grievance intelligence platform with an operator-grade UI.
        </h1>
        <p className="page-copy">
          The project is focused on helping complaints move through systems with
          better structure, higher accountability, and clearer administrative action.
        </p>
      </section>

      <section className="content-section">
        <div className="card-grid stagger-group">
          {sections.map((section) => (
            <InteractiveCard key={section.title} className="feature-card glass-panel">
              <span className="feature-card__pill gradient-border">{section.title}</span>
              <p>{section.body}</p>
            </InteractiveCard>
          ))}
        </div>
      </section>
    </div>
  );
}

export default About;
