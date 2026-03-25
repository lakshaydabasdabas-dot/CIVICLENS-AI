import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import MagneticButton from "./MagneticButton";
import InteractiveCard from "./InteractiveCard";
import { useInteractionController } from "../interactions/context";
import { RippleCanvas } from "../interactions/rippleCanvas";
import { RippleWebGL } from "../interactions/rippleWebGL";
import { getCanvasSize, getLocalPointer, observeSize, supportsWebGL } from "../interactions/utils";

const heroSignals = [
  { label: "Routing confidence", value: "97.4%" },
  { label: "Priority inference", value: "3.2s" },
  { label: "Live complaint load", value: "1,248" },
];

const heroHighlights = [
  "AI triage that converts raw narrative into administrative action.",
  "Urgency detection and routing tuned for civic operations.",
  "Operator-ready analytics instead of scattered grievance records.",
];

function Hero() {
  const controller = useInteractionController();
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [rendererMode, setRendererMode] = useState("WebGL");

  useEffect(() => {
    if (!controller || !sectionRef.current || !canvasRef.current) {
      return undefined;
    }

    let engine = null;
    let unsubscribeTick = null;
    let stopObserving = null;
    let destroyed = false;

    const destroyEngine = () => {
      unsubscribeTick?.();
      unsubscribeTick = null;
      stopObserving?.();
      stopObserving = null;
      engine?.destroy();
      engine = null;
      engineRef.current = null;
    };

    const bootEngine = (fallbackToCanvas = false) => {
      destroyEngine();

      if (destroyed) {
        return;
      }

      try {
        if (!fallbackToCanvas && supportsWebGL()) {
          engine = new RippleWebGL(canvasRef.current, {
            onContextLost: () => bootEngine(true),
          });
          setRendererMode("WebGL");
        } else {
          engine = new RippleCanvas(canvasRef.current);
          setRendererMode("Canvas");
        }
      } catch {
        engine = new RippleCanvas(canvasRef.current);
        setRendererMode("Canvas");
      }

      engineRef.current = engine;

      const resize = (size = getCanvasSize(sectionRef.current)) => {
        engine.resize(size.width, size.height, controller.viewport.dpr);
      };

      resize();
      stopObserving = observeSize(sectionRef.current, resize);
      unsubscribeTick = controller.subscribe((state) => engine?.update(state));
    };

    bootEngine();

    return () => {
      destroyed = true;
      destroyEngine();
    };
  }, [controller]);

  const updatePointer = (event, active = true) => {
    if (!sectionRef.current || !engineRef.current) {
      return null;
    }

    const rect = sectionRef.current.getBoundingClientRect();
    const pointer = getLocalPointer(event, rect);
    engineRef.current.setPointer(pointer.nx, pointer.ny, active);
    return pointer;
  };

  const handlePointerMove = (event) => {
    updatePointer(event, true);
  };

  const handlePointerLeave = (event) => {
    updatePointer(event, false);
  };

  const handlePointerDown = (event) => {
    const pointer = updatePointer(event, true);

    if (!pointer || !engineRef.current) {
      return;
    }

    engineRef.current.injectRipple(pointer.nx, pointer.ny, 3.8, performance.now() / 1000);
  };

  return (
    <section
      ref={sectionRef}
      className="hero-section reveal-in"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
    >
      <div className="hero-backdrop">
        <canvas ref={canvasRef} className="hero-ripple-canvas" aria-hidden="true" />
        <div className="hero-gradient-mesh">
          <div className="hero-orb hero-orb--one parallax-layer" data-depth="0.24" />
          <div className="hero-orb hero-orb--two parallax-layer" data-depth="0.32" />
          <div className="hero-orb hero-orb--three parallax-layer" data-depth="0.16" />
        </div>
      </div>

      <div className="hero-shell">
        <div className="hero-copy stagger-group">
          <span className="hero-badge gradient-border">
            Civic grievance intelligence
          </span>
          <h1 className="hero-title">
            <span className="gradient-reveal">A premium operating layer</span>
            <span className="gradient-reveal">for complaint resolution</span>
          </h1>
          <p className="hero-subtitle">
            CivicLens AI turns unstructured complaints into high-confidence routing,
            urgency scoring, and decision-ready analytics for universities, civic
            bodies, and public systems.
          </p>

          <div className="hero-actions">
            <MagneticButton to="/submit" variant="primary">
              Submit Complaint
            </MagneticButton>
            <MagneticButton to="/dashboard" variant="secondary">
              Open Dashboard
            </MagneticButton>
            <Link
              to="/about"
              className="text-link"
              data-interactive="true"
              data-cursor-scale="1.25"
            >
              Explore the project
            </Link>
          </div>

          <div className="hero-footnote">
            <span className="status-dot" />
            {rendererMode} ripple engine active with hover shimmer, injected click waves,
            and autonomous surface pulses.
          </div>
        </div>

        <div className="hero-panel-stack">
          <InteractiveCard className="hero-command-panel glass-panel">
            <div className="hero-panel__topline">
              <span className="panel-label">Operational lens</span>
              <span className="panel-mode">{rendererMode}</span>
            </div>

            <div className="hero-command-grid">
              {heroSignals.map((signal) => (
                <div key={signal.label} className="hero-signal-card">
                  <span className="hero-signal-label">{signal.label}</span>
                  <strong className="hero-signal-value">{signal.value}</strong>
                </div>
              ))}
            </div>

            <div className="hero-pipeline">
              {heroHighlights.map((highlight) => (
                <div key={highlight} className="hero-pipeline-row">
                  <span className="hero-pipeline-dot" />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
          </InteractiveCard>

          <InteractiveCard className="hero-glass-summary glass-panel">
            <div className="hero-summary-header">
              <span className="panel-label">Signal story</span>
              <span className="hero-summary-value">03</span>
            </div>
            <p className="hero-summary-text">
              Complaints move from language to action through classification,
              urgency detection, department routing, and dashboard visibility.
            </p>
          </InteractiveCard>
        </div>
      </div>
    </section>
  );
}

export default Hero;
