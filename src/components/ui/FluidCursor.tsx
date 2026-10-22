'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useFluidCursor, useTheme } from '@/context/AppContext';
import { isMobileDevice } from '@/lib/device';
import {
  baseVertexShader,
  displayShaderSource,
  splatShader,
  advectionShader,
  divergenceShader,
  curlShader,
  vorticityShader,
  pressureShader,
  gradientSubtractShader,
  clearShader,
} from '@/lib/fluidShaders';
import {
  compileShader,
  createProgram,
  getUniforms,
  getSupportedFormat,
  createFBO,
  createDoubleFBO,
  disposeFBO,
  disposeDoubleFBO,
  disposeProgram,
  loseContext,
} from '@/lib/fluidGL';
import { createFluidSim, getResolution } from '@/lib/fluidSim';

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
  DENSITY_DISSIPATION: 5.6,     // Плавное естественное затухание
  VELOCITY_DISSIPATION: 6.5,    // Плавное гашение скорости
  PRESSURE: 0.04,               // Давление жидкости (0.01-0.5)
  PRESSURE_ITERATIONS: 10,      // Итерации давления
  CURL: 1.4,                    // Красивые органичные завихрения

  // ─────────────────────────────────────────────────────────────────────────────
  // ВНЕШНИЙ ВИД КУРСОРА
  // ─────────────────────────────────────────────────────────────────────────────
  SPLAT_RADIUS: 0.075,          // Тонко настроенный размер пятна
  SPLAT_FORCE: 2600,            // Мягкая контролируемая сила движения

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
  COLOR_INTENSITY_DARK: 0.10,   // Насыщенность цвета для тёмной темы

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
  COLOR_INTENSITY_LIGHT: 0.10,  // Насыщенность для светлой темы
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

export const FluidCursor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const pointersRef = useRef<Pointer[]>([]);
  const colorIndexRef = useRef(0);
  const { isFluidCursorEnabled } = useFluidCursor();
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = React.useState(false);
  const [isReady, setIsReady] = React.useState(false);

  // Проверяем мобильное устройство после монтирования.
  // setState в колбэке (а не синхронно в теле эффекта) — без каскадных рендеров.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setIsMobile(isMobileDevice());
    });
    return () => cancelAnimationFrame(id);
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

  // Сбрасываем позицию указателя при переключении эффекта, чтобы избежать скачков и вспышек
  useEffect(() => {
    if (pointersRef.current[0]) {
      pointersRef.current[0].id = -1;
      pointersRef.current[0].moved = false;
      pointersRef.current[0].deltaX = 0;
      pointersRef.current[0].deltaY = 0;
    }
  }, [isFluidCursorEnabled]);

  // Выбираем цвета и интенсивность в зависимости от темы
  const colors = theme === 'light' ? CONFIG.COLORS_LIGHT : CONFIG.COLORS_DARK;
  const colorIntensity = theme === 'light' ? CONFIG.COLOR_INTENSITY_LIGHT : CONFIG.COLOR_INTENSITY_DARK;

  const hexToRgb = useCallback((hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    // The regex has three capture groups; the fallback covers a non-match.
    const [, r = '0', g = '0', b = '0'] = result ?? [];
    return {
      r: parseInt(r, 16) / 255,
      g: parseInt(g, 16) / 255,
      b: parseInt(b, 16) / 255,
    };
  }, []);

  const generateColor = useCallback(() => {
    const c = hexToRgb(colors[colorIndexRef.current % colors.length] ?? '#000000');
    colorIndexRef.current = (colorIndexRef.current + 1) % colors.length;
    return { r: c.r * colorIntensity, g: c.g * colorIntensity, b: c.b * colorIntensity };
  }, [hexToRgb, colors, colorIntensity]);

  // Тема хранится в ref, а не в замыкании эффекта: переключение темы не
  // должно пересоздавать WebGL-контекст, только обновлять uniform и палитру.
  const themeRef = useRef(theme);
  const generateColorRef = useRef(generateColor);
  themeRef.current = theme;
  generateColorRef.current = generateColor;

  useEffect(() => {
    const canvas = canvasRef.current;
    // Полностью отключаем на мобильных, пока не готов или ПОКА ЭФФЕКТ ВЫКЛЮЧЕН —
    // в выключенном состоянии RAF-цикл не запускается совсем (не греем GPU).
    if (!canvas || isMobile || !isReady || !isFluidCursorEnabled) return;

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

    // Determine formats
    let formatRGBA: { internalFormat: number; format: number } | null;
    let formatRG: { internalFormat: number; format: number } | null;
    let formatR: { internalFormat: number; format: number } | null;

    if (isWebGL2) {
      const gl2 = gl as WebGL2RenderingContext;
      formatRGBA = getSupportedFormat(gl, gl2.RGBA16F, gl2.RGBA, halfFloatTexType) ||
                   getSupportedFormat(gl, gl2.RGBA, gl2.RGBA, gl.UNSIGNED_BYTE);
      formatRG = getSupportedFormat(gl, gl2.RG16F, gl2.RG, halfFloatTexType) ||
                 getSupportedFormat(gl, gl2.RGBA16F, gl2.RGBA, halfFloatTexType);
      formatR = getSupportedFormat(gl, gl2.R16F, gl2.RED, halfFloatTexType) ||
                getSupportedFormat(gl, gl2.RGBA16F, gl2.RGBA, halfFloatTexType);
    } else {
      formatRGBA = { internalFormat: gl.RGBA, format: gl.RGBA };
      formatRG = { internalFormat: gl.RGBA, format: gl.RGBA };
      formatR = { internalFormat: gl.RGBA, format: gl.RGBA };
    }

    if (!formatRGBA || !formatRG || !formatR) return;

    // Shaders
    const vs = compileShader(gl, gl.VERTEX_SHADER, baseVertexShader);
    const splatShaderC = compileShader(gl, gl.FRAGMENT_SHADER, splatShader);
    const advectionShaderC = compileShader(
      gl, gl.FRAGMENT_SHADER, advectionShader,
      supportLinearFiltering ? undefined : ['MANUAL_FILTERING']
    );
    const divergenceShaderC = compileShader(gl, gl.FRAGMENT_SHADER, divergenceShader);
    const curlShaderC = compileShader(gl, gl.FRAGMENT_SHADER, curlShader);
    const vorticityShaderC = compileShader(gl, gl.FRAGMENT_SHADER, vorticityShader);
    const pressureShaderC = compileShader(gl, gl.FRAGMENT_SHADER, pressureShader);
    const gradientSubtractShaderC = compileShader(gl, gl.FRAGMENT_SHADER, gradientSubtractShader);
    const clearShaderC = compileShader(gl, gl.FRAGMENT_SHADER, clearShader);

    if (!vs || !splatShaderC || !advectionShaderC ||
        !divergenceShaderC || !curlShaderC || !vorticityShaderC ||
        !pressureShaderC || !gradientSubtractShaderC || !clearShaderC) return;

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
    const clearProgram = createProgram(gl, vs, clearShaderC);
    const splatProgram = createProgram(gl, vs, splatShaderC);
    const advectionProgram = createProgram(gl, vs, advectionShaderC);
    const divergenceProgram = createProgram(gl, vs, divergenceShaderC);
    const curlProgram = createProgram(gl, vs, curlShaderC);
    const vorticityProgram = createProgram(gl, vs, vorticityShaderC);
    const pressureProgram = createProgram(gl, vs, pressureShaderC);
    const gradientSubtractProgram = createProgram(gl, vs, gradientSubtractShaderC);

    // Display program with shading
    // Тема не влияет на набор ключевых слов: LIGHT_THEME заменён на uniform,
    // поэтому переключение темы не требует перекомпиляции шейдера.
    const displayKeywords: string[] = [];
    if (CONFIG.SHADING) displayKeywords.push('SHADING');
    const displayFragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, displayShaderSource, displayKeywords.length > 0 ? displayKeywords : undefined);
    const displayProgram = displayFragmentShader ? createProgram(gl, vs, displayFragmentShader) : null;

    if (!clearProgram || !splatProgram || !advectionProgram ||
        !divergenceProgram || !curlProgram || !vorticityProgram ||
        !pressureProgram || !gradientSubtractProgram || !displayProgram) return;

    // The uniform names below must match the GLSL sources in fluidShaders.ts;
    // the generic parameter makes a typo a compile error.
    const clearUniforms = getUniforms<'uTexture' | 'value'>(gl, clearProgram);
    const splatUniforms = getUniforms<'uTarget' | 'aspectRatio' | 'color' | 'point' | 'radius'>(gl, splatProgram);
    const advectionUniforms = getUniforms<'texelSize' | 'dyeTexelSize' | 'uVelocity' | 'uSource' | 'dt' | 'dissipation'>(gl, advectionProgram);
    const divergenceUniforms = getUniforms<'texelSize' | 'uVelocity'>(gl, divergenceProgram);
    const curlUniforms = getUniforms<'texelSize' | 'uVelocity'>(gl, curlProgram);
    const vorticityUniforms = getUniforms<'texelSize' | 'uVelocity' | 'uCurl' | 'curl' | 'dt'>(gl, vorticityProgram);
    const pressureUniforms = getUniforms<'texelSize' | 'uPressure' | 'uDivergence'>(gl, pressureProgram);
    const gradientSubtractUniforms = getUniforms<'texelSize' | 'uPressure' | 'uVelocity'>(gl, gradientSubtractProgram);
    const displayUniforms = getUniforms<'texelSize' | 'uTexture' | 'uLightTheme'>(gl, displayProgram);

    // Initialize framebuffers
    const filtering = supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    gl.disable(gl.BLEND);

    const simRes = getResolution(gl, CONFIG.SIM_RESOLUTION);
    const dyeRes = getResolution(gl, CONFIG.DYE_RESOLUTION);

    const dye = createDoubleFBO(gl, dyeRes.width, dyeRes.height, formatRGBA.internalFormat, formatRGBA.format, halfFloatTexType, filtering);
    const velocity = createDoubleFBO(gl, simRes.width, simRes.height, formatRG.internalFormat, formatRG.format, halfFloatTexType, filtering);
    const divergence = createFBO(gl, simRes.width, simRes.height, formatR.internalFormat, formatR.format, halfFloatTexType, gl.NEAREST);
    const curl = createFBO(gl, simRes.width, simRes.height, formatR.internalFormat, formatR.format, halfFloatTexType, gl.NEAREST);
    const pressure = createDoubleFBO(gl, simRes.width, simRes.height, formatR.internalFormat, formatR.format, halfFloatTexType, gl.NEAREST);

    if (!dye || !velocity || !divergence || !curl || !pressure) return;

    const sim = createFluidSim({
      gl,
      canvas,
      config: CONFIG,
      programs: {
        clear: clearProgram,
        splat: splatProgram,
        advection: advectionProgram,
        divergence: divergenceProgram,
        curl: curlProgram,
        vorticity: vorticityProgram,
        pressure: pressureProgram,
        gradientSubtract: gradientSubtractProgram,
        display: displayProgram,
      },
      uniforms: {
        clear: clearUniforms,
        splat: splatUniforms,
        advection: advectionUniforms,
        divergence: divergenceUniforms,
        curl: curlUniforms,
        vorticity: vorticityUniforms,
        pressure: pressureUniforms,
        gradientSubtract: gradientSubtractUniforms,
        display: displayUniforms,
      },
      dye,
      velocity,
      divergenceFBO: divergence,
      curlFBO: curl,
      pressureFBO: pressure,
      supportLinearFiltering,
      shading: CONFIG.SHADING,
    });

    // Начальное значение uniform'а темы. Дальше он обновляется из
    // themeRef, поэтому переключение темы не пересоздаёт контекст.
    gl.useProgram(displayProgram);
    gl.uniform1f(displayUniforms.uLightTheme, themeRef.current === 'light' ? 1 : 0);

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
      const newX = posX / canvas.width;
      const newY = 1.0 - posY / canvas.height;

      // При первом движении или после включения — центрируем без огромного выброса
      if (pointer.id === -1) {
        pointer.id = 0;
        pointer.prevTexcoordX = newX;
        pointer.prevTexcoordY = newY;
        pointer.texcoordX = newX;
        pointer.texcoordY = newY;
        pointer.deltaX = 0;
        pointer.deltaY = 0;
        pointer.moved = false;
        return;
      }

      pointer.prevTexcoordX = pointer.texcoordX;
      pointer.prevTexcoordY = pointer.texcoordY;
      pointer.texcoordX = newX;
      pointer.texcoordY = newY;

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
          sim.splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
        }
      });

      sim.step(dt);

      // Тема читается из ref и передаётся uniform'ом на каждом кадре —
      // переключение темы не требует пересборки WebGL-контекста.
      gl.useProgram(displayProgram);
      gl.uniform1f(displayUniforms.uLightTheme, themeRef.current === 'light' ? 1 : 0);

      sim.render();
      animationRef.current = requestAnimationFrame(animate);
    };

    // Mouse handlers
    const handleMouseMove = (e: MouseEvent) => {
      const pointer = pointersRef.current[0];
      if (!pointer) return;
      const posX = scaleByPixelRatio(e.clientX);
      const posY = scaleByPixelRatio(e.clientY);
      updatePointerMoveData(pointer, posX, posY);
      pointer.color = generateColorRef.current();
    };

    // Touch handlers - БЕЗ preventDefault чтобы не блокировать скролл!
    const handleTouchMove = (e: TouchEvent) => {
      const touches = e.targetTouches;
      const touch = touches[0];
      if (!touch) return;
      // НЕ вызываем preventDefault() - это блокировало скролл!
      const pointer = pointersRef.current[0];
      if (!pointer) return;
      const posX = scaleByPixelRatio(touch.clientX);
      const posY = scaleByPixelRatio(touch.clientY);
      updatePointerMoveData(pointer, posX, posY);
      pointer.color = generateColorRef.current();
    };

    window.addEventListener('mousemove', handleMouseMove);
    // passive: true позволяет браузеру оптимизировать скролл
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Start animation
    resizeCanvas();
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);

      // Освобождаем GPU-ресурсы. Без этого текстуры, программы и шейдеры
      // остаются в памяти GPU до тех пор, пока браузер сам не решит их
      // переработать — при каждом пересоздании контекста это утечка.
      disposeDoubleFBO(gl, dye);
      disposeDoubleFBO(gl, velocity);
      disposeDoubleFBO(gl, pressure);
      disposeFBO(gl, divergence);
      disposeFBO(gl, curl);

      disposeProgram(gl, clearProgram, [vs, clearShaderC]);
      disposeProgram(gl, splatProgram, [vs, splatShaderC]);
      disposeProgram(gl, advectionProgram, [vs, advectionShaderC]);
      disposeProgram(gl, divergenceProgram, [vs, divergenceShaderC]);
      disposeProgram(gl, curlProgram, [vs, curlShaderC]);
      disposeProgram(gl, vorticityProgram, [vs, vorticityShaderC]);
      disposeProgram(gl, pressureProgram, [vs, pressureShaderC]);
      disposeProgram(gl, gradientSubtractProgram, [vs, gradientSubtractShaderC]);
      disposeProgram(gl, displayProgram, [vs, displayFragmentShader]);

      gl.deleteBuffer(buffer);
      gl.deleteBuffer(indexBuffer);

      // Контекст отдаём драйверу целиком — иначе он остаётся живым.
      loseContext(gl);
    };
    // Тема и палитра намеренно не в зависимостях: они обновляются через
    // themeRef/generateColorRef, поэтому переключение темы не пересоздаёт
    // WebGL-контекст и не течёт GPU-память.
  }, [isMobile, isReady, isFluidCursorEnabled]);

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
