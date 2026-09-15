import React from "react";
import Panel from "./Panel";
import { C, sans, mono } from "../../constants/theme";

export default function StatCard({ label, value, sub, icon: Icon, tone }) {
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
      </div>
    </Panel>
  );
}
