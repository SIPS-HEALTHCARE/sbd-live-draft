import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";

type Props = {
  intensity?: number; // 0-1, default 0.6
};

export const Vignette: React.FC<Props> = ({ intensity = 0.6 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Subtle breathing animation on intensity
  const breathe = interpolate(
    frame % 90,
    [0, 45, 90],
    [0, 0.04, 0],
  );

  const animatedIntensity = Math.min(1, intensity + breathe);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${animatedIntensity}) 100%)`,
        pointerEvents: "none",
      }}
    />
  );
};
