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

// Deterministic positions (no Math.random at render) — stable across SSR/CSR
const GLOW_STARS = [
  { top: "14%", left: "22%", size: 2, dur: 4.2, delay: 0.0 },
  { top: "27%", left: "71%", size: 3, dur: 5.6, delay: 1.3 },
  { top: "44%", left: "9%",  size: 2, dur: 3.8, delay: 2.1 },
  { top: "58%", left: "84%", size: 2, dur: 6.4, delay: 0.7 },
  { top: "71%", left: "31%", size: 3, dur: 4.9, delay: 3.4 },
  { top: "83%", left: "62%", size: 2, dur: 5.2, delay: 1.9 },
  { top: "8%",  left: "48%", size: 2, dur: 4.5, delay: 2.8 },
  { top: "37%", left: "43%", size: 2, dur: 6.1, delay: 4.2 },
];

// Shooting stars streak once per cycle (long invisible pause, brief streak)
const SHOOTING_STARS = [
  { top: "10%", left: "12%", dur: 14, delay: 3 },
  { top: "34%", left: "52%", dur: 23, delay: 9 },
  { top: "5%",  left: "68%", dur: 31, delay: 17 },
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
  @keyframes orbit-glow-twinkle {
    0%, 100% { opacity: 0.85; transform: scale(1); }
    50%       { opacity: 0.25; transform: scale(0.8); }
  }
  @keyframes orbit-shooting {
    0%, 90%  { opacity: 0; transform: translate3d(0, 0, 0) rotate(29deg); }
    92%       { opacity: 1; }
    100%      { opacity: 0; transform: translate3d(46vw, 25vw, 0) rotate(29deg); }
  }
  @keyframes orbit-nebula-breathe {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.55; }
  }
  @media (prefers-reduced-motion: reduce) {
    .orbit-star-layer,
    .orbit-asteroid-rock,
    .orbit-glow-star,
    .orbit-nebula { animation: none !important; }
    .orbit-shooting-star { display: none !important; }
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

        {/* ── Bright glow stars — independent staggered twinkle ──────────── */}
        {GLOW_STARS.map((s, i) => (
          <div
            key={`g${i}`}
            className="orbit-glow-star absolute"
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.95)",
              boxShadow: "0 0 6px 1px rgba(196,181,253,0.55)",
              animation: `orbit-glow-twinkle ${s.dur}s ease-in-out infinite`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}

        {/* ── Shooting stars — brief streak, long pause ──────────────────── */}
        {SHOOTING_STARS.map((s, i) => (
          <div
            key={`s${i}`}
            className="orbit-shooting-star absolute"
            style={{
              top: s.top,
              left: s.left,
              width: 110,
              height: 2,
              borderRadius: 999,
              opacity: 0,
              // Bright head on the leading (right) edge, tail fading left
              background:
                "linear-gradient(to left, rgba(255,255,255,0.9), rgba(167,139,250,0.35) 35%, transparent 80%)",
              animation: `orbit-shooting ${s.dur}s linear infinite`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}

        {/* ── Distant ringed planet (far background) ─────────────────────── */}
        <div className="absolute" style={{ top: "62%", left: "7%", opacity: 0.5 }}>
          <div
            style={{
              position: "relative",
              width: 22,
              height: 22,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 35% 32%, rgba(147,197,253,0.7) 0%, rgba(29,78,216,0.5) 55%, rgba(13,13,43,0.9) 100%)",
              boxShadow: "0 0 10px rgba(59,130,246,0.25)",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 40,
                height: 12,
                transform: "translate(-50%, -50%) rotate(-24deg)",
                borderRadius: "50%",
                border: "1px solid rgba(147,197,253,0.35)",
              }}
            />
          </div>
        </div>

        {/* ── Nebula glow orbs (slow breathing radial-gradient) ──────────── */}
        <div
          className="orbit-nebula absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 40% 30% at 15% 25%, rgba(124,58,237,0.07) 0%, transparent 100%),
              radial-gradient(ellipse 35% 25% at 82% 18%, rgba(59,130,246,0.06) 0%, transparent 100%),
              radial-gradient(ellipse 30% 25% at 58% 78%, rgba(6,182,212,0.05) 0%, transparent 100%),
              radial-gradient(ellipse 25% 20% at 90% 70%, rgba(124,58,237,0.04) 0%, transparent 100%)
            `,
            animation: "orbit-nebula-breathe 45s ease-in-out infinite",
          }}
        />
      </div>
    </>
  );
}
