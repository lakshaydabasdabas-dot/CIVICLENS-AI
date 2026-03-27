import { clamp, randomRange } from "./utils";

const MAX_RIPPLES = 8;

const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision highp float;

varying vec2 v_uv;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_pointer;
uniform float u_hover;
uniform vec2 u_ripple_pos[${MAX_RIPPLES}];
uniform float u_ripple_start[${MAX_RIPPLES}];
uniform float u_ripple_amp[${MAX_RIPPLES}];

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.55;

  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.55;
  }

  return value;
}

void main() {
  vec2 uv = v_uv;
  vec2 centered = uv * 2.0 - 1.0;

  float waveField = 0.0;
  vec2 normalOffset = vec2(0.0);

  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    float age = u_time - u_ripple_start[i];

    if (age > 0.0) {
      vec2 diff = uv - u_ripple_pos[i];
      float dist = length(diff) + 0.0001;
      float travel = age * 0.14;
      float envelope = exp(-age * 0.16);
      float ring = sin((dist - travel) * 52.0) * exp(-pow(dist - travel, 2.0) * 1400.0);
      float contribution = ring * u_ripple_amp[i] * envelope;

      waveField += contribution;
      normalOffset += normalize(diff) * contribution;
    }
  }

  vec2 pointerDiff = uv - u_pointer;
  float pointerDistance = length(pointerDiff) + 0.0001;
  float hoverWave = sin(pointerDistance * 72.0 - u_time * 4.0) * exp(-pointerDistance * 8.0) * 0.22 * u_hover;

  waveField += hoverWave;
  normalOffset += normalize(pointerDiff) * hoverWave * 0.35;

  float surfaceNoise = fbm(uv * vec2(u_resolution.x / u_resolution.y, 1.0) * 5.6 + vec2(u_time * 0.05, -u_time * 0.03));
  normalOffset += vec2(surfaceNoise - 0.5) * 0.075;

  vec2 displacedUv = uv + normalOffset * 0.11;

  vec3 baseDark = vec3(0.03, 0.07, 0.13);
  vec3 baseMid = vec3(0.09, 0.17, 0.30);
  vec3 gold = vec3(0.94, 0.76, 0.42);
  vec3 whiteGold = vec3(1.0, 0.97, 0.92);

  float verticalGlow = smoothstep(-0.75, 0.92, centered.y + surfaceNoise * 0.18);
  float caustic = fbm(displacedUv * 12.0 + vec2(0.0, u_time * 0.06) + waveField);
  vec3 color = mix(baseDark, baseMid, verticalGlow);

  vec3 normal = normalize(vec3(normalOffset.x * 7.0, normalOffset.y * 7.0, 1.0));
  vec3 lightDir = normalize(vec3(-0.32, 0.45, 0.94));
  vec3 viewDir = vec3(0.0, 0.0, 1.0);

  float diffuse = max(dot(normal, lightDir), 0.0);
  float specular = pow(max(dot(reflect(-lightDir, normal), viewDir), 0.0), 34.0);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.2);

  color += gold * (0.12 + diffuse * 0.22 + waveField * 0.26);
  color += whiteGold * specular * 1.45;
  color += gold * caustic * 0.08;
  color += gold * fresnel * 0.14;

  float edgeFade = smoothstep(1.14, 0.15, length(centered));
  gl_FragColor = vec4(color * edgeFade, 0.94);
}
`;

const createShader = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message || "Failed to compile shader.");
  }

  return shader;
};

const createProgram = (gl, vertexSource, fragmentSource) => {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(message || "Failed to link program.");
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  return program;
};

export class RippleWebGL {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.onContextLost = options.onContextLost;
    this.gl =
      canvas.getContext("webgl", {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
        powerPreference: "high-performance",
      }) ||
      canvas.getContext("experimental-webgl");

    if (!this.gl) {
      throw new Error("WebGL not supported.");
    }

    this.program = createProgram(this.gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);
    this.positionLocation = this.gl.getAttribLocation(this.program, "a_position");
    this.uniforms = {
      resolution: this.gl.getUniformLocation(this.program, "u_resolution"),
      time: this.gl.getUniformLocation(this.program, "u_time"),
      pointer: this.gl.getUniformLocation(this.program, "u_pointer"),
      hover: this.gl.getUniformLocation(this.program, "u_hover"),
      ripplePos: this.gl.getUniformLocation(this.program, "u_ripple_pos[0]"),
      rippleStart: this.gl.getUniformLocation(this.program, "u_ripple_start[0]"),
      rippleAmp: this.gl.getUniformLocation(this.program, "u_ripple_amp[0]"),
    };
    this.buffer = this.gl.createBuffer();
    this.pointer = { x: 0.5, y: 0.5, active: false };
    this.hoverStrength = 0;
    this.autoAt = 0;
    this.rippleIndex = 0;
    this.ripplePositions = new Float32Array(MAX_RIPPLES * 2);
    this.rippleStarts = new Float32Array(MAX_RIPPLES);
    this.rippleAmplitudes = new Float32Array(MAX_RIPPLES);
    this.contextLost = false;

    this.handleContextLost = this.handleContextLost.bind(this);

    this.initialize();
    this.canvas.addEventListener("webglcontextlost", this.handleContextLost, false);
  }

  initialize() {
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
    this.gl.clearColor(0, 0, 0, 0);

    for (let index = 0; index < MAX_RIPPLES; index += 1) {
      this.rippleStarts[index] = -100;
      this.rippleAmplitudes[index] = 0;
    }
  }

  handleContextLost(event) {
    event.preventDefault();
    this.contextLost = true;

    if (this.onContextLost) {
      this.onContextLost();
    }
  }

  resize(width, height, dpr) {
    this.canvas.width = Math.max(1, Math.floor(width * dpr));
    this.canvas.height = Math.max(1, Math.floor(height * dpr));
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  setPointer(nx, ny, active) {
    this.pointer.x = clamp(nx, 0, 1);
    this.pointer.y = clamp(ny, 0, 1);
    this.pointer.active = active;
  }

  injectRipple(nx, ny, amplitude = 1.2, time = performance.now() / 1000) {
    const writeIndex = this.rippleIndex % MAX_RIPPLES;

    this.ripplePositions[writeIndex * 2] = clamp(nx, 0, 1);
    this.ripplePositions[writeIndex * 2 + 1] = clamp(1 - ny, 0, 1);
    this.rippleStarts[writeIndex] = time;
    this.rippleAmplitudes[writeIndex] = amplitude;
    this.rippleIndex += 1;
  }

  spawnAuto(time) {
    this.injectRipple(randomRange(0.15, 0.85), randomRange(0.18, 0.82), randomRange(1.1, 1.7), time);
    this.autoAt = time + randomRange(0.6, 1.6);
  }

  update({ time, deltaTime }) {
    if (this.contextLost) {
      return;
    }

    this.hoverStrength += ((this.pointer.active ? 1 : 0) - this.hoverStrength) * Math.min(1, deltaTime * 5.2);

    if (time >= this.autoAt) {
      this.spawnAuto(time);
    }

    this.render(time);
  }

  render(time) {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.useProgram(this.program);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
    this.gl.enableVertexAttribArray(this.positionLocation);
    this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
    this.gl.uniform1f(this.uniforms.time, time);
    this.gl.uniform2f(this.uniforms.pointer, this.pointer.x, 1 - this.pointer.y);
    this.gl.uniform1f(this.uniforms.hover, this.hoverStrength);
    this.gl.uniform2fv(this.uniforms.ripplePos, this.ripplePositions);
    this.gl.uniform1fv(this.uniforms.rippleStart, this.rippleStarts);
    this.gl.uniform1fv(this.uniforms.rippleAmp, this.rippleAmplitudes);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }

  destroy() {
    this.canvas.removeEventListener("webglcontextlost", this.handleContextLost, false);

    if (!this.gl) {
      return;
    }

    this.gl.deleteBuffer(this.buffer);
    this.gl.deleteProgram(this.program);
  }
}
