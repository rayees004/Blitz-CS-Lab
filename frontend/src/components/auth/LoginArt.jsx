import React, { useId } from "react";

// Hero illustration for the login screen: glowing shield + padlock wrapped in
// an orbit ring. Purely decorative.

const SHIELD =
  "M240 26C268 44 308 58 360 62C362 70 362 150 360 172C352 240 304 286 240 314C176 286 128 240 120 172C118 150 118 70 120 62C172 58 212 44 240 26Z";
const SHIELD_INNER =
  "M240 55C262 69 294 80 336 84C338 90 338 154 336 172C330 226 291 263 240 285C189 263 150 226 144 172C142 154 142 90 144 84C186 80 218 69 240 55Z";

const RING = { cx: 240, cy: 182, rx: 222, ry: 56, tilt: "rotate(-10 240 182)" };

const SPARKS = [
  [64, 118, 1.6, 0.7], [420, 86, 2, 0.8], [402, 262, 1.4, 0.6], [54, 330, 1.8, 0.5],
  [444, 344, 1.3, 0.5], [108, 52, 1.2, 0.6], [318, 18, 1.4, 0.55], [24, 214, 1.1, 0.45],
  [456, 196, 1.2, 0.5],
];

export default function LoginArt({ className }) {
  const uid = useId().replace(/:/g, "");
  const id = (name) => `${uid}-${name}`;
  const url = (name) => `url(#${id(name)})`;

  const ringEllipse = (props) => (
    <ellipse cx={RING.cx} cy={RING.cy} rx={RING.rx} ry={RING.ry} fill="none" {...props} />
  );

  return (
    <svg className={className} viewBox="0 0 480 370" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={id("halo")} cx="0.5" cy="0.4" r="0.5">
          <stop offset="0" stopColor="#2f6bff" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#1d3fd6" stopOpacity="0.22" />
          <stop offset="1" stopColor="#1d3fd6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("shieldStroke")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d4e8ff" />
          <stop offset="0.45" stopColor="#5b9bff" />
          <stop offset="1" stopColor="#2a5cff" />
        </linearGradient>
        <linearGradient id={id("shieldFill")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a86ff" stopOpacity="0.4" />
          <stop offset="1" stopColor="#1b36c4" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id={id("shieldInner")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fb0ff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#2a52e0" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id={id("lockBody")} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#eef5ff" />
          <stop offset="0.45" stopColor="#93bbff" />
          <stop offset="1" stopColor="#3a6af0" />
        </linearGradient>
        <linearGradient id={id("lockShackle")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2f7ff" />
          <stop offset="1" stopColor="#7aa7ff" />
        </linearGradient>
        <linearGradient id={id("ring")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3b82f6" stopOpacity="0.25" />
          <stop offset="0.5" stopColor="#b9e2ff" />
          <stop offset="1" stopColor="#3b82f6" stopOpacity="0.25" />
        </linearGradient>
        <filter id={id("glow")} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={id("softGlow")} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        {/* Clip regions live in the ring's tilted space: back half above its centre, front half below */}
        <clipPath id={id("ringBack")}>
          <rect x="0" y="0" width="480" height={RING.cy} />
        </clipPath>
        <clipPath id={id("ringFront")}>
          <rect x="0" y={RING.cy} width="480" height="200" />
        </clipPath>
      </defs>

      <circle cx="240" cy="180" r="230" fill={url("halo")} />

      {/* Ring (back half), shield and lock float together */}
      <g className="lg-art-float">
        <g transform={RING.tilt}>
          {ringEllipse({ stroke: url("ring"), strokeWidth: 2, strokeOpacity: 0.45, clipPath: url("ringBack") })}
        </g>

        <path d={SHIELD} fill="none" stroke="#3b82f6" strokeWidth="16" strokeOpacity="0.5" filter={url("softGlow")} />
        <path d={SHIELD} fill={url("shieldFill")} stroke={url("shieldStroke")} strokeWidth="4" strokeLinejoin="round" />
        <path d={SHIELD_INNER} fill={url("shieldInner")} stroke="#a7c8ff" strokeOpacity="0.55" strokeWidth="2" strokeLinejoin="round" />

        <g filter={url("glow")}>
          <path d="M210 150V124a30 30 0 0 1 60 0v26" fill="none" stroke={url("lockShackle")} strokeWidth="12" strokeLinecap="round" />
          <rect x="186" y="140" width="108" height="90" rx="18" fill={url("lockBody")} />
        </g>
        <rect x="194" y="146" width="92" height="10" rx="5" fill="#ffffff" fillOpacity="0.35" />
        <circle cx="240" cy="177" r="11" fill="#0b1650" />
        <path d="M234 184h12l-3 22q-3 3-6 0Z" fill="#0b1650" />
      </g>

      {/* Ring (front half) with a light travelling along it */}
      <g className="lg-art-float">
        <g transform={RING.tilt} filter={url("glow")}>
          {ringEllipse({ stroke: url("ring"), strokeWidth: 2.6, clipPath: url("ringFront") })}
          {ringEllipse({
            className: "lg-art-comet",
            stroke: "#e6f4ff",
            strokeWidth: 3.4,
            strokeLinecap: "round",
            pathLength: 100,
            strokeDasharray: "6 94",
            clipPath: url("ringFront"),
          })}
        </g>
      </g>

      {SPARKS.map(([cx, cy, r, o]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="#9cc8ff" fillOpacity={o} />
      ))}
    </svg>
  );
}
