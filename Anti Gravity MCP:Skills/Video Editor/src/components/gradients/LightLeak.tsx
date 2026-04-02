import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from "remotion";

type Props = {
  triggerFrame?: number;
  durationInFrames?: number;
  color?: string;
};

export const LightLeak: React.FC<Props> = ({
  triggerFrame = 0,
  durationInFrames = 30,
  color = "rgba(255,0,0,0.15)",
}) => {
  const frame = useCurrentFrame();

  // Only visible between triggerFrame and triggerFrame + durationInFrames
  if (frame < triggerFrame || frame > triggerFrame + durationInFrames) {
    return null;
  }

  // Animate position across the frame
  const position = interpolate(
    frame,
    [triggerFrame, triggerFrame + durationInFrames],
    [-30, 130],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Fade in and out for smooth appearance
  const opacity = interpolate(
    frame,
    [
      triggerFrame,
      triggerFrame + durationInFrames * 0.2,
      triggerFrame + durationInFrames * 0.8,
      triggerFrame + durationInFrames,
    ],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        mixBlendMode: "screen",
        opacity,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: `radial-gradient(ellipse at ${position}% 50%, ${color} 0%, transparent 70%)`,
        }}
      />
    </AbsoluteFill>
  );
};
