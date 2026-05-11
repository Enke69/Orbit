"use client";

import { useState, useEffect } from "react";

// Generates a CSS box-shadow string representing scattered stars.
// Each shadow is a point of light at (x, y) — the single pixel element
// that carries the shadow list is the "origin", so all shadows appear
// scattered across the field without any extra DOM nodes.
function makeStars(count: number, maxW = 1920, maxH = 2000): string {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * maxW);
    const y = Math.floor(Math.random() * maxH);
    const a = (Math.random() * 0.55 + 0.2).toFixed(2);
    out.push(`${x}px ${y}px 0 rgba(255,255,255,${a})`);
  }
  return out.join(",");
}

// Fixed asteroid positions — these are stable (not randomised) so they
// look intentional and don't cause hydration issues.
const ASTEROIDS = [
  { top: "11%", left: "6%",  w: 5, h: 3, dur: 44, delay: 0,  rot: 18 },
  { top: "34%", left: "89%", w: 7, h: 4, dur: 61, delay: 9,  rot: -22 },
  { top: "67%", left: "13%", w: 4, h: 3, dur: 37, delay: 5,  rot: 43 },
  { top: "78%", left: "74%", w: 6, h: 3, dur: 53, delay: 14, rot: -9 },
  { top: "21%", left: "53%", w: 4, h: 3, dur: 41, delay: 7,  rot: 29 },
  { top: "55%", left: "40%", w: 3, h: 2, dur: 48, delay: 20, rot: -40 },
];

const STYLES = `
  @keyframes orbit-star-drift {
    from { transform: translateY(0px);      }
    to   { transform: translateY(-2000px);  }
  }
  @keyframes orbit-star-twinkle {
    0%, 100% { opacity: 0.9; }
    50%       { opacity: 0.2; }
  }
  @keyframes orbit-asteroid {
    0%,  100% { transform: translate(0px,   0px)   rotate(var(--rot)); }
    25%        { transform: translate(7px,  -12px)  rotate(calc(var(--rot) + 4deg)); }
    50%        { transform: translate(-5px, -6px)   rotate(calc(var(--rot) + 2deg)); }
    75%        { transform: translate(4px,   9px)   rotate(calc(var(--rot) - 4deg)); }
  }
  @media (prefers-reduced-motion: reduce) {
    .orbit-star-layer,
    .orbit-asteroid-rock { animation: none !important; }
  }
`;

export function StarBackground() {
  const [shadows, setShadows] = useState<{ sm: string; md: string; lg: string } | null>(null);

  // Generate on client only — avoids SSR/hydration mismatch from Math.random()
  useEffect(() => {
    setShadows({
      sm: makeStars(180),       // tiny 1 px stars — most numerous
      md: makeStars(60),        // 2 px stars — mid-layer
      lg: makeStars(25),        // 3 px stars — brightest, also twinkle
    });
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* Fixed layer — sits behind everything, pointer-events disabled */}
      <div
        aria-hidden="true"
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ zIndex: 0 }}
      >
        {/* ── Drifting star layers ────────────────────────────────────────── */}
        {shadows && (
          <>
            {/* Small stars — panel A */}
            <div
              className="orbit-star-layer absolute"
              style={{
                top: 0, width: 1, height: 1,
                borderRadius: "50%",
                boxShadow: shadows.sm,
                animation: "orbit-star-drift 220s linear infinite",
              }}
            />
            {/* Small stars — panel B (seamless loop offset) */}
            <div
              className="orbit-star-layer absolute"
              style={{
                top: "2000px", width: 1, height: 1,
                borderRadius: "50%",
                boxShadow: shadows.sm,
                animation: "orbit-star-drift 220s linear infinite",
              }}
            />

            {/* Medium stars — panel A */}
            <div
              className="orbit-star-layer absolute"
              style={{
                top: 0, width: 2, height: 2,
                borderRadius: "50%",
                boxShadow: shadows.md,
                animation: "orbit-star-drift 150s linear infinite",
              }}
            />
            {/* Medium stars — panel B */}
            <div
              className="orbit-star-layer absolute"
              style={{
                top: "2000px", width: 2, height: 2,
                borderRadius: "50%",
                boxShadow: shadows.md,
                animation: "orbit-star-drift 150s linear infinite",
              }}
            />

            {/* Large stars — drift + twinkle */}
            <div
              className="orbit-star-layer absolute"
              style={{
                top: 0, width: 3, height: 3,
                borderRadius: "50%",
                boxShadow: shadows.lg,
                animation: "orbit-star-drift 100s linear infinite, orbit-star-twinkle 5s ease-in-out infinite",
              }}
            />
            <div
              className="orbit-star-layer absolute"
              style={{
                top: "2000px", width: 3, height: 3,
                borderRadius: "50%",
                boxShadow: shadows.lg,
                animation: "orbit-star-drift 100s linear infinite, orbit-star-twinkle 5s ease-in-out infinite",
              }}
            />
          </>
        )}

        {/* ── Floating asteroids ──────────────────────────────────────────── */}
        {ASTEROIDS.map((a, i) => (
          <div
            key={i}
            className="orbit-asteroid-rock absolute"
            style={{
              top: a.top,
              left: a.left,
              width: a.w,
              height: a.h,
              borderRadius: "50% / 40%",
              background:
                "radial-gradient(ellipse at 35% 35%, rgba(210,190,165,0.45) 0%, rgba(150,135,115,0.15) 70%, transparent 100%)",
              boxShadow: "0 0 4px rgba(210,190,165,0.12), inset 0 0 2px rgba(255,255,255,0.08)",
              ["--rot" as string]: `${a.rot}deg`,
              transform: `rotate(${a.rot}deg)`,
              animation: `orbit-asteroid ${a.dur}s ease-in-out infinite`,
              animationDelay: `${a.delay}s`,
            }}
          />
        ))}

        {/* ── Nebula glow orbs (static, cheap radial-gradient) ───────────── */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 40% 30% at 15% 25%, rgba(124,58,237,0.07) 0%, transparent 100%),
              radial-gradient(ellipse 35% 25% at 82% 18%, rgba(59,130,246,0.06) 0%, transparent 100%),
              radial-gradient(ellipse 30% 25% at 58% 78%, rgba(6,182,212,0.05) 0%, transparent 100%),
              radial-gradient(ellipse 25% 20% at 90% 70%, rgba(124,58,237,0.04) 0%, transparent 100%)
            `,
          }}
        />
      </div>
    </>
  );
}
