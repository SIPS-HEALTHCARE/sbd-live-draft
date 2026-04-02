import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { BRAND } from "./BrandConfig";

interface LowerThirdProps {
  title: string;
  subtitle?: string;
  startFrame?: number;
  durationInFrames?: number;
}

export const LowerThird: React.FC<LowerThirdProps> = ({
  title,
  subtitle,
  startFrame = 0,
  durationInFrames = 120,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relativeFrame = frame - startFrame;

  // Not yet visible
  if (relativeFrame < 0 || relativeFrame > durationInFrames) {
    return null;
  }

  // Entrance: slide in from left over first 20 frames
  const entranceSpring = spring({
    frame: relativeFrame,
    fps,
    config: { damping: 16, stiffness: 120 },
    durationInFrames: 20,
  });

  // Exit: slide out to left over last 20 frames
  const exitFrame = Math.max(0, relativeFrame - (durationInFrames - 20));
  const exitSpring = spring({
    frame: exitFrame,
    fps,
    config: { damping: 16, stiffness: 120 },
    durationInFrames: 20,
  });

  const translateX = interpolate(entranceSpring, [0, 1], [-400, 0])
    + interpolate(exitSpring, [0, 1], [0, -400]);

  const opacity = interpolate(entranceSpring, [0, 1], [0, 1])
    - interpolate(exitSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          bottom: BRAND.spacing.xl,
          left: BRAND.spacing.lg,
          transform: `translateX(${translateX}px)`,
          opacity: Math.max(0, opacity),
          display: "flex",
          flexDirection: "row",
        }}
      >
        {/* Left red border accent */}
        <div
          style={{
            width: 4,
            backgroundColor: BRAND.colors.accent,
            borderRadius: BRAND.borderRadius.sm,
          }}
        />

        {/* Content block */}
        <div
          style={{
            backgroundColor: BRAND.colors.overlay,
            padding: `${BRAND.spacing.sm}px ${BRAND.spacing.md}px`,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            borderRadius: `0 ${BRAND.borderRadius.md}px ${BRAND.borderRadius.md}px 0`,
          }}
        >
          <span
            style={{
              fontFamily: BRAND.fonts.heading,
              fontSize: 28,
              fontWeight: BRAND.fontWeights.bold,
              color: BRAND.colors.text,
              textTransform: "uppercase",
              letterSpacing: 1,
              lineHeight: 1.2,
            }}
          >
            {title}
          </span>
          {subtitle && (
            <span
              style={{
                fontFamily: BRAND.fonts.body,
                fontSize: 18,
                fontWeight: BRAND.fontWeights.regular,
                color: BRAND.colors.textSecondary,
                lineHeight: 1.3,
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
