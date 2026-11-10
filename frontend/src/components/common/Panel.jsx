import React from "react";
import { C } from "../../constants/theme";
import { useSmartUi } from "../../utils/uiMode";

export default function Panel({ children, style, ...rest }) {
  // Student panel Smart UI: rounder card with a soft gradient
  const smart = useSmartUi();
  return (
    <div
      style={{
        background: smart ? "linear-gradient(180deg, #11151c, #0e1117)" : C.panel,
        border: `1px solid ${smart ? "#1f2530" : C.border}`,
        borderRadius: smart ? 13 : 10,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
