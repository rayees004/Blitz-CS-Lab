import React, { useState } from "react";
import { Search, Filter } from "lucide-react";
import LabCard from "./LabCard";
import Btn from "../common/Btn";
import { C, sans, mono } from "../../constants/theme";
import { LABS } from "../../data/mockData";

export default function LabExplorer({ go }) {
  const [cat, setCat] = useState("All");
  const cats = ["All", ...new Set(LABS.map((l) => l.cat))];
  const filtered = cat === "All" ? LABS : LABS.filter((l) => l.cat === cat);

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: 0 }}>Lab Explorer</h1>
          <p style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, marginTop: 6 }}>
            50 isolated environments across 9 security domains. Showing 12 of 50.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: C.panel2,
            border: `1px solid ${C.border}`,
            borderRadius: 7,
            padding: "8px 12px",
            width: 280,
          }}
        >
          <Search size={14} color={C.low} />
          <span style={{ fontFamily: mono, fontSize: 12.5, color: C.low }}>Search labs...</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
        {cats.map((c) => (
          <div
            key={c}
            onClick={() => setCat(c)}
            style={{
              fontFamily: sans,
              fontSize: 12.5,
              fontWeight: 600,
              padding: "6px 13px",
              borderRadius: 20,
              cursor: "pointer",
              color: cat === c ? "#1A1200" : C.mid,
              background: cat === c ? C.amber : C.panel2,
              border: `1px solid ${cat === c ? C.amber : C.border}`,
            }}
          >
            {c}
          </div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Btn variant="outline" small icon={Filter}>Difficulty</Btn>
          <Btn variant="outline" small icon={Filter}>Status</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 22 }}>
        {filtered.map((lab) => (
          <LabCard key={lab.id} lab={lab} onOpen={() => go("lab-detail", lab)} />
        ))}
      </div>
    </div>
  );
}
