import React, { useId } from "react";

// Blitz Academy "VA" mark, traced from public/blitz-academy-logo.png so it stays
// crisp at any size and sits cleanly on dark backgrounds (the PNG has a white fringe).
export const MARK_VIEWBOX = "0 12 124 100";
export const MARK_PATHS = {
  white: "M3 15H11.5L37 77 53 30H32L26.5 17H54L67 31 47 88H27Z",
  gold: "M46 108 79 18.5H97Q101.5 18.5 103.5 22.5L118 54Q120 58.5 120 63V78Q120 88 110 88H83L88 75H106V62L90 29 60 108Z",
};

export default function BlitzMark({ size = 40, className, title }) {
  const uid = useId().replace(/:/g, "");
  const white = `${uid}-white`;
  const gold = `${uid}-gold`;

  return (
    <svg
      className={className}
      width={Math.round(size * 1.24)}
      height={size}
      viewBox={MARK_VIEWBOX}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <defs>
        <linearGradient id={white} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#efedff" />
          <stop offset="1" stopColor="#b8b2ff" />
        </linearGradient>
        <linearGradient id={gold} x1="1" y1="0" x2="0.1" y2="1">
          <stop offset="0" stopColor="#ffd95c" />
          <stop offset="0.55" stopColor="#fbb12a" />
          <stop offset="1" stopColor="#f08a16" />
        </linearGradient>
      </defs>
      <path fill={`url(#${white})`} d={MARK_PATHS.white} />
      <path fill={`url(#${gold})`} d={MARK_PATHS.gold} />
    </svg>
  );
}
