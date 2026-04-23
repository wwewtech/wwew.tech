'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/AppContext';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface ProjectedPoint {
  x: number;
  y: number;
  z: number;
  size: number;
}

// Определение мобильного устройства
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || window.matchMedia('(max-width: 768px)').matches
    || 'ontouchstart' in window;
};

export const InteractiveBlob = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const { theme } = useTheme();
  
  const rotationRef = useRef({ x: 0.3, y: 0.5 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);
  const pointsRef = useRef<Point3D[]>([]);
  const morphRef = useRef(0.3);
  const isVisibleRef = useRef(true);
  const animationIdRef = useRef<number>(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe client detection
    setIsMobile(isMobileDevice());
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);
  
  // Generate optimized points - меньше на мобильных
  const generatePoints = useCallback(() => {
    const points: Point3D[] = [];
    // На мобильных используем меньше точек
    const detail = isMobile ? 6 : 10;
    
    for (let i = 0; i <= detail; i++) {
      for (let j = 0; j <= detail; j++) {
        const u = (i / detail) * Math.PI * 2;
        const v = (j / detail) * Math.PI;
        
        points.push({
          x: Math.sin(v) * Math.cos(u),
          y: Math.sin(v) * Math.sin(u),
          z: Math.cos(v)
        });
      }
    }
    
    // Add spiral - меньше шагов на мобильных
    const spiralStep = isMobile ? 0.6 : 0.4;
    for (let t = 0; t < Math.PI * 4; t += spiralStep) {
      const r = 0.3 + t * 0.1;
      points.push({
        x: Math.cos(t) * r * 0.4,
        y: Math.sin(t) * r * 0.4,
        z: (t / (Math.PI * 4)) * 2 - 1
      });
    }
    
    return points;
  }, [isMobile]);

  // Simple morph
  const morphPoint = useCallback((point: Point3D, time: number, morph: number): Point3D => {
    const noise = Math.sin(point.x * 3 + time) * Math.cos(point.y * 3 + time * 1.3) * 0.15;
    const scale = 1 + noise * morph;
    return { x: point.x * scale, y: point.y * scale, z: point.z * scale };
  }, []);

  // Rotate
  const rotatePoint = useCallback((point: Point3D, rx: number, ry: number): Point3D => {
    const x = point.x * Math.cos(ry) - point.z * Math.sin(ry);
    let z = point.x * Math.sin(ry) + point.z * Math.cos(ry);
    const y = point.y * Math.cos(rx) - z * Math.sin(rx);
    z = point.y * Math.sin(rx) + z * Math.cos(rx);
    return { x, y, z };
  }, []);

  // Project
  const project = useCallback((point: Point3D, width: number, height: number): ProjectedPoint => {
    const scale = 300 / (3 - point.z);
    return {
      x: point.x * scale + width / 2,
      y: point.y * scale + height / 2,
      z: point.z,
      size: Math.max(1.5, (1 + point.z) * 2)
    };
  }, []);

  useEffect(() => {
    pointsRef.current = generatePoints();
  }, [generatePoints, isMobile]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    // Не запускаем пока не готов
    if (!canvas || !container || !isReady) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Intersection Observer for performance
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    observer.observe(container);

    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      // Ограничиваем DPR для мобильных
      const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      animationIdRef.current = requestAnimationFrame(render);
      
      if (!isVisibleRef.current || width === 0) return;

      const baseColor = theme === 'dark' ? '255,255,255' : '23,23,23';
      
      ctx.clearRect(0, 0, width, height);
      
      timeRef.current += 0.01;
      
      // Smooth morph
      const targetMorph = isHovered ? 1 : 0.3;
      morphRef.current += (targetMorph - morphRef.current) * 0.08;
      
      // Auto rotation with momentum
      if (!isDragging) {
        velocityRef.current.x *= 0.95;
        velocityRef.current.y *= 0.95;
        rotationRef.current.x += velocityRef.current.x + 0.002;
        rotationRef.current.y += velocityRef.current.y + 0.003;
      }
      
      // Transform points
      const projected: ProjectedPoint[] = [];
      const points = pointsRef.current;
      const rx = rotationRef.current.x;
      const ry = rotationRef.current.y;
      const time = timeRef.current;
      const morph = morphRef.current;
      
      for (let i = 0; i < points.length; i++) {
        const morphed = morphPoint(points[i], time, morph);
        const rotated = rotatePoint(morphed, rx, ry);
        projected.push(project(rotated, width, height));
      }
      
      // Sort by z
      projected.sort((a, b) => a.z - b.z);
      
      // Draw connections - simplified
      ctx.lineWidth = 0.5;
      const len = projected.length;
      
      for (let i = 0; i < len; i += 2) {
        const p1 = projected[i];
        for (let j = i + 1; j < Math.min(i + 6, len); j++) {
          const p2 = projected[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = dx * dx + dy * dy;
          if (dist < 1600) { // 40^2
            const alpha = (1 - dist / 1600) * 0.12;
            ctx.strokeStyle = `rgba(${baseColor},${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      
      // Draw points - no gradients, simple circles
      for (let i = 0; i < len; i++) {
        const p = projected[i];
        const alpha = 0.3 + (p.z + 1) * 0.35;
        ctx.fillStyle = `rgba(${baseColor},${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Single center glow
      ctx.fillStyle = `rgba(${baseColor},${0.03 + morph * 0.02})`;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 100, 0, Math.PI * 2);
      ctx.fill();
    };

    render();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationIdRef.current);
    };
  }, [isDragging, isHovered, morphPoint, rotatePoint, project, theme, isReady, isMobile]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    
    rotationRef.current.y += dx * 0.005;
    rotationRef.current.x += dy * 0.005;
    velocityRef.current.x = dy * 0.002;
    velocityRef.current.y = dx * 0.002;
    
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  }, [isDragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  return (
    <motion.div
      ref={containerRef}
      className="relative aspect-square max-w-md mx-auto cursor-grab active:cursor-grabbing select-none"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => setIsDragging(false)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
      
      <motion.div
        className="absolute inset-12 rounded-full border border-(--border) opacity-20 pointer-events-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
  );
};
