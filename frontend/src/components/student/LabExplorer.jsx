import React, { useState, useEffect } from "react";
import { Search, Filter, RefreshCw, Database } from "lucide-react";
import LabCard from "./LabCard";
import Btn from "../common/Btn";
import { C, sans, mono } from "../../constants/theme";
import { LABS as MOCK_LABS } from "../../data/mockData";
import { fetchLabs, fetchStudentLabs } from "../../api/labs";

export default function LabExplorer({ go }) {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;
    fetchStudentLabs()
      .then((data) => {
        if (!isMounted) return;
        const results = data.labs || [];
        if (results.length > 0) {
          setLabs(results);
        } else {
          setLabs(MOCK_LABS);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch student labs, fallback to public labs:", err);
        fetchLabs()
          .then((data) => {
            if (!isMounted) return;
            setLabs(data.results || MOCK_LABS);
          })
          .catch(() => {
            if (isMounted) setLabs(MOCK_LABS);
          });
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const cats = ["All", ...new Set(labs.map((l) => l.category || l.cat).filter(Boolean))];

  const filtered = labs.filter((l) => {
    const matchesCat = cat === "All" || (l.category || l.cat) === cat;
    const matchesSearch =
      !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.description || l.desc || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.org || "").toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: 0 }}>
              Lab Explorer
            </h1>
            <span
              style={{
                fontFamily: mono,
                fontSize: 11,
                color: C.cyan,
                background: "rgba(63, 216, 200, 0.1)",
                padding: "2px 7px",
                borderRadius: 4,
                border: `1px solid rgba(63, 216, 200, 0.25)`,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Database size={10} /> Live Labs
            </span>
          </div>
          <p style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, marginTop: 6 }}>
            {labs.length} isolated environments across {cats.length - 1} security domains.
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
          <input
            type="text"
            placeholder="Search labs by name or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              fontFamily: sans,
              fontSize: 12.5,
              color: C.hi,
              outline: "none",
              width: "100%",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap", alignItems: "center" }}>
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
              transition: "all 120ms ease",
            }}
          >
            {c}
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: C.mid, fontFamily: sans }}>
          <RefreshCw size={24} color={C.cyan} style={{ animation: "spin 1s linear infinite", marginBottom: 12 }} />
          <div>Loading interactive security labs...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: 40,
            textAlign: "center",
            marginTop: 24,
          }}
        >
          <div style={{ fontFamily: sans, fontSize: 14, color: C.hi, fontWeight: 600 }}>No labs match your search</div>
          <div style={{ fontFamily: sans, fontSize: 12.5, color: C.low, marginTop: 4 }}>
            Try selecting a different domain category or clearing your search term.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 22 }}>
          {filtered.map((lab) => (
            <LabCard
              key={lab.id}
              lab={{
                ...lab,
                diff: lab.difficulty || lab.diff || "Beginner",
                cat: lab.category || lab.cat || "Web Security",
                pts: lab.points || lab.pts || 100,
                desc: lab.description || lab.desc || "",
              }}
              onOpen={() => go("lab-detail", lab)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
