import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { clamp, getViewportSize } from "./utils";

gsap.registerPlugin(ScrollTrigger);
gsap.config({ nullTargetWarn: false });
gsap.ticker.lagSmoothing(0);

const INTERACTIVE_SELECTOR = [
  "a",
  "button",
  "[data-interactive='true']",
  ".interactive-card",
  "input",
  "textarea",
  "select",
].join(", ");

const STICKY_HEADER_OFFSET = 104;

export class AnimationController {
  constructor() {
    const { width, height } =
      typeof window === "undefined" ? { width: 1, height: 1 } : getViewportSize();

    this.viewport = {
      width,
      height,
      dpr:
        typeof window === "undefined"
          ? 1
          : Math.min(window.devicePixelRatio || 1, 2),
    };
    this.pointer = {
      x: width * 0.5,
      y: height * 0.5,
      nx: 0.5,
      ny: 0.5,
      velocityX: 0,
      velocityY: 0,
      speed: 0,
      down: false,
      active: false,
    };
    this.cursor = {
      scale: 1,
      opacity: 0,
      ringScale: 1,
      pressed: 0,
    };
    this.subscribers = new Set();
    this.pointerSubscribers = new Set();
    this.lastTime = 0;
    this.mounted = false;

    this.tick = this.tick.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handlePointerLeave = this.handlePointerLeave.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handlePointerOver = this.handlePointerOver.bind(this);
    this.handlePointerOut = this.handlePointerOut.bind(this);
  }

  mount() {
    if (this.mounted || typeof window === "undefined") {
      return;
    }

    this.mounted = true;

    window.addEventListener("pointermove", this.handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", this.handlePointerDown, { passive: true });
    window.addEventListener("pointerup", this.handlePointerUp, { passive: true });
    window.addEventListener("pointerleave", this.handlePointerLeave, { passive: true });
    window.addEventListener("blur", this.handlePointerLeave, { passive: true });
    window.addEventListener("resize", this.handleResize, { passive: true });
    document.addEventListener("pointerover", this.handlePointerOver, true);
    document.addEventListener("pointerout", this.handlePointerOut, true);

    gsap.ticker.add(this.tick);
  }

  destroy() {
    if (!this.mounted || typeof window === "undefined") {
      return;
    }

    this.mounted = false;
    window.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerdown", this.handlePointerDown);
    window.removeEventListener("pointerup", this.handlePointerUp);
    window.removeEventListener("pointerleave", this.handlePointerLeave);
    window.removeEventListener("blur", this.handlePointerLeave);
    window.removeEventListener("resize", this.handleResize);
    document.removeEventListener("pointerover", this.handlePointerOver, true);
    document.removeEventListener("pointerout", this.handlePointerOut, true);
    gsap.ticker.remove(this.tick);
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  onPointerEvent(callback) {
    this.pointerSubscribers.add(callback);
    return () => this.pointerSubscribers.delete(callback);
  }

  setCursorState(partialState) {
    this.cursor = {
      ...this.cursor,
      ...partialState,
    };
  }

  requestScrollRefresh() {
    ScrollTrigger.refresh();
  }

  handlePointerMove(event) {
    const { width, height } = this.viewport;
    const nextX = event.clientX;
    const nextY = event.clientY;

    this.pointer.velocityX = nextX - this.pointer.x;
    this.pointer.velocityY = nextY - this.pointer.y;
    this.pointer.x = nextX;
    this.pointer.y = nextY;
    this.pointer.nx = width ? nextX / width : 0.5;
    this.pointer.ny = height ? nextY / height : 0.5;
    this.pointer.active = true;
    this.cursor.opacity = 1;

    document.documentElement.classList.add("has-custom-pointer");
    this.emitPointerEvent("move", event);
  }

  handlePointerDown(event) {
    this.pointer.down = true;
    this.cursor.pressed = 1;
    this.emitPointerEvent("down", event);
  }

  handlePointerUp(event) {
    this.pointer.down = false;
    this.emitPointerEvent("up", event);
  }

  handlePointerLeave() {
    this.pointer.down = false;
    this.pointer.active = false;
    this.cursor.opacity = 0;
    document.body.classList.remove("cursor-hovering");
    this.emitPointerEvent("leave");
  }

  handleResize() {
    const { width, height } = getViewportSize();
    this.viewport.width = width;
    this.viewport.height = height;
    this.viewport.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.pointer.nx = width ? this.pointer.x / width : 0.5;
    this.pointer.ny = height ? this.pointer.y / height : 0.5;
    this.requestScrollRefresh();
  }

  handlePointerOver(event) {
    if (!(event.target instanceof Element)) {
      return;
    }

    const interactiveTarget = event.target.closest(INTERACTIVE_SELECTOR);

    if (!interactiveTarget) {
      return;
    }

    const scale = Number(interactiveTarget.getAttribute("data-cursor-scale") || 1.4);

    this.setCursorState({
      scale,
      ringScale: scale,
      opacity: 1,
    });
    document.body.classList.add("cursor-hovering");
  }

  handlePointerOut(event) {
    if (!(event.target instanceof Element)) {
      return;
    }

    const interactiveTarget = event.target.closest(INTERACTIVE_SELECTOR);

    if (!interactiveTarget) {
      return;
    }

    const relatedTarget =
      event.relatedTarget instanceof Element
        ? event.relatedTarget.closest(INTERACTIVE_SELECTOR)
        : null;

    if (relatedTarget) {
      return;
    }

    this.setCursorState({
      scale: 1,
      ringScale: 1,
    });
    document.body.classList.remove("cursor-hovering");
  }

  emitPointerEvent(type, event) {
    this.pointerSubscribers.forEach((callback) => callback(type, this.pointer, event));
  }

  tick() {
    const now = performance.now();
    const deltaTime = this.lastTime
      ? Math.min((now - this.lastTime) / 1000, 1 / 20)
      : 1 / 60;

    this.lastTime = now;
    this.pointer.speed = Math.hypot(this.pointer.velocityX, this.pointer.velocityY);
    this.cursor.pressed = clamp(
      this.cursor.pressed + (this.pointer.down ? 0.18 : -0.18),
      0,
      1
    );
    this.cursor.opacity = clamp(
      this.cursor.opacity + (this.pointer.active ? 0.16 : -0.18),
      0,
      1
    );

    document.documentElement.style.setProperty("--pointer-x", `${this.pointer.x}px`);
    document.documentElement.style.setProperty("--pointer-y", `${this.pointer.y}px`);
    document.documentElement.style.setProperty("--pointer-nx", `${this.pointer.nx}`);
    document.documentElement.style.setProperty("--pointer-ny", `${this.pointer.ny}`);

    this.subscribers.forEach((callback) =>
      callback({
        controller: this,
        deltaTime,
        time: now / 1000,
      })
    );
  }
}

export const createPageAnimations = (root) => {
  if (!root) {
    return () => {};
  }

  const context = gsap.context(() => {
    gsap.utils.toArray(".reveal-in").forEach((element) => {
      gsap.fromTo(
        element,
        { y: 48, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 82%",
            once: true,
          },
        }
      );
    });

    gsap.utils.toArray(".stagger-group").forEach((group) => {
      const children = Array.from(group.children);

      if (!children.length) {
        return;
      }

      gsap.fromTo(
        children,
        { y: 32, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: {
            trigger: group,
            start: "top 82%",
            once: true,
          },
        }
      );
    });

    gsap.utils.toArray(".gradient-reveal").forEach((element) => {
      gsap.fromTo(
        element,
        { "--reveal-progress": 0 },
        {
          "--reveal-progress": 1,
          duration: 1.25,
          ease: "power2.out",
          scrollTrigger: {
            trigger: element,
            start: "top 88%",
            once: true,
          },
        }
      );
    });

    gsap.utils.toArray(".parallax-layer").forEach((element) => {
      const depth = Number(element.dataset.depth || 0.2);

      gsap.to(element, {
        yPercent: depth * -18,
        ease: "none",
        scrollTrigger: {
          trigger: element.closest(".parallax-scene") || element,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    });

    gsap.utils.toArray(".marquee-track").forEach((track) => {
      const direction = Number(track.dataset.direction || 1);

      gsap.to(track, {
        xPercent: direction > 0 ? -50 : 0,
        repeat: -1,
        ease: "none",
        duration: 30,
      });
    });

    gsap.utils.toArray(".story-pin").forEach((container) => {
      if (container instanceof HTMLElement && container.dataset.storySync === "react") {
        return;
      }

      if (window.innerWidth < 900) {
        return;
      }

      const steps = Array.from(container.querySelectorAll(".story-step"));
      const panels = Array.from(container.querySelectorAll(".story-visual-panel"));
      const progress = container.querySelector(".story-progress-fill");

      if (!steps.length || !panels.length) {
        return;
      }

      gsap.set(steps, { autoAlpha: 0.25, y: 48 });
      gsap.set(panels, { autoAlpha: 0.08, scale: 0.95 });
      gsap.set(steps[0], { autoAlpha: 1, y: 0 });
      gsap.set(panels[0], { autoAlpha: 1, scale: 1 });

      const timeline = gsap.timeline({
        defaults: { ease: "power2.inOut", duration: 0.6 },
        scrollTrigger: {
          trigger: container,
          start: `top top+=${STICKY_HEADER_OFFSET}`,
          end: `+=${steps.length * 420}`,
          scrub: 0.8,
          pin: true,
        },
      });

      steps.forEach((step, index) => {
        const previousStep = steps[index - 1];
        const panel = panels[index];
        const previousPanel = panels[index - 1];

        timeline.to(
          step,
          {
            autoAlpha: 1,
            y: 0,
          },
          index
        );

        timeline.to(
          panel,
          {
            autoAlpha: 1,
            scale: 1,
          },
          index
        );

        if (previousStep) {
          timeline.to(
            previousStep,
            {
              autoAlpha: 0.18,
              y: -24,
            },
            index
          );
        }

        if (previousPanel) {
          timeline.to(
            previousPanel,
            {
              autoAlpha: 0.05,
              scale: 0.9,
            },
            index
          );
        }

        if (progress) {
          timeline.to(
            progress,
            {
              scaleY: (index + 1) / steps.length,
            },
            index
          );
        }
      });
    });
  }, root);

  return () => context.revert();
};

export { ScrollTrigger, gsap };
