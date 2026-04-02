import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { BRAND } from "./BrandConfig";

export const LogoWatermark: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entranceSpring = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 120 },
    durationInFrames: 30,
  });

  const translateX = interpolate(entranceSpring, [0, 1], [80, 0]);
  const opacity = interpolate(entranceSpring, [0, 1], [0, 0.6]);

  const underlineSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
    durationInFrames: 30,
    delay: 10,
  });

  const underlineWidth = interpolate(underlineSpring, [0, 1], [0, 100]);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: BRAND.spacing.lg,
          right: BRAND.spacing.lg,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          transform: `translateX(${translateX}px)`,
          opacity,
        }}
      >
        <span
          style={{
            fontFamily: BRAND.fonts.heading,
            fontSize: 36,
            fontWeight: BRAND.fontWeights.bold,
            color: BRAND.colors.text,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          SPD911
        </span>
        <div
          style={{
            height: 3,
            width: `${underlineWidth}%`,
            backgroundColor: BRAND.colors.accent,
            marginTop: 4,
            borderRadius: BRAND.borderRadius.sm,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
