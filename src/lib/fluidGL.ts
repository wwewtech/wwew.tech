// WebGL helpers for the fluid simulation, extracted from FluidCursor.tsx.
// Ported from WebGL-Fluid-Simulation (MIT).

export interface FBO {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  attach: (id: number) => number;
}

export interface DoubleFBO {
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  read: FBO;
  write: FBO;
  swap: () => void;
}

export type GL = WebGLRenderingContext | WebGL2RenderingContext;

export const compileShader = (
  gl: GL,
  type: number,
  source: string,
  keywords?: string[]
): WebGLShader | null => {
  let finalSource = source;
  if (keywords) {
    const keywordsString = keywords.map(k => `#define ${k}\n`).join('');
    finalSource = keywordsString + source;
  }
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, finalSource);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
};

export const createProgram = (
  gl: GL,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram | null => {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return null;
  }
  return program;
};

/**
 * Uniform locations of one program, keyed by the uniform names the shader
 * actually declares.
 *
 * Typing the names explicitly (instead of `Record<string, ...>`) lets the
 * compiler check every access: a typo in a uniform name becomes a type error
 * rather than a silent `undefined` at runtime.
 */
export type UniformMap = {
  readonly [name: string]: WebGLUniformLocation | null;
};

/**
 * Reads the active uniforms of a program.
 *
 * `N` is the list of uniform names the shader is expected to declare; the
 * result is typed as `UniformMap & Record<N[number], WebGLUniformLocation | null>`
 * so that every later access is checked against a known name.
 */
export const getUniforms = <N extends string>(
  gl: GL,
  program: WebGLProgram
): UniformMap & Record<N, WebGLUniformLocation | null> => {
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  // getProgramParameter is typed to return `any`. Receiving it as `unknown`
  // and narrowing keeps the value honest without an assertion: the WebGL
  // spec guarantees a count here, and anything else is treated as zero.
  const rawUniformCount: unknown = gl.getProgramParameter(
    program,
    gl.ACTIVE_UNIFORMS
  );
  const uniformCount =
    typeof rawUniformCount === 'number' ? rawUniformCount : 0;
  for (let i = 0; i < uniformCount; i++) {
    const uniformInfo = gl.getActiveUniform(program, i);
    if (uniformInfo) {
      uniforms[uniformInfo.name] = gl.getUniformLocation(program, uniformInfo.name);
    }
  }
  return uniforms;
};

export const getSupportedFormat = (
  gl: GL,
  internalFormat: number,
  format: number,
  type: number
): { internalFormat: number; format: number } | null => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  gl.deleteTexture(texture);
  gl.deleteFramebuffer(fbo);

  return status === gl.FRAMEBUFFER_COMPLETE ? { internalFormat, format } : null;
};

export const createFBO = (
  gl: GL,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
  param: number
): FBO | null => {
  gl.activeTexture(gl.TEXTURE0);
  const texture = gl.createTexture();
  if (!texture) return null;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

  const fbo = gl.createFramebuffer();
  if (!fbo) return null;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.viewport(0, 0, w, h);
  gl.clear(gl.COLOR_BUFFER_BIT);

  return {
    texture,
    fbo,
    width: w,
    height: h,
    texelSizeX: 1.0 / w,
    texelSizeY: 1.0 / h,
    attach(id: number) {
      gl.activeTexture(gl.TEXTURE0 + id);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      return id;
    },
  };
};

export const createDoubleFBO = (
  gl: GL,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
  param: number
): DoubleFBO | null => {
  let fbo1 = createFBO(gl, w, h, internalFormat, format, type, param);
  let fbo2 = createFBO(gl, w, h, internalFormat, format, type, param);
  if (!fbo1 || !fbo2) return null;
  return {
    width: w,
    height: h,
    texelSizeX: fbo1.texelSizeX,
    texelSizeY: fbo1.texelSizeY,
    get read() { return fbo1!; },
    set read(value) { fbo1 = value; },
    get write() { return fbo2!; },
    set write(value) { fbo2 = value; },
    swap() {
      const temp = fbo1;
      fbo1 = fbo2;
      fbo2 = temp;
    },
  };
};

/**
 * Releases the GPU memory held by a framebuffer and its texture.
 */
export const disposeFBO = (gl: GL, fbo: FBO | null | undefined) => {
  if (!fbo) return;
  gl.deleteFramebuffer(fbo.fbo);
  gl.deleteTexture(fbo.texture);
};

/**
 * Releases both framebuffers of a double buffer.
 */
export const disposeDoubleFBO = (gl: GL, double: DoubleFBO | null | undefined) => {
  if (!double) return;
  disposeFBO(gl, double.read);
  disposeFBO(gl, double.write);
};

/**
 * Releases a compiled shader program together with the shaders attached to it.
 *
 * The shaders are detached and deleted first: deleting the program alone does
 * not free the shader objects, so the driver keeps them alive until the
 * context is lost.
 */
export const disposeProgram = (
  gl: GL,
  program: WebGLProgram | null | undefined,
  shaders: (WebGLShader | null | undefined)[]
) => {
  if (!program) return;
  for (const shader of shaders) {
    if (!shader) continue;
    gl.detachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.deleteProgram(program);
};

/**
 * Releases the WebGL context itself.
 *
 * `loseContext()` tells the driver that the context can be dropped, which
 * frees the textures, buffers and programs that were still attached to it.
 * Without this, a context that is only "abandoned" keeps its resources until
 * the browser decides to reclaim them.
 */
export const loseContext = (gl: GL) => {
  const ext = gl.getExtension('WEBGL_lose_context');
  ext?.loseContext();
};
