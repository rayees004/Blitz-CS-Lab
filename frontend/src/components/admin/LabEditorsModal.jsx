import React, { useState, useEffect, useMemo } from "react";
import { X, Users, Search, Check, Loader2, AlertCircle, Crown } from "lucide-react";
import Btn from "../common/Btn";
import { C, sans, mono } from "../../constants/theme";
import { fetchLabEditors, updateLabEditors } from "../../api/labs";

/**
 * Lab edit access: the creator (or a platform admin) picks which other instructors may edit the lab.
 * Calls onSaved(editors) after a successful save.
 */
export default function LabEditorsModal({ lab, onClose, onSaved }) {
  const [info, setInfo] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetchLabEditors(lab.id)
      .then((res) => {
        if (!alive) return;
        setInfo(res);
        setSelected(new Set((res.editors || []).map((e) => e.id)));
      })
      .catch((err) => alive && setError(err.message || "Failed to load edit access."))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [lab.id]);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  // Current editors first, then everyone else; filtered by the search box
  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (info?.candidates || []).filter(
      (u) => !q || u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)
    );
    const initial = new Set((info?.editors || []).map((e) => e.id));
    return [...list].sort((a, b) => Number(initial.has(b.id)) - Number(initial.has(a.id)));
  }, [info, query]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await updateLabEditors(lab.id, [...selected]);
      onSaved?.(res.editors || []);
    } catch (err) {
      setError(err.message || "Failed to update edit access.");
      setSaving(false);
    }
  };

  const canManage = info?.can_manage_editors;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", zIndex: 1100 }} />
      <div
        style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: 480, maxWidth: "92vw", maxHeight: "82vh", display: "flex", flexDirection: "column",
          background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, zIndex: 1101,
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <Users size={18} color={C.amber} style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi }}>Lab Edit Access</div>
              <div style={{ fontFamily: sans, fontSize: 11.5, color: C.low, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {lab.name}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: C.panel3, border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", color: C.mid, padding: 5, display: "flex" }}>
            <X size={16} />
          </button>
        </div>

        {/* Creator + explanation */}
        <div style={{ padding: "14px 22px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: sans, fontSize: 12.5, color: C.mid }}>
            <Crown size={13} color={C.amber} />
            Creator:&nbsp;
            <strong style={{ color: C.hi }}>
              {info?.created_by ? `${info.created_by.name} (@${info.created_by.username})` : "Not recorded"}
            </strong>
          </div>
          <div style={{ fontFamily: sans, fontSize: 11.5, color: C.low, marginTop: 6, lineHeight: 1.5 }}>
            Selected instructors can edit this lab's details, questions and files. Only the creator and platform admins can archive it or change this list. Platform admins can always edit every lab.
          </div>
        </div>

        {error && (
          <div style={{ margin: "12px 22px 0", display: "flex", gap: 8, background: "rgba(229,83,75,0.1)", border: "1px solid rgba(229,83,75,0.35)", borderRadius: 7, padding: "8px 12px", color: "#fca5a5", fontSize: 12.5, fontFamily: sans }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
          </div>
        )}

        {/* Search */}
        <div style={{ padding: "12px 22px 4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 6, padding: "7px 10px" }}>
            <Search size={13} color={C.low} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search instructors..."
              style={{ flex: 1, minWidth: 0, background: "none", border: "none", outline: "none", fontFamily: sans, fontSize: 12.5, color: C.hi }}
            />
          </div>
        </div>

        {/* Instructor list */}
        <div style={{ overflowY: "auto", padding: "6px 22px 12px", flex: 1 }}>
          {loading ? (
            <div style={{ padding: 20, textAlign: "center", color: C.mid, fontFamily: sans, fontSize: 13 }}>Loading instructors...</div>
          ) : candidates.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: C.mid, fontFamily: sans, fontSize: 13 }}>
              {query ? "No instructors match your search." : "There are no other instructors to share with."}
            </div>
          ) : (
            candidates.map((u) => {
              const on = selected.has(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  disabled={!canManage}
                  onClick={() => toggle(u.id)}
                  aria-pressed={on}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                    padding: "9px 10px", marginTop: 4, borderRadius: 7, cursor: canManage ? "pointer" : "default",
                    background: on ? "rgba(245,166,35,0.08)" : "transparent",
                    border: `1px solid ${on ? "rgba(245,166,35,0.35)" : C.border}`,
                  }}
                >
                  <span style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    background: on ? C.amber : "transparent", border: `1px solid ${on ? C.amber : C.borderLight}`,
                  }}>
                    {on && <Check size={11} color="#1A1200" strokeWidth={3} />}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontFamily: sans, fontSize: 13, fontWeight: 600, color: C.hi, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</span>
                    <span style={{ display: "block", fontFamily: mono, fontSize: 10.5, color: C.low, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>@{u.username}</span>
                  </span>
                  {on && <span style={{ fontFamily: mono, fontSize: 10, color: C.amber, flexShrink: 0 }}>CAN EDIT</span>}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 22px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>
            {selected.size} instructor{selected.size !== 1 ? "s" : ""} selected
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="outline" sm onClick={onClose}>Cancel</Btn>
            {canManage && (
              <Btn sm icon={saving ? Loader2 : Check} disabled={saving || loading} onClick={handleSave}>
                {saving ? "Saving..." : "Save Access"}
              </Btn>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
