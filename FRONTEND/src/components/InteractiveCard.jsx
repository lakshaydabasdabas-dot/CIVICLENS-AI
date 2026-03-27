import { forwardRef, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "../interactions/animations";

const mergeRefs = (refs, value) => {
  refs.forEach((ref) => {
    if (typeof ref === "function") {
      ref(value);
      return;
    }

    if (ref) {
      ref.current = value;
    }
  });
};

const InteractiveCard = forwardRef(function InteractiveCard(
  {
    children,
    className = "",
    to,
    style,
    onPointerMove,
    onPointerLeave,
    ...rest
  },
  forwardedRef
) {
  const localRef = useRef(null);

  useEffect(() => {
    const element = localRef.current;

    if (!element) {
      return undefined;
    }

    const rotateXTo = gsap.quickTo(element, "rotationX", {
      duration: 0.45,
      ease: "power3.out",
    });
    const rotateYTo = gsap.quickTo(element, "rotationY", {
      duration: 0.45,
      ease: "power3.out",
    });
    const xTo = gsap.quickTo(element, "x", {
      duration: 0.45,
      ease: "power3.out",
    });
    const yTo = gsap.quickTo(element, "y", {
      duration: 0.45,
      ease: "power3.out",
    });

    gsap.set(element, {
      transformPerspective: 1400,
      transformStyle: "preserve-3d",
    });

    const handleMove = (event) => {
      const rect = element.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      const normalizedX = localX / rect.width - 0.5;
      const normalizedY = localY / rect.height - 0.5;

      element.style.setProperty("--mouse-x", `${localX}px`);
      element.style.setProperty("--mouse-y", `${localY}px`);
      element.style.setProperty("--hover-strength", "1");
      rotateXTo(normalizedY * -10);
      rotateYTo(normalizedX * 12);
      xTo(normalizedX * 6);
      yTo(normalizedY * 6);
    };

    const handleLeave = () => {
      element.style.setProperty("--hover-strength", "0");
      rotateXTo(0);
      rotateYTo(0);
      xTo(0);
      yTo(0);
    };

    element.addEventListener("pointermove", handleMove);
    element.addEventListener("pointerleave", handleLeave);

    return () => {
      element.removeEventListener("pointermove", handleMove);
      element.removeEventListener("pointerleave", handleLeave);
      gsap.set(element, { clearProps: "x,y,rotationX,rotationY,transformPerspective,transformStyle" });
    };
  }, []);

  const sharedProps = {
    ...rest,
    ref: (value) => mergeRefs([localRef, forwardedRef], value),
    className: `interactive-card ${className}`.trim(),
    style,
    onPointerMove: (event) => onPointerMove?.(event),
    onPointerLeave: (event) => onPointerLeave?.(event),
    "data-interactive": "true",
    "data-cursor-scale": "1.3",
  };

  if (to) {
    return <Link to={to} {...sharedProps}>{children}</Link>;
  }

  return <article {...sharedProps}>{children}</article>;
});

export default InteractiveCard;
