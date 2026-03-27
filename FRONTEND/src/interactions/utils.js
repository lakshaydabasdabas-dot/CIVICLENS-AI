export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const lerp = (start, end, amount) => start + (end - start) * amount;

export const damp = (current, target, smoothing, deltaTime) =>
  lerp(current, target, 1 - Math.exp(-smoothing * deltaTime * 60));

export const randomRange = (min, max) => min + Math.random() * (max - min);

export const mapRange = (value, inMin, inMax, outMin, outMax) => {
  if (inMax - inMin === 0) {
    return outMin;
  }

  const progress = (value - inMin) / (inMax - inMin);
  return outMin + progress * (outMax - outMin);
};

export const getViewportSize = () => ({
  width: window.innerWidth,
  height: window.innerHeight,
});

export const getCanvasSize = (element) => {
  const rect = element.getBoundingClientRect();
  return {
    width: rect.width || element.clientWidth || 1,
    height: rect.height || element.clientHeight || 1,
  };
};

export const getLocalPointer = (event, rect) => {
  const x = clamp(event.clientX - rect.left, 0, rect.width);
  const y = clamp(event.clientY - rect.top, 0, rect.height);

  return {
    x,
    y,
    nx: rect.width ? x / rect.width : 0.5,
    ny: rect.height ? y / rect.height : 0.5,
  };
};

export const observeSize = (element, callback) => {
  const observer = new ResizeObserver((entries) => {
    const entry = entries[0];

    if (!entry) {
      return;
    }

    callback(entry.contentRect);
  });

  observer.observe(element);
  return () => observer.disconnect();
};

export const supportsFinePointer = () =>
  window.matchMedia("(pointer: fine)").matches;

export const supportsWebGL = () => {
  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true }) ||
      canvas.getContext("experimental-webgl");

    return Boolean(context);
  } catch {
    return false;
  }
};
