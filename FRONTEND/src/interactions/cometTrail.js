import { clamp, damp, supportsFinePointer } from "./utils";

export class CometTrail {
  constructor(controller, canvas, nodeCount = 26) {
    this.controller = controller;
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.nodeCount = nodeCount;
    this.nodes = Array.from({ length: nodeCount }, () => ({
      x: controller.pointer.x,
      y: controller.pointer.y,
      velocityX: 0,
      velocityY: 0,
    }));
    this.energy = 0;
    this.unsubscribe = null;
    this.finePointer = typeof window !== "undefined" ? supportsFinePointer() : false;
    this.handleResize = this.resize.bind(this);
  }

  resize() {
    const dpr = this.controller.viewport.dpr;
    const { width, height } = this.controller.viewport;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  mount() {
    if (!this.context || !this.finePointer) {
      return () => {};
    }

    this.resize();
    this.unsubscribe = this.controller.subscribe(this.update.bind(this));
    window.addEventListener("resize", this.handleResize, { passive: true });

    return () => this.destroy();
  }

  update({ deltaTime }) {
    const { pointer } = this.controller;
    const { width, height } = this.controller.viewport;

    this.energy = damp(
      this.energy,
      pointer.active ? clamp(pointer.speed / 40, 0.24, 1) : 0,
      0.12,
      deltaTime
    );

    const head = this.nodes[0];
    head.velocityX += (pointer.x - head.x) * 0.24;
    head.velocityY += (pointer.y - head.y) * 0.24;
    head.velocityX *= 0.62;
    head.velocityY *= 0.62;
    head.x += head.velocityX;
    head.y += head.velocityY;

    for (let index = 1; index < this.nodes.length; index += 1) {
      const node = this.nodes[index];
      const target = this.nodes[index - 1];
      const spring = Math.max(0.14, 0.22 - index * 0.004);
      const friction = Math.max(0.58, 0.76 - index * 0.01);

      node.velocityX += (target.x - node.x) * spring;
      node.velocityY += (target.y - node.y) * spring;
      node.velocityX *= friction;
      node.velocityY *= friction;
      node.x += node.velocityX;
      node.y += node.velocityY;
    }

    this.draw(width, height);
  }

  draw(width, height) {
    this.context.clearRect(0, 0, width, height);

    if (this.energy < 0.02) {
      return;
    }

    this.context.save();
    this.context.globalCompositeOperation = "screen";

    for (let index = 1; index < this.nodes.length; index += 1) {
      const from = this.nodes[index - 1];
      const to = this.nodes[index];
      const progress = index / this.nodes.length;
      const widthFactor = (1 - progress) * 18 * this.energy + 0.75;
      const alpha = (1 - progress) * this.energy * 0.85;

      const gradient = this.context.createLinearGradient(from.x, from.y, to.x, to.y);
      gradient.addColorStop(0, `rgba(255, 249, 235, ${alpha})`);
      gradient.addColorStop(0.4, `rgba(255, 217, 123, ${alpha * 0.9})`);
      gradient.addColorStop(1, `rgba(255, 185, 94, 0)`);

      this.context.strokeStyle = gradient;
      this.context.lineWidth = widthFactor;
      this.context.lineCap = "round";
      this.context.shadowColor = "rgba(255, 209, 120, 0.55)";
      this.context.shadowBlur = widthFactor * 1.8;
      this.context.beginPath();
      this.context.moveTo(from.x, from.y);
      this.context.lineTo(to.x, to.y);
      this.context.stroke();
    }

    const glow = this.nodes[0];
    const halo = this.context.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, 40);
    halo.addColorStop(0, `rgba(255, 255, 255, ${this.energy})`);
    halo.addColorStop(0.35, `rgba(255, 214, 132, ${this.energy * 0.9})`);
    halo.addColorStop(1, "rgba(255, 214, 132, 0)");

    this.context.fillStyle = halo;
    this.context.beginPath();
    this.context.arc(glow.x, glow.y, 40, 0, Math.PI * 2);
    this.context.fill();
    this.context.restore();
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    window.removeEventListener("resize", this.handleResize);
    this.context?.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
