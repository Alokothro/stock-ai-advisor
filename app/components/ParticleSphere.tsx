'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface Particle {
  theta: number;
  phi: number;
  radiusJitter: number;
  speed: number;
  size: number;
  shade: number;
  driftSpeedTheta: number;
  driftSpeedPhi: number;
  noisePhaseA: number;
  noisePhaseB: number;
  noiseFreqA: number;
  noiseFreqB: number;
  noiseAmp: number;
}

const BRONZE_SHADES = [
  [205, 127, 50],
  [184, 115, 51],
  [230, 170, 100],
  [160, 95, 40],
  [222, 184, 135],
];

const EXPLODE_CLICK_THRESHOLD = 5;
const EXPLODE_CLICK_WINDOW_MS = 1200;
const EXPLODE_DURATION_MS = 1800;

export default function ParticleSphere({ size = 260 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clickTimestamps = useRef<number[]>([]);
  const [exploding, setExploding] = useState(false);
  const [explodeOrigin, setExplodeOrigin] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const particleCount = 900;
    const baseRadius = size * 0.32;

    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      theta: Math.random() * Math.PI * 2,
      phi: Math.acos(2 * Math.random() - 1),
      radiusJitter: 0.8 + Math.random() * 0.35,
      speed: 0.0015 + Math.random() * 0.003,
      size: Math.random() * 1.6 + 0.4,
      shade: Math.floor(Math.random() * BRONZE_SHADES.length),
      driftSpeedTheta: (Math.random() - 0.5) * 0.012,
      driftSpeedPhi: (Math.random() - 0.5) * 0.006,
      noisePhaseA: Math.random() * Math.PI * 2,
      noisePhaseB: Math.random() * Math.PI * 2,
      noiseFreqA: 0.5 + Math.random() * 1.5,
      noiseFreqB: 0.3 + Math.random() * 1.2,
      noiseAmp: 0.15 + Math.random() * 0.25,
    }));

    let rotation = 0;
    let t = 0;
    let rafId: number;

    const render = () => {
      ctx.clearRect(0, 0, size, size);
      rotation += 0.0015;
      t += 0.016;

      const cx = size / 2;
      const cy = size / 2;

      const projected = particles.map((p) => {
        // Each particle independently drifts across the sphere surface
        const theta = p.theta + rotation + t * p.driftSpeedTheta * 20 +
          Math.sin(t * p.noiseFreqA + p.noisePhaseA) * p.noiseAmp;
        const phi = p.phi + t * p.driftSpeedPhi * 10 +
          Math.cos(t * p.noiseFreqB + p.noisePhaseB) * p.noiseAmp * 0.5;

        const radialPulse = 1 + Math.sin(t * p.noiseFreqA * 0.8 + p.noisePhaseB) * 0.12;
        const r = baseRadius * p.radiusJitter * radialPulse;

        const clampedPhi = Math.max(0.001, Math.min(Math.PI - 0.001, phi));
        const x = r * Math.sin(clampedPhi) * Math.cos(theta);
        const y = r * Math.cos(clampedPhi);
        const z = r * Math.sin(clampedPhi) * Math.sin(theta);

        const perspective = 300 / (300 + z);
        return {
          x: cx + x * perspective,
          y: cy + y * perspective,
          scale: perspective,
          z,
          size: p.size,
          shade: p.shade,
        };
      });

      projected.sort((a, b) => a.z - b.z);

      for (const pt of projected) {
        const depth = (pt.z + baseRadius) / (baseRadius * 2);
        const alpha = 0.25 + depth * 0.65;
        const [r, g, b] = BRONZE_SHADES[pt.shade];
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(0.4, pt.size * pt.scale), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fill();
      }

      rafId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(rafId);
  }, [size]);

  const handleClick = useCallback(() => {
    const now = Date.now();
    clickTimestamps.current = clickTimestamps.current.filter((ts) => now - ts < EXPLODE_CLICK_WINDOW_MS);
    clickTimestamps.current.push(now);

    if (clickTimestamps.current.length >= EXPLODE_CLICK_THRESHOLD) {
      clickTimestamps.current = [];
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setExplodeOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }
      setExploding(true);
      setTimeout(() => setExploding(false), EXPLODE_DURATION_MS);
    }
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{ width: size, height: size, cursor: 'pointer' }}
        className="mx-auto"
      />
      {exploding && <ExplosionOverlay origin={explodeOrigin} />}
    </>
  );
}

interface ExplodingParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  shade: number;
  rotationSpeed: number;
}

function ExplosionOverlay({ origin }: { origin: { x: number; y: number } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const particleCount = 1400;
    const particles: ExplodingParticle[] = Array.from({ length: particleCount }, () => {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 4 + Math.random() * 22;
      return {
        x: origin.x,
        y: origin.y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        size: Math.random() * 3 + 0.8,
        shade: Math.floor(Math.random() * BRONZE_SHADES.length),
        rotationSpeed: (Math.random() - 0.5) * 0.2,
      };
    });

    let startTime: number | null = null;
    let rafId: number;

    const render = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / EXPLODE_DURATION_MS);

      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.vx *= 0.985; // drag

        const alpha = Math.max(0, 1 - progress * 1.1);
        const [r, g, b] = BRONZE_SHADES[p.shade];
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.3, p.size * (1 - progress * 0.3)), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fill();
      }

      if (progress < 1) {
        rafId = requestAnimationFrame(render);
      }
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [origin]);

  return createPortal(
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />,
    document.body
  );
}
