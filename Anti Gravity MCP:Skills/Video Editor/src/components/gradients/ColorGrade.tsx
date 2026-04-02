import React from "react";
import { AbsoluteFill } from "remotion";

type Props = {
  children?: React.ReactNode;
};

export const ColorGrade: React.FC<Props> = ({ children }) => {
  return (
    <AbsoluteFill
      style={{
        filter: "contrast(1.05) saturate(1.1) brightness(0.95)",
      }}
    >
      {children}

      {/* Warm tone overlay */}
      <AbsoluteFill
        style={{
          backgroundColor: "rgba(255, 200, 150, 0.03)",
          mixBlendMode: "color",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
