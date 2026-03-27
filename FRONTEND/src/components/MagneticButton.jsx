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

const MagneticButton = forwardRef(function MagneticButton(
  {
    children,
    className = "",
    variant = "primary",
    to,
    href,
    type = "button",
    disabled = false,
    magnetic = true,
    onClick,
    onPointerMove,
    onPointerLeave,
    style,
    ...rest
  },
  forwardedRef
) {
  const localRef = useRef(null);

  useEffect(() => {
    const element = localRef.current;

    if (!element || !magnetic || disabled) {
      return undefined;
    }

    const xTo = gsap.quickTo(element, "x", {
      duration: 0.4,
      ease: "power3.out",
    });
    const yTo = gsap.quickTo(element, "y", {
      duration: 0.4,
      ease: "power3.out",
    });

    const handleMove = (event) => {
      const rect = element.getBoundingClientRect();
      const offsetX = ((event.clientX - rect.left) / rect.width - 0.5) * 22;
      const offsetY = ((event.clientY - rect.top) / rect.height - 0.5) * 18;

      xTo(offsetX);
      yTo(offsetY);
    };

    const handleLeave = () => {
      xTo(0);
      yTo(0);
    };

    element.addEventListener("pointermove", handleMove);
    element.addEventListener("pointerleave", handleLeave);

    return () => {
      element.removeEventListener("pointermove", handleMove);
      element.removeEventListener("pointerleave", handleLeave);
      gsap.set(element, { clearProps: "x,y" });
    };
  }, [disabled, magnetic]);

  const createRipple = (event) => {
    const element = localRef.current;

    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size = Math.max(rect.width, rect.height) * 1.25;

    ripple.className = "button-ripple";
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;

    element.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  };

  const sharedProps = {
    ...rest,
    ref: (value) => mergeRefs([localRef, forwardedRef], value),
    className: `magnetic-button magnetic-button--${variant} ${className}`.trim(),
    onClick: (event) => {
      if (disabled) {
        event.preventDefault();
        return;
      }

      createRipple(event);
      onClick?.(event);
    },
    onPointerMove: (event) => onPointerMove?.(event),
    onPointerLeave: (event) => onPointerLeave?.(event),
    style,
    "data-interactive": "true",
    "data-cursor-scale": "1.65",
    "aria-disabled": disabled || undefined,
  };

  if (to) {
    return (
      <Link to={to} {...sharedProps}>
        <span className="magnetic-button__label">{children}</span>
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} {...sharedProps}>
        <span className="magnetic-button__label">{children}</span>
      </a>
    );
  }

  return (
    <button type={type} disabled={disabled} {...sharedProps}>
      <span className="magnetic-button__label">{children}</span>
    </button>
  );
});

export default MagneticButton;
