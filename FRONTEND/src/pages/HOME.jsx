import { useEffect, useRef, useState } from "react";
import Hero from "../components/Hero";
import InteractiveCard from "../components/InteractiveCard";
import MagneticButton from "../components/MagneticButton";
import { ScrollTrigger, createPageAnimations, gsap } from "../interactions/animations";

const missionCards = [
  {
    title: "Working",
    body: "Users submit complaints, the system classifies them, sets urgency, routes them, and surfaces them in the dashboard.",
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
    body: "Shows complaint volume, backlog, urgency, and routing pressure in one view.",
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

const STORY_HEADER_OFFSET = 104;
const STORY_DESKTOP_BREAKPOINT = 900;

function Home() {
  const pageRef = useRef(null);
  const storyPinRef = useRef(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [isDesktopStory, setIsDesktopStory] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= STORY_DESKTOP_BREAKPOINT
  );
  const activeStoryStep = storySteps[activeStoryIndex] || storySteps[0];

  useEffect(() => createPageAnimations(pageRef.current), []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleResize = () => {
      setIsDesktopStory(window.innerWidth >= STORY_DESKTOP_BREAKPOINT);
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const container = storyPinRef.current;

    if (!container || !isDesktopStory) {
      return undefined;
    }

    const progress = container.querySelector(".story-progress-fill");
    const syncStoryState = (storyProgress) => {
      const nextIndex = Math.min(
        storySteps.length - 1,
        Math.floor(storyProgress * storySteps.length)
      );

      setActiveStoryIndex((currentIndex) =>
        currentIndex === nextIndex ? currentIndex : nextIndex
      );

      if (progress) {
        gsap.set(progress, {
          scaleY: Math.max(0.15, storyProgress),
        });
      }
    };

    const trigger = ScrollTrigger.create({
      trigger: container,
      start: `top top+=${STORY_HEADER_OFFSET}`,
      end: `+=${storySteps.length * 420}`,
      scrub: 0.8,
      pin: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        syncStoryState(self.progress);
      },
      onRefresh: (self) => {
        syncStoryState(self.progress);
      },
    });

    return () => {
      trigger.kill();
    };
  }, [isDesktopStory]);

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
            CivicLens AI helps universities and civic teams handle complaints with
            clearer routing, better prioritization, and faster follow-through.
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
            Built to support complaint operations from intake to action.
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
          <span className="section-kicker">Where it fits</span>
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
        <div ref={storyPinRef} className="story-pin" data-story-sync="react">
          <div className="story-visual glass-panel">
            <span className="section-kicker">Complaint journey</span>
            <div className="story-progress">
              <div className="story-progress-fill" />
            </div>
            <div className={`story-visual-stack${isDesktopStory ? " story-visual-stack--single" : ""}`}>
              {isDesktopStory ? (
                <div key={activeStoryStep.label} className="story-visual-panel story-visual-panel--active">
                  <span className="story-visual-label">{activeStoryStep.label}</span>
                  <strong className="story-visual-metric">{activeStoryStep.metric}</strong>
                  <p>{activeStoryStep.title}</p>
                </div>
              ) : (
                storySteps.map((step) => (
                  <div key={step.label} className="story-visual-panel story-visual-panel--active">
                    <span className="story-visual-label">{step.label}</span>
                    <strong className="story-visual-metric">{step.metric}</strong>
                    <p>{step.title}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="story-copy">
            <div className="section-header reveal-in">
              <span className="section-kicker">Workflow story</span>
              <h2 className="section-title gradient-reveal">
                Scroll through the complaint lifecycle from intake to routing.
              </h2>
            </div>

            <div className={`story-step-list${isDesktopStory ? " story-step-list--single" : ""}`}>
              {isDesktopStory ? (
                <article key={activeStoryStep.label} className="story-step story-step--active glass-panel">
                  <span className="story-step__label">{activeStoryStep.label}</span>
                  <h3>{activeStoryStep.title}</h3>
                  <p>{activeStoryStep.body}</p>
                </article>
              ) : (
                storySteps.map((step) => (
                  <article key={step.label} className="story-step glass-panel">
                    <span className="story-step__label">{step.label}</span>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="content-section parallax-scene">
        <div className="parallax-shape parallax-layer" data-depth="0.18" />
        <div className="parallax-shape parallax-shape--two parallax-layer" data-depth="0.28" />
        <div className="parallax-content">
          <div className="section-header reveal-in">
            <span className="section-kicker">Designed for clarity</span>
            <h2 className="section-title gradient-reveal">
              Subtle motion keeps the interface polished without hurting readability.
            </h2>
            <p className="section-copy">
              Glass panels, hover feedback, and motion cues guide attention without
              pulling focus away from the content.
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
              Start with the complaint form or open the dashboard.
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
