import React, { useState, useEffect, useCallback } from "react";
import { X, Plus, Pencil, Check, Tags, Loader2, AlertCircle } from "lucide-react";
import Btn from "../common/Btn";
import { C, sans, mono } from "../../constants/theme";
import { fetchLabCategories, createLabCategory, updateLabCategory } from "../../api/labs";

const inputStyle = {
  flex: 1,
  minWidth: 0,
  boxSizing: "border-box",
  background: C.panel2,
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  padding: "7px 10px",
  fontFamily: sans,
  fontSize: 12.5,
  color: C.hi,
  outline: "none",
};

/**
 * Manage lab categories: add new ones and rename existing ones.
 * Renaming moves every lab in that category to the new name.
 * Calls onChanged() after any change so the caller can refresh its lists.
 */
export default function LabCategoriesModal({ onClose, onChanged }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchLabCategories();
      setCategories(res.results || []);
    } catch (err) {
      setError(err.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    setError("");
    try {
      await createLabCategory(newName.trim());
      setNewName("");
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message || "Failed to add category.");
    } finally {
      setAdding(false);
    }
  };

  const handleRename = async (cat) => {
    const name = editName.trim();
    if (!name || name === cat.name) {
      setEditingId(null);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateLabCategory(cat.id, name);
      setEditingId(null);
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message || "Failed to rename category.");
    } finally {
      setSaving(false);
    }
  };

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
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Tags size={18} color={C.amber} />
            <div>
              <div style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi }}>Lab Categories</div>
              <div style={{ fontFamily: sans, fontSize: 11.5, color: C.low }}>Renaming a category updates every lab in it.</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: C.panel3, border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", color: C.mid, padding: 5, display: "flex" }}>
            <X size={16} />
          </button>
        </div>

        {/* Add */}
        <div style={{ padding: "14px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
          <input
            style={inputStyle}
            placeholder="New category name, e.g. Mobile Security"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          />
          <Btn icon={adding ? Loader2 : Plus} sm disabled={adding || !newName.trim()} onClick={handleAdd}>
            Add
          </Btn>
        </div>

        {error && (
          <div style={{ margin: "12px 22px 0", display: "flex", gap: 8, background: "rgba(229,83,75,0.1)", border: "1px solid rgba(229,83,75,0.35)", borderRadius: 7, padding: "8px 12px", color: "#fca5a5", fontSize: 12.5, fontFamily: sans }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
          </div>
        )}

        {/* List */}
        <div style={{ overflowY: "auto", padding: "10px 22px 18px" }}>
          {loading ? (
            <div style={{ padding: 20, textAlign: "center", color: C.mid, fontFamily: sans, fontSize: 13 }}>Loading categories...</div>
          ) : categories.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: C.mid, fontFamily: sans, fontSize: 13 }}>No categories yet.</div>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}
              >
                {editingId === cat.id ? (
                  <>
                    <input
                      autoFocus
                      style={inputStyle}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(cat);
                        if (e.key === "Escape") { e.stopPropagation(); setEditingId(null); }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRename(cat)}
                      disabled={saving}
                      title="Save"
                      style={{ background: C.amber, border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", display: "flex" }}
                    >
                      {saving ? <Loader2 size={14} color="#1A1200" /> : <Check size={14} color="#1A1200" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      title="Cancel"
                      style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 8px", cursor: "pointer", color: C.mid, display: "flex" }}
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1, fontFamily: sans, fontSize: 13, color: C.hi, fontWeight: 600 }}>{cat.name}</span>
                    <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>
                      {cat.lab_count} lab{cat.lab_count !== 1 ? "s" : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setEditingId(cat.id); setEditName(cat.name); setError(""); }}
                      title="Rename"
                      style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 7px", cursor: "pointer", color: C.mid, display: "flex" }}
                    >
                      <Pencil size={13} />
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
