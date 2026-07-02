"use client";

// Decorative cosmic objects for page heroes. Pure CSS/SVG, no images.
// Everything is aria-hidden and pointer-events-none — visual garnish only.

const STYLES = `
  @keyframes cosmic-planet-float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-14px); }
  }
  @keyframes cosmic-moon-orbit {
    from { transform: rotate(0deg)   translateX(74px) rotate(0deg); }
    to   { transform: rotate(360deg) translateX(74px) rotate(-360deg); }
  }
  @keyframes cosmic-constellation-twinkle {
    0%, 100% { opacity: 0.9; }
    50%       { opacity: 0.3; }
  }
  @media (prefers-reduced-motion: reduce) {
    .cosmic-planet-wrap,
    .cosmic-moon,
    .cosmic-constellation-star { animation: none !important; }
  }
`;

// Saturn-style ringed planet with a small orbiting moon
export function RingedPlanet({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden="true">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div
        className="cosmic-planet-wrap"
        style={{ position: "relative", width: 96, height: 96, animation: "cosmic-planet-float 9s ease-in-out infinite" }}
      >
        {/* Sphere */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 32% 30%, #a78bfa 0%, #7c3aed 38%, #2d1b69 72%, #12102e 100%)",
            boxShadow:
              "inset -14px -12px 26px rgba(0,0,0,0.55), 0 0 36px rgba(124,58,237,0.3)",
          }}
        />
        {/* Surface bands */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            overflow: "hidden",
            opacity: 0.35,
            background:
              "repeating-linear-gradient(-12deg, transparent 0px, transparent 12px, rgba(196,181,253,0.25) 13px, transparent 15px)",
          }}
        />
        {/* Ring */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 172,
            height: 52,
            transform: "translate(-50%, -50%) rotate(-18deg)",
            borderRadius: "50%",
            border: "2px solid rgba(167,139,250,0.45)",
            borderTopColor: "rgba(167,139,250,0.1)",
            boxShadow: "0 0 14px rgba(124,58,237,0.18)",
          }}
        />
        {/* Orbiting moon */}
        <div
          className="cosmic-moon"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 9,
            height: 9,
            margin: "-4.5px 0 0 -4.5px",
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, #e2e8f0 0%, #94a3b8 70%)",
            boxShadow: "0 0 6px rgba(226,232,240,0.4)",
            animation: "cosmic-moon-orbit 16s linear infinite",
          }}
        />
      </div>
    </div>
  );
}

// Долоон бурхан (the "Seven Gods" — the Big Dipper), an important
// constellation in Mongolian tradition. Dots twinkle with staggered delays.
const DIPPER_STARS: [number, number][] = [
  [18, 22],  // Dubhe
  [24, 56],  // Merak
  [60, 62],  // Phecda
  [70, 30],  // Megrez
  [102, 38], // Alioth
  [132, 50], // Mizar
  [166, 72], // Alkaid
];

const DIPPER_LINES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 0], // bowl
  [3, 4], [4, 5], [5, 6],          // handle
];

export function Constellation({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden="true">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <svg width="184" height="92" viewBox="0 0 184 92" fill="none">
        {DIPPER_LINES.map(([a, b], i) => (
          <line
            key={`l${i}`}
            x1={DIPPER_STARS[a][0]}
            y1={DIPPER_STARS[a][1]}
            x2={DIPPER_STARS[b][0]}
            y2={DIPPER_STARS[b][1]}
            stroke="rgba(167,139,250,0.28)"
            strokeWidth="1"
          />
        ))}
        {DIPPER_STARS.map(([x, y], i) => (
          <circle
            key={`c${i}`}
            className="cosmic-constellation-star"
            cx={x}
            cy={y}
            r={i === 0 || i === 6 ? 2.4 : 1.8}
            fill="rgba(248,250,252,0.85)"
            style={{
              animation: `cosmic-constellation-twinkle ${3.5 + i * 0.7}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </svg>
    </div>
  );
}
