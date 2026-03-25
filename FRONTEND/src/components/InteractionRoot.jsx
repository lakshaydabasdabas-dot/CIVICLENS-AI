import { useEffect, useRef, useState } from "react";
import { AnimationController } from "../interactions/animations";
import { CometTrail } from "../interactions/cometTrail";
import { CursorSystem } from "../interactions/cursor";
import { InteractionContext } from "../interactions/context";

function InteractionRoot({ children }) {
  const [controller] = useState(() => new AnimationController());
  const cometCanvasRef = useRef(null);
  const innerCursorRef = useRef(null);
  const outerCursorRef = useRef(null);
  const spotlightRef = useRef(null);

  useEffect(() => {
    controller.mount();

    const cursorSystem = new CursorSystem(controller, {
      inner: innerCursorRef.current,
      outer: outerCursorRef.current,
      spotlight: spotlightRef.current,
    });
    const cometTrail = new CometTrail(controller, cometCanvasRef.current);
    const cursorCleanup = cursorSystem.mount();
    const cometCleanup = cometTrail.mount();

    return () => {
      cursorCleanup?.();
      cometCleanup?.();
      controller.destroy();
    };
  }, [controller]);

  return (
    <InteractionContext.Provider value={controller}>
      <div className="noise-overlay" aria-hidden="true" />
      <canvas ref={cometCanvasRef} className="comet-trail-canvas" aria-hidden="true" />
      <div ref={spotlightRef} className="cursor-spotlight" aria-hidden="true" />
      <div ref={outerCursorRef} className="cursor-outer" aria-hidden="true" />
      <div ref={innerCursorRef} className="cursor-inner" aria-hidden="true" />
      {children}
    </InteractionContext.Provider>
  );
}

export default InteractionRoot;
