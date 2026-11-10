import React from "react";
import Panel from "./Panel";
import { C, sans, mono } from "../../constants/theme";
import { useSmartUi } from "../../utils/uiMode";
import SmartStatTile from "../smart/SmartStatTile";

// Smart UI colour for each StatCard tone
const SMART_TINT = { amber: "amber", cyan: "teal", green: "green", purple: "purple", warn: "amber", danger: "purple" };

export default function StatCard({ label, value, sub, icon: Icon, tone }) {
  const smart = useSmartUi();
  if (smart) {
    return (
      <SmartStatTile
        compact
        tint={SMART_TINT[tone] || "blue"}
        icon={Icon}
        label={label}
        value={value}
        sub={sub}
        wave={String(label || "").length % 3}
      />
    );
  }
  return (
    <Panel style={{ padding: 18, flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: sans, fontSize: 12, color: C.mid }}>{label}</div>
          <div style={{ fontFamily: mono, fontSize: 26, fontWeight: 600, color: C.hi, marginTop: 6 }}>{value}</div>
          {sub && (
            <div style={{ fontFamily: sans, fontSize: 11.5, color: tone === "cyan" ? C.cyan : C.low, marginTop: 4 }}>
              {sub}
            </div>
          )}
        </div>
        {Icon && (
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: C.panel3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={15} color={C.amber} strokeWidth={2} />
          </div>
        )}
      </div>
    </Panel>
  );
}
