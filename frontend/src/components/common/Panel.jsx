import React from "react";
import { C } from "../../constants/theme";

export default function Panel({ children, style, ...rest }) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
