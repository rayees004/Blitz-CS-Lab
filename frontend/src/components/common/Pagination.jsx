import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { C, sans, mono } from "../../constants/theme";

export const PAGE_SIZE = 20;

/** Page numbers to show: first, last, current ±1, with "…" gaps. */
function pageList(page, totalPages) {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

/**
 * Pagination bar for server-paginated lists.
 * Pass the `meta` returned by the API ({ count, page, page_size, total_pages }) and onPageChange.
 */
export default function Pagination({ meta, onPageChange, loading = false, style }) {
  if (!meta || !meta.count) return null;

  const page = meta.page || 1;
  const pageSize = meta.page_size || PAGE_SIZE;
  const totalPages = meta.total_pages || 1;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, meta.count);

  const btn = (active, disabled) => ({
    minWidth: 32,
    height: 32,
    padding: "0 10px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 6,
    border: `1px solid ${active ? C.amber : C.border}`,
    background: active ? "rgba(245, 166, 35, 0.15)" : C.panel2,
    color: disabled ? C.low : active ? C.amber : C.hi,
    fontFamily: sans,
    fontSize: 12.5,
    fontWeight: active ? 700 : 500,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  });

  const go = (p) => {
    if (loading || p < 1 || p > totalPages || p === page) return;
    onPageChange(p);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
        marginTop: 16,
        ...style,
      }}
    >
      <span style={{ fontFamily: mono, fontSize: 11.5, color: C.mid }}>
        Showing {from}–{to} of {meta.count}
      </span>

      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <button type="button" style={btn(false, page <= 1 || loading)} disabled={page <= 1 || loading} onClick={() => go(page - 1)}>
            <ChevronLeft size={14} /> Previous
          </button>
          {pageList(page, totalPages).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} style={{ color: C.low, fontFamily: mono, padding: "0 2px" }}>…</span>
            ) : (
              <button key={p} type="button" style={btn(p === page, loading)} disabled={loading} onClick={() => go(p)}>
                {p}
              </button>
            )
          )}
          <button type="button" style={btn(false, page >= totalPages || loading)} disabled={page >= totalPages || loading} onClick={() => go(page + 1)}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
