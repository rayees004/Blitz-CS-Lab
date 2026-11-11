import React from "react";
import SmartStatTile from "../smart/SmartStatTile";

// Smart UI colour for each StatCard tone
const SMART_TINT = { amber: "amber", cyan: "teal", green: "green", purple: "purple", warn: "amber", danger: "purple" };

export default function StatCard({ label, value, sub, icon: Icon, tone }) {
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
