import { damp, supportsFinePointer } from "./utils";

export class CursorSystem {
  constructor(controller, elements) {
    this.controller = controller;
    this.elements = elements;
    this.outer = {
      x: controller.pointer.x,
      y: controller.pointer.y,
      scale: 1,
    };
    this.finePointer = typeof window !== "undefined" ? supportsFinePointer() : false;
    this.unsubscribe = null;
  }

  mount() {
    if (!this.finePointer) {
      document.documentElement.classList.add("cursor-disabled");
      return () => {};
    }

    document.documentElement.classList.remove("cursor-disabled");
    this.unsubscribe = this.controller.subscribe(this.update.bind(this));

    return () => this.destroy();
  }

  update({ deltaTime }) {
    const { inner, outer, spotlight } = this.elements;
    const { pointer, cursor } = this.controller;

    this.outer.x = damp(this.outer.x, pointer.x, 0.18, deltaTime);
    this.outer.y = damp(this.outer.y, pointer.y, 0.18, deltaTime);
    this.outer.scale = damp(this.outer.scale, cursor.ringScale, 0.18, deltaTime);

    if (inner) {
      inner.style.opacity = `${cursor.opacity}`;
      inner.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%) scale(${
        1 + cursor.pressed * 0.18
      })`;
    }

    if (outer) {
      outer.style.opacity = `${cursor.opacity}`;
      outer.style.transform = `translate3d(${this.outer.x}px, ${this.outer.y}px, 0) translate(-50%, -50%) scale(${
        this.outer.scale + cursor.pressed * 0.12
      })`;
    }

    if (spotlight) {
      spotlight.style.opacity = `${Math.max(cursor.opacity * 0.9, 0)}`;
    }
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
