import { clamp, randomRange } from "./utils";

export class RippleCanvas {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d", { alpha: true });
    this.bufferCanvas = document.createElement("canvas");
    this.bufferContext = this.bufferCanvas.getContext("2d", { alpha: true });
    this.pointer = { x: 0.5, y: 0.5, active: false };
    this.hoverAccumulator = 0;
    this.autoAt = 0;
    this.simWidth = 180;
    this.simHeight = 120;
    this.current = new Float32Array(this.simWidth * this.simHeight);
    this.previous = new Float32Array(this.simWidth * this.simHeight);
    this.next = new Float32Array(this.simWidth * this.simHeight);
    this.imageData = null;

    this.setupBuffer();
  }

  setupBuffer() {
    this.bufferCanvas.width = this.simWidth;
    this.bufferCanvas.height = this.simHeight;
    this.imageData = this.bufferContext.createImageData(this.simWidth, this.simHeight);
  }

  resize(width, height, dpr) {
    this.canvas.width = Math.max(1, Math.floor(width * dpr));
    this.canvas.height = Math.max(1, Math.floor(height * dpr));
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  }

  setPointer(nx, ny, active) {
    this.pointer.x = clamp(nx, 0, 1);
    this.pointer.y = clamp(ny, 0, 1);
    this.pointer.active = active;
  }

  disturb(nx, ny, radius = 5, intensity = 18) {
    const cx = Math.floor(nx * (this.simWidth - 1));
    const cy = Math.floor(ny * (this.simHeight - 1));

    for (let y = -radius; y <= radius; y += 1) {
      for (let x = -radius; x <= radius; x += 1) {
        const tx = cx + x;
        const ty = cy + y;

        if (tx <= 1 || tx >= this.simWidth - 1 || ty <= 1 || ty >= this.simHeight - 1) {
          continue;
        }

        const distance = Math.hypot(x, y);

        if (distance > radius) {
          continue;
        }

        const falloff = 1 - distance / radius;
        const index = ty * this.simWidth + tx;
        this.current[index] += intensity * falloff;
      }
    }
  }

  injectRipple(nx, ny, amplitude = 24) {
    this.disturb(nx, ny, 6, amplitude);
  }

  spawnAuto() {
    this.injectRipple(randomRange(0.14, 0.86), randomRange(0.22, 0.8), randomRange(18, 28));
  }

  simulate() {
    const width = this.simWidth;
    const height = this.simHeight;

    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = y * width + x;
        const wave =
          (this.current[index - 1] +
            this.current[index + 1] +
            this.current[index - width] +
            this.current[index + width]) *
            0.5 -
          this.previous[index];

        this.next[index] = wave * 0.991;
      }
    }

    const swap = this.previous;
    this.previous = this.current;
    this.current = this.next;
    this.next = swap;
  }

  render() {
    const width = this.simWidth;
    const height = this.simHeight;
    const data = this.imageData.data;
    const lightX = -0.32;
    const lightY = 0.45;
    const lightZ = 0.92;

    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = y * width + x;
        const pixelIndex = index * 4;
        const left = this.current[index - 1];
        const right = this.current[index + 1];
        const up = this.current[index - width];
        const down = this.current[index + width];

        const normalX = (left - right) * 0.04;
        const normalY = (up - down) * 0.04;
        const normalZ = 1;
        const length = Math.hypot(normalX, normalY, normalZ) || 1;
        const nx = normalX / length;
        const ny = normalY / length;
        const nz = normalZ / length;
        const diffuse = Math.max(nx * lightX + ny * lightY + nz * lightZ, 0);
        const specular = Math.pow(Math.max(nz, 0), 22) * Math.max(diffuse, 0.35);
        const glow = clamp(this.current[index] * 0.018, -0.2, 0.5);
        const blend = y / height;

        const red = 18 + blend * 32 + diffuse * 36 + specular * 120 + glow * 160;
        const green = 30 + blend * 42 + diffuse * 42 + specular * 82 + glow * 110;
        const blue = 48 + blend * 80 + diffuse * 64 + specular * 50 + glow * 28;

        data[pixelIndex] = clamp(red, 0, 255);
        data[pixelIndex + 1] = clamp(green, 0, 255);
        data[pixelIndex + 2] = clamp(blue, 0, 255);
        data[pixelIndex + 3] = 232;
      }
    }

    this.bufferContext.putImageData(this.imageData, 0, 0);

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.save();
    this.context.globalCompositeOperation = "screen";
    this.context.imageSmoothingEnabled = true;
    this.context.drawImage(
      this.bufferCanvas,
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
    this.context.restore();
  }

  update({ time, deltaTime }) {
    if (time >= this.autoAt) {
      this.spawnAuto();
      this.autoAt = time + randomRange(0.6, 1.6);
    }

    if (this.pointer.active) {
      this.hoverAccumulator += deltaTime;

      if (this.hoverAccumulator >= 0.08) {
        this.disturb(this.pointer.x, this.pointer.y, 3, 7);
        this.hoverAccumulator = 0;
      }
    }

    this.simulate();
    this.render();
  }

  destroy() {
    this.context?.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
