'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useFluidCursor, useTheme } from '@/lib/context';

// ═══════════════════════════════════════════════════════════════════════════════
// НАСТРОЙКИ FLUID CURSOR - Измените параметры здесь
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // ─────────────────────────────────────────────────────────────────────────────
  // СИМУЛЯЦИЯ ЖИДКОСТИ
  // ─────────────────────────────────────────────────────────────────────────────
  SIM_RESOLUTION: 64,           // Уменьшено для производительности (было 128)
  DYE_RESOLUTION: 512,          // Уменьшено для производительности (было 1024)
  
  // ─────────────────────────────────────────────────────────────────────────────
  // ПОВЕДЕНИЕ ЖИДКОСТИ
  // ─────────────────────────────────────────────────────────────────────────────
  DENSITY_DISSIPATION: 5,       // Умеренное затухание
  VELOCITY_DISSIPATION: 6,      // Умеренное затухание скорости
  PRESSURE: 0.04,               // Давление жидкости (0.01-0.5)
  PRESSURE_ITERATIONS: 10,      // Итерации давления
  CURL: 1.5,                    // Лёгкие завихрения
  
  // ─────────────────────────────────────────────────────────────────────────────
  // ВНЕШНИЙ ВИД КУРСОРА
  // ─────────────────────────────────────────────────────────────────────────────
  SPLAT_RADIUS: 0.12,           // Аккуратный размер "кляксы"
  SPLAT_FORCE: 3500,            // Умеренная сила разбрызгивания
  
  // ─────────────────────────────────────────────────────────────────────────────
  // ВИЗУАЛЬНЫЕ ЭФФЕКТЫ
  // ─────────────────────────────────────────────────────────────────────────────
  SHADING: true,                // Включить 3D-освещение эффект
  TRANSPARENT: true,            // Прозрачный фон (для наложения на контент)
  
  // ─────────────────────────────────────────────────────────────────────────────
  // ПАЛИТРА ЦВЕТОВ ДЛЯ ТЁМНОЙ ТЕМЫ (HEX формат)
  // ─────────────────────────────────────────────────────────────────────────────
  COLORS_DARK: [
    '#b5ff6d',                  // Зеленый (лайм)
    '#6dffb5',                  // Бирюзовый
    '#6db5ff',                  // Голубой
    '#ff6db5',                  // Розовый
    '#ffb56d',                  // Оранжевый
  ],
  COLOR_INTENSITY_DARK: 0.10,   // Умеренная интенсивность цвета для тёмной темы
  
  // ─────────────────────────────────────────────────────────────────────────────
  // ПАЛИТРА ЦВЕТОВ ДЛЯ СВЕТЛОЙ ТЕМЫ (HEX формат)
  // ─────────────────────────────────────────────────────────────────────────────
  COLORS_LIGHT: [
    '#86efac',                  // Мягкий мятный
    '#7dd3fc',                  // Нежный голубой  
    '#a5b4fc',                  // Лавандовый
    '#f9a8d4',                  // Нежно-розовый
    '#fcd34d',                  // Мягкий золотистый
  ],
  COLOR_INTENSITY_LIGHT: 0.1,  // Умеренная интенсивность для мягкого эффекта
};

// ═══════════════════════════════════════════════════════════════════════════════

interface Pointer {
  id: number;
  texcoordX: number;
  texcoordY: number;
  prevTexcoordX: number;
  prevTexcoordY: number;
  deltaX: number;
  deltaY: number;
  down: boolean;
  moved: boolean;
  color: { r: number; g: number; b: number };
}

// Определение мобильного устройства
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || window.matchMedia('(max-width: 768px)').matches
    || 'ontouchstart' in window;
};

export const FluidCursor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const pointersRef = useRef<Pointer[]>([]);
  const colorIndexRef = useRef(0);
  const { isFluidCursorEnabled } = useFluidCursor();
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = React.useState(false);
  const [isReady, setIsReady] = React.useState(false);

  // Проверяем мобильное устройство после монтирования
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // Небольшая задержка для плавного появления
  useEffect(() => {
    if (isMobile) return;
    
    // Небольшая задержка для плавного появления после загрузки компонента
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [isMobile]);
  
  // Выбираем цвета и интенсивность в зависимости от темы
  const colors = theme === 'light' ? CONFIG.COLORS_LIGHT : CONFIG.COLORS_DARK;
  const colorIntensity = theme === 'light' ? CONFIG.COLOR_INTENSITY_LIGHT : CONFIG.COLOR_INTENSITY_DARK;

  const hexToRgb = useCallback((hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255,
        }
      : { r: 0, g: 0, b: 0 };
  }, []);

  const generateColor = useCallback(() => {
    const c = hexToRgb(colors[colorIndexRef.current]);
    colorIndexRef.current = (colorIndexRef.current + 1) % colors.length;
    return { r: c.r * colorIntensity, g: c.g * colorIntensity, b: c.b * colorIntensity };
  }, [hexToRgb, colors, colorIntensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    // Полностью отключаем на мобильных устройствах или пока не готов
    if (!canvas || isMobile || !isReady) return;

    // Initialize pointer
    pointersRef.current = [{
      id: -1,
      texcoordX: 0,
      texcoordY: 0,
      prevTexcoordX: 0,
      prevTexcoordY: 0,
      deltaX: 0,
      deltaY: 0,
      down: false,
      moved: false,
      color: { r: 0, g: 0, b: 0 },
    }];

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false,
    }) || canvas.getContext('webgl', {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) return;

    const isWebGL2 = gl instanceof WebGL2RenderingContext;

    // Extensions
    let halfFloatTexType: number;
    let supportLinearFiltering: boolean;

    if (isWebGL2) {
      gl.getExtension('EXT_color_buffer_float');
      supportLinearFiltering = !!gl.getExtension('OES_texture_float_linear');
      halfFloatTexType = (gl as WebGL2RenderingContext).HALF_FLOAT;
    } else {
      const halfFloat = gl.getExtension('OES_texture_half_float');
      supportLinearFiltering = !!gl.getExtension('OES_texture_half_float_linear');
      halfFloatTexType = halfFloat?.HALF_FLOAT_OES || gl.UNSIGNED_BYTE;
    }

    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    // Get supported format
    const getSupportedFormat = (
      internalFormat: number,
      format: number,
      type: number
    ) => {
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

    // Determine formats
    let formatRGBA: { internalFormat: number; format: number } | null;
    let formatRG: { internalFormat: number; format: number } | null;
    let formatR: { internalFormat: number; format: number } | null;

    if (isWebGL2) {
      const gl2 = gl as WebGL2RenderingContext;
      formatRGBA = getSupportedFormat(gl2.RGBA16F, gl2.RGBA, halfFloatTexType) ||
                   getSupportedFormat(gl2.RGBA, gl2.RGBA, gl.UNSIGNED_BYTE);
      formatRG = getSupportedFormat(gl2.RG16F, gl2.RG, halfFloatTexType) ||
                 getSupportedFormat(gl2.RGBA16F, gl2.RGBA, halfFloatTexType);
      formatR = getSupportedFormat(gl2.R16F, gl2.RED, halfFloatTexType) ||
                getSupportedFormat(gl2.RGBA16F, gl2.RGBA, halfFloatTexType);
    } else {
      formatRGBA = { internalFormat: gl.RGBA, format: gl.RGBA };
      formatRG = { internalFormat: gl.RGBA, format: gl.RGBA };
      formatR = { internalFormat: gl.RGBA, format: gl.RGBA };
    }

    if (!formatRGBA || !formatRG || !formatR) return;

    // Compile shader
    const compileShader = (type: number, source: string, keywords?: string[]) => {
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

    // Create program
    const createProgram = (vertexShader: WebGLShader, fragmentShader: WebGLShader) => {
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

    // Get uniforms
    const getUniforms = (program: WebGLProgram) => {
      const uniforms: Record<string, WebGLUniformLocation | null> = {};
      const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < uniformCount; i++) {
        const uniformInfo = gl.getActiveUniform(program, i);
        if (uniformInfo) {
          uniforms[uniformInfo.name] = gl.getUniformLocation(program, uniformInfo.name);
        }
      }
      return uniforms;
    };

    // Shaders
    const baseVertexShader = compileShader(gl.VERTEX_SHADER, `
      precision highp float;
      attribute vec2 aPosition;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform vec2 texelSize;
      void main () {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `);

    const displayShaderSource = `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uTexture;
      uniform vec2 texelSize;
      void main () {
        vec3 c = texture2D(uTexture, vUv).rgb;
        #ifdef SHADING
          vec3 lc = texture2D(uTexture, vL).rgb;
          vec3 rc = texture2D(uTexture, vR).rgb;
          vec3 tc = texture2D(uTexture, vT).rgb;
          vec3 bc = texture2D(uTexture, vB).rgb;
          float dx = length(rc) - length(lc);
          float dy = length(tc) - length(bc);
          vec3 n = normalize(vec3(dx, dy, length(texelSize)));
          vec3 l = vec3(0.0, 0.0, 1.0);
          float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
          c *= diffuse;
        #endif
        float a = max(c.r, max(c.g, c.b));
        #ifdef LIGHT_THEME
          a = min(a * 1.8, 0.7);
          c = min(c * 1.3, vec3(1.0));
        #endif
        gl_FragColor = vec4(c, a);
      }
    `;

    const splatShader = compileShader(gl.FRAGMENT_SHADER, `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uTarget;
      uniform float aspectRatio;
      uniform vec3 color;
      uniform vec2 point;
      uniform float radius;
      void main () {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
      }
    `);

    const advectionShader = compileShader(gl.FRAGMENT_SHADER, `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uVelocity;
      uniform sampler2D uSource;
      uniform vec2 texelSize;
      uniform vec2 dyeTexelSize;
      uniform float dt;
      uniform float dissipation;
      vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
        vec2 st = uv / tsize - 0.5;
        vec2 iuv = floor(st);
        vec2 fuv = fract(st);
        vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
        vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
        vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
        vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
        return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
      }
      void main () {
        #ifdef MANUAL_FILTERING
          vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
          vec4 result = bilerp(uSource, coord, dyeTexelSize);
        #else
          vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
          vec4 result = texture2D(uSource, coord);
        #endif
        float decay = 1.0 + dissipation * dt;
        gl_FragColor = result / decay;
      }
    `, supportLinearFiltering ? undefined : ['MANUAL_FILTERING']);

    const divergenceShader = compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uVelocity;
      void main () {
        float L = texture2D(uVelocity, vL).x;
        float R = texture2D(uVelocity, vR).x;
        float T = texture2D(uVelocity, vT).y;
        float B = texture2D(uVelocity, vB).y;
        vec2 C = texture2D(uVelocity, vUv).xy;
        if (vL.x < 0.0) { L = -C.x; }
        if (vR.x > 1.0) { R = -C.x; }
        if (vT.y > 1.0) { T = -C.y; }
        if (vB.y < 0.0) { B = -C.y; }
        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
      }
    `);

    const curlShader = compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uVelocity;
      void main () {
        float L = texture2D(uVelocity, vL).y;
        float R = texture2D(uVelocity, vR).y;
        float T = texture2D(uVelocity, vT).x;
        float B = texture2D(uVelocity, vB).x;
        float vorticity = R - L - T + B;
        gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
      }
    `);

    const vorticityShader = compileShader(gl.FRAGMENT_SHADER, `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uVelocity;
      uniform sampler2D uCurl;
      uniform float curl;
      uniform float dt;
      void main () {
        float L = texture2D(uCurl, vL).x;
        float R = texture2D(uCurl, vR).x;
        float T = texture2D(uCurl, vT).x;
        float B = texture2D(uCurl, vB).x;
        float C = texture2D(uCurl, vUv).x;
        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        force /= length(force) + 0.0001;
        force *= curl * C;
        force.y *= -1.0;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity += force * dt;
        gl_FragColor = vec4(velocity, 0.0, 1.0);
      }
    `);

    const pressureShader = compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uDivergence;
      void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        float C = texture2D(uPressure, vUv).x;
        float divergence = texture2D(uDivergence, vUv).x;
        float pressure = (L + R + B + T - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
      }
    `);

    const gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uVelocity;
      void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
      }
    `);

    const clearShader = compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      uniform sampler2D uTexture;
      uniform float value;
      void main () {
        gl_FragColor = value * texture2D(uTexture, vUv);
      }
    `);

    if (!baseVertexShader || !splatShader || !advectionShader || 
        !divergenceShader || !curlShader || !vorticityShader || 
        !pressureShader || !gradientSubtractShader || !clearShader) return;

    // Setup geometry
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    // Create programs
    const clearProgram = createProgram(baseVertexShader, clearShader);
    const splatProgram = createProgram(baseVertexShader, splatShader);
    const advectionProgram = createProgram(baseVertexShader, advectionShader);
    const divergenceProgram = createProgram(baseVertexShader, divergenceShader);
    const curlProgram = createProgram(baseVertexShader, curlShader);
    const vorticityProgram = createProgram(baseVertexShader, vorticityShader);
    const pressureProgram = createProgram(baseVertexShader, pressureShader);
    const gradientSubtractProgram = createProgram(baseVertexShader, gradientSubtractShader);

    // Display program with shading
    const displayKeywords: string[] = [];
    if (CONFIG.SHADING) displayKeywords.push('SHADING');
    if (theme === 'light') displayKeywords.push('LIGHT_THEME');
    const displayFragmentShader = compileShader(gl.FRAGMENT_SHADER, displayShaderSource, displayKeywords.length > 0 ? displayKeywords : undefined);
    const displayProgram = displayFragmentShader ? createProgram(baseVertexShader, displayFragmentShader) : null;

    if (!clearProgram || !splatProgram || !advectionProgram || 
        !divergenceProgram || !curlProgram || !vorticityProgram || 
        !pressureProgram || !gradientSubtractProgram || !displayProgram) return;

    const clearUniforms = getUniforms(clearProgram);
    const splatUniforms = getUniforms(splatProgram);
    const advectionUniforms = getUniforms(advectionProgram);
    const divergenceUniforms = getUniforms(divergenceProgram);
    const curlUniforms = getUniforms(curlProgram);
    const vorticityUniforms = getUniforms(vorticityProgram);
    const pressureUniforms = getUniforms(pressureProgram);
    const gradientSubtractUniforms = getUniforms(gradientSubtractProgram);
    const displayUniforms = getUniforms(displayProgram);

    // FBO helpers
    interface FBO {
      texture: WebGLTexture;
      fbo: WebGLFramebuffer;
      width: number;
      height: number;
      texelSizeX: number;
      texelSizeY: number;
      attach: (id: number) => number;
    }

    interface DoubleFBO {
      width: number;
      height: number;
      texelSizeX: number;
      texelSizeY: number;
      read: FBO;
      write: FBO;
      swap: () => void;
    }

    const createFBO = (w: number, h: number, internalFormat: number, format: number, type: number, param: number): FBO | null => {
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

    const createDoubleFBO = (w: number, h: number, internalFormat: number, format: number, type: number, param: number): DoubleFBO | null => {
      let fbo1 = createFBO(w, h, internalFormat, format, type, param);
      let fbo2 = createFBO(w, h, internalFormat, format, type, param);
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

    // Blit function
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

    // Resolution helper
    const getResolution = (resolution: number) => {
      let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
      if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;
      const min = Math.round(resolution);
      const max = Math.round(resolution * aspectRatio);
      if (gl.drawingBufferWidth > gl.drawingBufferHeight) {
        return { width: max, height: min };
      }
      return { width: min, height: max };
    };

    // Initialize framebuffers
    const simRes = getResolution(CONFIG.SIM_RESOLUTION);
    const dyeRes = getResolution(CONFIG.DYE_RESOLUTION);
    const filtering = supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    gl.disable(gl.BLEND);

    let dye = createDoubleFBO(dyeRes.width, dyeRes.height, formatRGBA.internalFormat, formatRGBA.format, halfFloatTexType, filtering);
    let velocity = createDoubleFBO(simRes.width, simRes.height, formatRG.internalFormat, formatRG.format, halfFloatTexType, filtering);
    let divergence = createFBO(simRes.width, simRes.height, formatR.internalFormat, formatR.format, halfFloatTexType, gl.NEAREST);
    let curl = createFBO(simRes.width, simRes.height, formatR.internalFormat, formatR.format, halfFloatTexType, gl.NEAREST);
    let pressure = createDoubleFBO(simRes.width, simRes.height, formatR.internalFormat, formatR.format, halfFloatTexType, gl.NEAREST);

    if (!dye || !velocity || !divergence || !curl || !pressure) return;

    // Splat function
    const splat = (x: number, y: number, dx: number, dy: number, color: { r: number; g: number; b: number }) => {
      gl.useProgram(splatProgram);
      gl.uniform1i(splatUniforms.uTarget, velocity!.read.attach(0));
      gl.uniform1f(splatUniforms.aspectRatio, canvas.width / canvas.height);
      gl.uniform2f(splatUniforms.point, x, y);
      gl.uniform3f(splatUniforms.color, dx, dy, 0.0);
      gl.uniform1f(splatUniforms.radius, CONFIG.SPLAT_RADIUS / 100.0);
      blit(velocity!.write);
      velocity!.swap();

      gl.uniform1i(splatUniforms.uTarget, dye!.read.attach(0));
      gl.uniform3f(splatUniforms.color, color.r, color.g, color.b);
      blit(dye!.write);
      dye!.swap();
    };

    // Step function
    const step = (dt: number) => {
      gl.disable(gl.BLEND);

      // Curl
      gl.useProgram(curlProgram);
      gl.uniform2f(curlUniforms.texelSize, velocity!.texelSizeX, velocity!.texelSizeY);
      gl.uniform1i(curlUniforms.uVelocity, velocity!.read.attach(0));
      blit(curl);

      // Vorticity
      gl.useProgram(vorticityProgram);
      gl.uniform2f(vorticityUniforms.texelSize, velocity!.texelSizeX, velocity!.texelSizeY);
      gl.uniform1i(vorticityUniforms.uVelocity, velocity!.read.attach(0));
      gl.uniform1i(vorticityUniforms.uCurl, curl!.attach(1));
      gl.uniform1f(vorticityUniforms.curl, CONFIG.CURL);
      gl.uniform1f(vorticityUniforms.dt, dt);
      blit(velocity!.write);
      velocity!.swap();

      // Divergence
      gl.useProgram(divergenceProgram);
      gl.uniform2f(divergenceUniforms.texelSize, velocity!.texelSizeX, velocity!.texelSizeY);
      gl.uniform1i(divergenceUniforms.uVelocity, velocity!.read.attach(0));
      blit(divergence);

      // Clear pressure
      gl.useProgram(clearProgram);
      gl.uniform1i(clearUniforms.uTexture, pressure!.read.attach(0));
      gl.uniform1f(clearUniforms.value, CONFIG.PRESSURE);
      blit(pressure!.write);
      pressure!.swap();

      // Pressure iterations
      gl.useProgram(pressureProgram);
      gl.uniform2f(pressureUniforms.texelSize, velocity!.texelSizeX, velocity!.texelSizeY);
      gl.uniform1i(pressureUniforms.uDivergence, divergence!.attach(0));
      for (let i = 0; i < CONFIG.PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(pressureUniforms.uPressure, pressure!.read.attach(1));
        blit(pressure!.write);
        pressure!.swap();
      }

      // Gradient subtract
      gl.useProgram(gradientSubtractProgram);
      gl.uniform2f(gradientSubtractUniforms.texelSize, velocity!.texelSizeX, velocity!.texelSizeY);
      gl.uniform1i(gradientSubtractUniforms.uPressure, pressure!.read.attach(0));
      gl.uniform1i(gradientSubtractUniforms.uVelocity, velocity!.read.attach(1));
      blit(velocity!.write);
      velocity!.swap();

      // Advection velocity
      gl.useProgram(advectionProgram);
      gl.uniform2f(advectionUniforms.texelSize, velocity!.texelSizeX, velocity!.texelSizeY);
      if (!supportLinearFiltering) {
        gl.uniform2f(advectionUniforms.dyeTexelSize, velocity!.texelSizeX, velocity!.texelSizeY);
      }
      const velocityId = velocity!.read.attach(0);
      gl.uniform1i(advectionUniforms.uVelocity, velocityId);
      gl.uniform1i(advectionUniforms.uSource, velocityId);
      gl.uniform1f(advectionUniforms.dt, dt);
      gl.uniform1f(advectionUniforms.dissipation, CONFIG.VELOCITY_DISSIPATION);
      blit(velocity!.write);
      velocity!.swap();

      // Advection dye
      if (!supportLinearFiltering) {
        gl.uniform2f(advectionUniforms.dyeTexelSize, dye!.texelSizeX, dye!.texelSizeY);
      }
      gl.uniform1i(advectionUniforms.uVelocity, velocity!.read.attach(0));
      gl.uniform1i(advectionUniforms.uSource, dye!.read.attach(1));
      gl.uniform1f(advectionUniforms.dissipation, CONFIG.DENSITY_DISSIPATION);
      blit(dye!.write);
      dye!.swap();
    };

    // Render function
    const render = () => {
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);
      gl.useProgram(displayProgram);
      if (CONFIG.SHADING) {
        gl.uniform2f(displayUniforms.texelSize, 1.0 / gl.drawingBufferWidth, 1.0 / gl.drawingBufferHeight);
      }
      gl.uniform1i(displayUniforms.uTexture, dye!.read.attach(0));
      blit(null);
    };

    // Scale by pixel ratio
    const scaleByPixelRatio = (input: number) => {
      return Math.floor((window.devicePixelRatio || 1) * input);
    };

    // Resize canvas
    const resizeCanvas = () => {
      const width = scaleByPixelRatio(canvas.clientWidth);
      const height = scaleByPixelRatio(canvas.clientHeight);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        return true;
      }
      return false;
    };

    // Update pointer
    const correctDeltaX = (delta: number) => {
      const aspectRatio = canvas.width / canvas.height;
      if (aspectRatio < 1) delta *= aspectRatio;
      return delta;
    };

    const correctDeltaY = (delta: number) => {
      const aspectRatio = canvas.width / canvas.height;
      if (aspectRatio > 1) delta /= aspectRatio;
      return delta;
    };

    const updatePointerMoveData = (pointer: Pointer, posX: number, posY: number) => {
      pointer.prevTexcoordX = pointer.texcoordX;
      pointer.prevTexcoordY = pointer.texcoordY;
      pointer.texcoordX = posX / canvas.width;
      pointer.texcoordY = 1.0 - posY / canvas.height;
      pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
      pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
      pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
    };

    // Animation loop
    let lastUpdateTime = Date.now();

    const animate = () => {
      const now = Date.now();
      let dt = (now - lastUpdateTime) / 1000;
      dt = Math.min(dt, 0.016666);
      lastUpdateTime = now;

      resizeCanvas();

      // Apply pointer inputs
      const pointers = pointersRef.current;
      pointers.forEach((pointer) => {
        if (pointer.moved) {
          pointer.moved = false;
          const dx = pointer.deltaX * CONFIG.SPLAT_FORCE;
          const dy = pointer.deltaY * CONFIG.SPLAT_FORCE;
          splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
        }
      });

      step(dt);
      render();
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    resizeCanvas();
    animate();

    // Mouse handlers
    const handleMouseMove = (e: MouseEvent) => {
      const pointer = pointersRef.current[0];
      const posX = scaleByPixelRatio(e.clientX);
      const posY = scaleByPixelRatio(e.clientY);
      updatePointerMoveData(pointer, posX, posY);
      pointer.color = generateColor();
    };

    // Touch handlers - БЕЗ preventDefault чтобы не блокировать скролл!
    const handleTouchMove = (e: TouchEvent) => {
      const touches = e.targetTouches;
      if (!touches.length) return;
      // НЕ вызываем preventDefault() - это блокировало скролл!
      const pointer = pointersRef.current[0];
      const posX = scaleByPixelRatio(touches[0].clientX);
      const posY = scaleByPixelRatio(touches[0].clientY);
      updatePointerMoveData(pointer, posX, posY);
      pointer.color = generateColor();
    };

    window.addEventListener('mousemove', handleMouseMove);
    // passive: true позволяет браузеру оптимизировать скролл
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [generateColor, theme, isMobile, isReady]);

  // Не рендерим на мобильных устройствах вообще
  if (isMobile) {
    return null;
  }

  // Не рендерим пока не готов (улучшает TBT)
  if (!isReady) {
    return null;
  }

  // Скрываем canvas если эффект выключен
  return (
    <canvas
      key={`fluid-cursor-canvas-${theme}`}
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full pointer-events-none z-0 transition-opacity duration-500 ${
        isFluidCursorEnabled ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{
        background: 'transparent',
        mixBlendMode: theme === 'light' ? 'multiply' : 'normal',
      }}
    />
  );
};
