import { useEffect, useRef } from "react";
import Hero from "../components/Hero";
import InteractiveCard from "../components/InteractiveCard";
import MagneticButton from "../components/MagneticButton";
import { createPageAnimations } from "../interactions/animations";

const missionCards = [
  {
    title: "Working",
    body: "Users submit complaints, the system analyzes narrative text, predicts category and urgency, routes the issue, and surfaces it inside an operational dashboard.",
  },
  {
    title: "Vision",
    body: "Build a responsive grievance ecosystem for India that starts on campuses and local civic institutions, then scales into wider governance systems.",
  },
  {
    title: "Mission",
    body: "Reduce handling delays, improve routing accuracy, and give administrators a live understanding of complaint risk and workload.",
  },
];

const featureCards = [
  {
    title: "Complaint classification",
    body: "Transforms raw text into an actionable category with contextual confidence.",
  },
  {
    title: "Urgency scoring",
    body: "Highlights severe or time-sensitive complaints before they disappear into a queue.",
  },
  {
    title: "Department routing",
    body: "Maps complaints to the right administrative owner without manual triage overhead.",
  },
  {
    title: "Duplicate detection",
    body: "Flags repeated reports so teams can de-noise demand and spot systemic failures.",
  },
  {
    title: "AI summaries",
    body: "Condenses long narratives into compact operator-ready briefings for faster resolution.",
  },
  {
    title: "Dashboard analytics",
    body: "Shows case volume, backlog shape, urgency mix, and routing pressure in one surface.",
  },
];

const marqueeItems = [
  "DTU",
  "Campus Admin",
  "Municipal Services",
  "Public Utilities",
  "Citizen Portals",
  "University Cells",
  "District Offices",
  "Grievance Command",
];

const storySteps = [
  {
    label: "01",
    title: "Ingest signal, not noise",
    body: "Narrative complaints are normalized, summarized, and clustered into a language the administration can act on immediately.",
    metric: "92% triage clarity",
  },
  {
    label: "02",
    title: "Rank what matters first",
    body: "Urgency models pull safety, escalation, and service-critical issues to the front with visible reasoning.",
    metric: "3x faster prioritization",
  },
  {
    label: "03",
    title: "Route with accountability",
    body: "Every complaint gets a likely owner, a queue destination, and a dashboard presence that can be audited over time.",
    metric: "Operator-ready routing",
  },
];

function Home() {
  const pageRef = useRef(null);

  useEffect(() => createPageAnimations(pageRef.current), []);

  return (
    <div ref={pageRef} className="home-page">
      <Hero />

      <section className="content-section">
        <div className="section-header reveal-in">
          <span className="section-kicker">Why it matters</span>
          <h2 className="section-title gradient-reveal">
            Complaints should become visible operational signals.
          </h2>
          <p className="section-copy">
            CivicLens AI was built by first-year DTU students to strengthen grievance
            systems across universities, local civic bodies, and broader governance
            institutions where delays and poor routing still dominate outcomes.
          </p>
        </div>

        <div className="card-grid stagger-group">
          {missionCards.map((card) => (
            <InteractiveCard key={card.title} className="feature-card glass-panel">
              <span className="feature-card__index">{card.title}</span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </InteractiveCard>
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="section-header reveal-in">
          <span className="section-kicker">Capability stack</span>
          <h2 className="section-title gradient-reveal">
            Built as an interaction-first control layer for complaint operations.
          </h2>
        </div>

        <div className="card-grid card-grid--wide stagger-group">
          {featureCards.map((card) => (
            <InteractiveCard key={card.title} className="feature-card feature-card--wide glass-panel">
              <div className="feature-card__pill gradient-border">{card.title}</div>
              <p>{card.body}</p>
            </InteractiveCard>
          ))}
        </div>
      </section>

      <section className="marquee-section reveal-in">
        <div className="marquee-shell glass-panel">
          <span className="section-kicker">Deployment surfaces</span>
          <div className="marquee">
            <div className="marquee-track" data-direction="1">
              {[...marqueeItems, ...marqueeItems].map((item, index) => (
                <span key={`${item}-${index}`} className="marquee-chip">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="story-section">
        <div className="story-pin">
          <div className="story-visual glass-panel">
            <span className="section-kicker">Sticky scroll narrative</span>
            <div className="story-progress">
              <div className="story-progress-fill" />
            </div>
            <div className="story-visual-stack">
              {storySteps.map((step) => (
                <div key={step.label} className="story-visual-panel">
                  <span className="story-visual-label">{step.label}</span>
                  <strong className="story-visual-metric">{step.metric}</strong>
                  <p>{step.title}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="story-copy">
            <div className="section-header reveal-in">
              <span className="section-kicker">Workflow story</span>
              <h2 className="section-title gradient-reveal">
                Scroll through the complaint lifecycle from intake to routing.
              </h2>
            </div>

            <div className="story-step-list">
              {storySteps.map((step) => (
                <article key={step.label} className="story-step glass-panel">
                  <span className="story-step__label">{step.label}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="content-section parallax-scene">
        <div className="parallax-shape parallax-layer" data-depth="0.18" />
        <div className="parallax-shape parallax-shape--two parallax-layer" data-depth="0.28" />
        <div className="parallax-content">
          <div className="section-header reveal-in">
            <span className="section-kicker">Depth and motion</span>
            <h2 className="section-title gradient-reveal">
              Multi-layer parallax surfaces keep the product feeling alive without
              sacrificing clarity.
            </h2>
            <p className="section-copy">
              The landing flow combines glass panels, animated borders, cursor glow,
              and scroll-tuned motion into one performance-aware interaction system.
            </p>
          </div>

          <div className="parallax-grid stagger-group">
            <InteractiveCard className="metric-card glass-panel">
              <span className="metric-card__label">Signal routing</span>
              <strong>Automated department assignment</strong>
            </InteractiveCard>
            <InteractiveCard className="metric-card glass-panel">
              <span className="metric-card__label">User feedback</span>
              <strong>Real-time status visibility</strong>
            </InteractiveCard>
            <InteractiveCard className="metric-card glass-panel">
              <span className="metric-card__label">Admin clarity</span>
              <strong>Analytics for backlog and urgency mix</strong>
            </InteractiveCard>
          </div>
        </div>
      </section>

      <section className="content-section cta-section reveal-in">
        <div className="cta-shell glass-panel">
          <div>
            <span className="section-kicker">Take it further</span>
            <h2 className="section-title gradient-reveal">
              Start with the live intake flow or inspect the dashboard layer.
            </h2>
          </div>

          <div className="cta-actions">
            <MagneticButton to="/submit" variant="primary">
              Submit a complaint
            </MagneticButton>
            <MagneticButton to="/dashboard" variant="secondary">
              Open dashboard
            </MagneticButton>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
