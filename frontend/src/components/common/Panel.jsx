import React from "react";

// Smart UI card: rounded with a soft gradient
export default function Panel({ children, style, ...rest }) {
  return (
    <div
      style={{
        background: "linear-gradient(180deg, #11151c, #0e1117)",
        border: "1px solid #1f2530",
        borderRadius: 13,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
