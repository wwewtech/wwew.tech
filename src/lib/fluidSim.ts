// Fluid simulation step/render/splat, extracted from FluidCursor.tsx.
// Ported from WebGL-Fluid-Simulation (MIT). Geometry buffers are bound once
// by the caller (same as the original) and never rebound.

import type { GL, FBO, DoubleFBO, UniformMap } from './fluidGL';

export interface FluidSimConfig {
  PRESSURE: number;
  PRESSURE_ITERATIONS: number;
  CURL: number;
  VELOCITY_DISSIPATION: number;
  DENSITY_DISSIPATION: number;
  SPLAT_RADIUS: number;
}

/**
 * The uniform names each program declares, taken from the GLSL sources in
 * fluidShaders.ts. Spelling them out makes a typo in a uniform name a
 * compile error instead of a silent `undefined` at runtime.
 */
export interface FluidSimUniforms {
  clear: UniformMap & { uTexture: WebGLUniformLocation | null; value: WebGLUniformLocation | null };
  splat: UniformMap & {
    uTarget: WebGLUniformLocation | null;
    aspectRatio: WebGLUniformLocation | null;
    color: WebGLUniformLocation | null;
    point: WebGLUniformLocation | null;
    radius: WebGLUniformLocation | null;
  };
  advection: UniformMap & {
    texelSize: WebGLUniformLocation | null;
    dyeTexelSize: WebGLUniformLocation | null;
    uVelocity: WebGLUniformLocation | null;
    uSource: WebGLUniformLocation | null;
    dt: WebGLUniformLocation | null;
    dissipation: WebGLUniformLocation | null;
  };
  divergence: UniformMap & {
    texelSize: WebGLUniformLocation | null;
    uVelocity: WebGLUniformLocation | null;
  };
  curl: UniformMap & {
    texelSize: WebGLUniformLocation | null;
    uVelocity: WebGLUniformLocation | null;
  };
  vorticity: UniformMap & {
    texelSize: WebGLUniformLocation | null;
    uVelocity: WebGLUniformLocation | null;
    uCurl: WebGLUniformLocation | null;
    curl: WebGLUniformLocation | null;
    dt: WebGLUniformLocation | null;
  };
  pressure: UniformMap & {
    texelSize: WebGLUniformLocation | null;
    uPressure: WebGLUniformLocation | null;
    uDivergence: WebGLUniformLocation | null;
  };
  gradientSubtract: UniformMap & {
    texelSize: WebGLUniformLocation | null;
    uPressure: WebGLUniformLocation | null;
    uVelocity: WebGLUniformLocation | null;
  };
  display: UniformMap & {
    texelSize: WebGLUniformLocation | null;
    uTexture: WebGLUniformLocation | null;
    uLightTheme: WebGLUniformLocation | null;
  };
}

export interface FluidSimInput {
  gl: GL;
  canvas: HTMLCanvasElement;
  config: FluidSimConfig;
  programs: {
    clear: WebGLProgram;
    splat: WebGLProgram;
    advection: WebGLProgram;
    divergence: WebGLProgram;
    curl: WebGLProgram;
    vorticity: WebGLProgram;
    pressure: WebGLProgram;
    gradientSubtract: WebGLProgram;
    display: WebGLProgram;
  };
  uniforms: FluidSimUniforms;
  dye: DoubleFBO;
  velocity: DoubleFBO;
  divergenceFBO: FBO;
  curlFBO: FBO;
  pressureFBO: DoubleFBO;
  supportLinearFiltering: boolean;
  shading: boolean;
}

export interface FluidSim {
  splat: (x: number, y: number, dx: number, dy: number, color: { r: number; g: number; b: number }) => void;
  step: (dt: number) => void;
  render: () => void;
}

/** Computes the simulation texture resolution for the current canvas aspect. */
export const getResolution = (gl: GL, resolution: number) => {
  let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
  if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;
  const min = Math.round(resolution);
  const max = Math.round(resolution * aspectRatio);
  if (gl.drawingBufferWidth > gl.drawingBufferHeight) {
    return { width: max, height: min };
  }
  return { width: min, height: max };
};

export const createFluidSim = (input: FluidSimInput): FluidSim => {
  const {
    gl, canvas, config, programs, uniforms,
    dye, velocity, divergenceFBO, curlFBO, pressureFBO,
    supportLinearFiltering, shading,
  } = input;

  const blit = (target: FBO | null) => {
    if (target === null) {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    } else {
      gl.viewport(0, 0, target.width, target.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  };

  const splat = (x: number, y: number, dx: number, dy: number, color: { r: number; g: number; b: number }) => {
    gl.useProgram(programs.splat);
    gl.uniform1i(uniforms.splat.uTarget, velocity.read.attach(0));
    gl.uniform1f(uniforms.splat.aspectRatio, canvas.width / canvas.height);
    gl.uniform2f(uniforms.splat.point, x, y);
    gl.uniform3f(uniforms.splat.color, dx, dy, 0.0);
    gl.uniform1f(uniforms.splat.radius, config.SPLAT_RADIUS / 100.0);
    blit(velocity.write);
    velocity.swap();

    gl.uniform1i(uniforms.splat.uTarget, dye.read.attach(0));
    gl.uniform3f(uniforms.splat.color, color.r, color.g, color.b);
    blit(dye.write);
    dye.swap();
  };

  const step = (dt: number) => {
    gl.disable(gl.BLEND);

    // Curl
    gl.useProgram(programs.curl);
    gl.uniform2f(uniforms.curl.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(uniforms.curl.uVelocity, velocity.read.attach(0));
    blit(curlFBO);

    // Vorticity
    gl.useProgram(programs.vorticity);
    gl.uniform2f(uniforms.vorticity.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(uniforms.vorticity.uVelocity, velocity.read.attach(0));
    gl.uniform1i(uniforms.vorticity.uCurl, curlFBO.attach(1));
    gl.uniform1f(uniforms.vorticity.curl, config.CURL);
    gl.uniform1f(uniforms.vorticity.dt, dt);
    blit(velocity.write);
    velocity.swap();

    // Divergence
    gl.useProgram(programs.divergence);
    gl.uniform2f(uniforms.divergence.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(uniforms.divergence.uVelocity, velocity.read.attach(0));
    blit(divergenceFBO);

    // Clear pressure
    gl.useProgram(programs.clear);
    gl.uniform1i(uniforms.clear.uTexture, pressureFBO.read.attach(0));
    gl.uniform1f(uniforms.clear.value, config.PRESSURE);
    blit(pressureFBO.write);
    pressureFBO.swap();

    // Pressure iterations
    gl.useProgram(programs.pressure);
    gl.uniform2f(uniforms.pressure.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(uniforms.pressure.uDivergence, divergenceFBO.attach(0));
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(uniforms.pressure.uPressure, pressureFBO.read.attach(1));
      blit(pressureFBO.write);
      pressureFBO.swap();
    }

    // Gradient subtract
    gl.useProgram(programs.gradientSubtract);
    gl.uniform2f(uniforms.gradientSubtract.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(uniforms.gradientSubtract.uPressure, pressureFBO.read.attach(0));
    gl.uniform1i(uniforms.gradientSubtract.uVelocity, velocity.read.attach(1));
    blit(velocity.write);
    velocity.swap();

    // Advection velocity
    gl.useProgram(programs.advection);
    gl.uniform2f(uniforms.advection.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    if (!supportLinearFiltering) {
      gl.uniform2f(uniforms.advection.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
    }
    const velocityId = velocity.read.attach(0);
    gl.uniform1i(uniforms.advection.uVelocity, velocityId);
    gl.uniform1i(uniforms.advection.uSource, velocityId);
    gl.uniform1f(uniforms.advection.dt, dt);
    gl.uniform1f(uniforms.advection.dissipation, config.VELOCITY_DISSIPATION);
    blit(velocity.write);
    velocity.swap();

    // Advection dye
    if (!supportLinearFiltering) {
      gl.uniform2f(uniforms.advection.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
    }
    gl.uniform1i(uniforms.advection.uVelocity, velocity.read.attach(0));
    gl.uniform1i(uniforms.advection.uSource, dye.read.attach(1));
    gl.uniform1f(uniforms.advection.dissipation, config.DENSITY_DISSIPATION);
    blit(dye.write);
    dye.swap();
  };

  const render = () => {
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    gl.useProgram(programs.display);
    if (shading) {
      gl.uniform2f(uniforms.display.texelSize, 1.0 / gl.drawingBufferWidth, 1.0 / gl.drawingBufferHeight);
    }
    gl.uniform1i(uniforms.display.uTexture, dye.read.attach(0));
    blit(null);
  };

  return { splat, step, render };
};
