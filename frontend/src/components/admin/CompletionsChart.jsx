import React, { useState } from "react";
import { C, sans, mono } from "../../constants/theme";

// Single series: one validated teal for every bar (passes the dark-surface lightness band,
// chroma floor and 3:1 contrast on C.panel); the brighter brand cyan marks the hovered bar.
const BAR = "#26A89B";
const BAR_ACTIVE = C.cyan;
const GRID = C.border;

const PLOT_HEIGHT = 150;
const RANGES = ["7D", "30D", "90D"];
const RANGE_LABEL = { "7D": "last 7 days", "30D": "last 30 days", "90D": "last 90 days" };

const parseDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const fmtDay = (iso) => parseDate(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const fmtWeekday = (iso) => parseDate(iso).toLocaleDateString("en-GB", { weekday: "short" });

/** Round the axis maximum up to a clean number so ticks read 0 / 2 / 4, 0 / 5 / 10, ... */
function niceMax(value) {
  if (value <= 4) return 4;
  const step = Math.pow(10, Math.floor(Math.log10(value)));
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (m * step >= value) return m * step;
  }
  return 10 * step;
}

function bucketLabel(bucket) {
  return bucket.start === bucket.end ? fmtDay(bucket.start) : `${fmtDay(bucket.start)} – ${fmtDay(bucket.end)}`;
}

/** Which x-axis ticks to print: every day for 7D, ~6 evenly spaced for 30D/90D (always the last). */
function showTick(range, i, n) {
  if (range === "7D") return true;
  const every = range === "30D" ? 5 : 3;
  return (n - 1 - i) % every === 0;
}

/**
 * Lab completions over time.
 * series: { "7D": [{start, end, count}], "30D": [...], "90D": [...] } from /admin/dashboard-stats/.
 */
export default function CompletionsChart({ series, totalAllTime = 0 }) {
  const [range, setRange] = useState("30D");
  const [hovered, setHovered] = useState(null);

  const buckets = (series && series[range]) || [];
  const counts = buckets.map((b) => b.count);
  const periodTotal = counts.reduce((a, b) => a + b, 0);
  const peak = Math.max(0, ...counts);
  const peakIndex = peak > 0 ? counts.lastIndexOf(peak) : -1;
  const axisMax = niceMax(peak);
  const ticks = [axisMax, axisMax / 2, 0];
  const active = hovered !== null ? buckets[hovered] : null;

  return (
    <div>
      {/* Header: title, period summary and range selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.hi }}>Lab completions</div>
          <div style={{ fontFamily: sans, fontSize: 12, color: C.mid, marginTop: 3 }}>
            <strong style={{ color: C.hi, fontWeight: 600 }}>{periodTotal}</strong> completed in the {RANGE_LABEL[range]}
            <span style={{ color: C.low }}> · {totalAllTime} all time</span>
          </div>
        </div>
        <div role="group" aria-label="Time range" style={{ display: "flex", gap: 4, background: C.panel2, padding: 3, borderRadius: 7, border: `1px solid ${C.border}` }}>
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={range === r}
              onClick={() => { setRange(r); setHovered(null); }}
              style={{
                fontFamily: mono, fontSize: 11, padding: "4px 9px", borderRadius: 5, cursor: "pointer",
                border: "none",
                color: range === r ? "#1A1200" : C.mid,
                background: range === r ? C.amber : "transparent",
                fontWeight: range === r ? 700 : 500,
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Plot: y-axis ticks + hairline grid + columns */}
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ position: "relative", width: 22, height: PLOT_HEIGHT, flexShrink: 0 }}>
          {ticks.map((t) => (
            <span
              key={t}
              style={{
                position: "absolute", right: 0, top: `${(1 - t / axisMax) * 100}%`, transform: "translateY(-50%)",
                fontFamily: mono, fontSize: 10, color: C.low, fontVariantNumeric: "tabular-nums",
              }}
            >
              {Number.isInteger(t) ? t : t.toFixed(1)}
            </span>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ position: "relative", height: PLOT_HEIGHT }} onMouseLeave={() => setHovered(null)}>
            {ticks.map((t) => (
              <div key={t} style={{ position: "absolute", left: 0, right: 0, top: `${(1 - t / axisMax) * 100}%`, borderTop: `1px solid ${GRID}` }} />
            ))}

            {periodTotal === 0 && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, fontSize: 12.5, color: C.low }}>
                No lab completions in the {RANGE_LABEL[range]}
              </div>
            )}

            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", gap: 2 }}>
              {buckets.map((b, i) => {
                const h = (b.count / axisMax) * 100;
                const isActive = hovered === i;
                return (
                  // Full-height column = hit target bigger than the bar itself
                  <div
                    key={b.start}
                    tabIndex={0}
                    aria-label={`${bucketLabel(b)}: ${b.count} completion${b.count !== 1 ? "s" : ""}`}
                    onMouseEnter={() => setHovered(i)}
                    onFocus={() => setHovered(i)}
                    onBlur={() => setHovered(null)}
                    style={{
                      flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center",
                      position: "relative", cursor: "default", outline: "none",
                      background: isActive ? "rgba(255,255,255,0.03)" : "transparent", borderRadius: 4,
                    }}
                  >
                    {i === peakIndex && (
                      <span style={{ fontFamily: mono, fontSize: 10.5, color: C.hi, marginBottom: 3, fontVariantNumeric: "tabular-nums" }}>{peak}</span>
                    )}
                    {b.count > 0 && (
                      <div
                        style={{
                          width: "100%", maxWidth: 24, height: `${h}%`,
                          background: isActive ? BAR_ACTIVE : BAR,
                          borderRadius: "4px 4px 0 0",
                          transition: "height 0.25s ease, background 0.15s ease",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tooltip */}
            {active && (
              <div
                style={{
                  position: "absolute", top: -6,
                  left: `${((hovered + 0.5) / buckets.length) * 100}%`,
                  transform: `translate(${hovered > buckets.length * 0.66 ? "-100%" : hovered < buckets.length * 0.33 ? "0" : "-50%"}, -100%)`,
                  background: C.panel3, border: `1px solid ${C.borderLight}`, borderRadius: 6, padding: "6px 9px",
                  pointerEvents: "none", whiteSpace: "nowrap", zIndex: 5, boxShadow: "0 6px 18px rgba(0,0,0,0.45)",
                }}
              >
                <div style={{ fontFamily: sans, fontSize: 11, color: C.mid }}>{bucketLabel(active)}</div>
                <div style={{ fontFamily: sans, fontSize: 12.5, color: C.hi, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: BAR }} />
                  {active.count} completion{active.count !== 1 ? "s" : ""}
                </div>
              </div>
            )}
          </div>

          {/* X-axis labels */}
          <div style={{ display: "flex", gap: 2, marginTop: 6, height: 14 }}>
            {buckets.map((b, i) => (
              <div key={b.start} style={{ flex: 1, minWidth: 0, position: "relative" }}>
                {showTick(range, i, buckets.length) && (
                  <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", fontFamily: mono, fontSize: 10, color: C.low, whiteSpace: "nowrap" }}>
                    {range === "7D" ? fmtWeekday(b.start) : fmtDay(b.start)}
                  </span>
                )}
              </div>
            ))}
          </div>
          {range === "90D" && (
            <div style={{ fontFamily: sans, fontSize: 10.5, color: C.low, marginTop: 4 }}>Each bar is one week (labels show the week start).</div>
          )}
        </div>
      </div>

      {/* Table view for screen readers (every value reachable without hover) */}
      <table style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>
        <caption>Lab completions, {RANGE_LABEL[range]}</caption>
        <thead><tr><th>Period</th><th>Completions</th></tr></thead>
        <tbody>
          {buckets.map((b) => (
            <tr key={b.start}><td>{bucketLabel(b)}</td><td>{b.count}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
