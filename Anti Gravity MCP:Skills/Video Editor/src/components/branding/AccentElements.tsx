import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { BRAND } from "./BrandConfig";

/* ------------------------------------------------------------------ */
/* RedDivider — animated red line that grows from center outward       */
/* ------------------------------------------------------------------ */

interface RedDividerProps {
  width?: string;
  thickness?: number;
  startFrame?: number;
}

export const RedDivider: React.FC<RedDividerProps> = ({
  width = "80%",
  thickness = 3,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const growSpring = spring({
    frame: Math.max(0, frame - startFrame),
    fps,
    config: { damping: 16, stiffness: 100 },
    durationInFrames: 30,
  });

  const scaleX = interpolate(growSpring, [0, 1], [0, 1]);

  return (
    <div
      style={{
        width,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          height: thickness,
          backgroundColor: BRAND.colors.accent,
          borderRadius: BRAND.borderRadius.sm,
          transform: `scaleX(${scaleX})`,
        }}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* CornerBrackets — thin red L-shapes in all 4 corners                 */
/* ------------------------------------------------------------------ */

interface CornerBracketsProps {
  size?: number;
  strokeWidth?: number;
  opacity?: number;
}

export const CornerBrackets: React.FC<CornerBracketsProps> = ({
  size = 40,
  strokeWidth = 2,
  opacity = 0.6,
}) => {
  const bracketStyle = (
    top: boolean,
    left: boolean
  ): React.CSSProperties => ({
    position: "absolute",
    width: size,
    height: size,
    borderColor: BRAND.colors.accent,
    borderStyle: "solid",
    borderWidth: 0,
    ...(top
      ? { top: BRAND.spacing.md, borderTopWidth: strokeWidth }
      : { bottom: BRAND.spacing.md, borderBottomWidth: strokeWidth }),
    ...(left
      ? { left: BRAND.spacing.md, borderLeftWidth: strokeWidth }
      : { right: BRAND.spacing.md, borderRightWidth: strokeWidth }),
    opacity,
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={bracketStyle(true, true)} />
      <div style={bracketStyle(true, false)} />
      <div style={bracketStyle(false, true)} />
      <div style={bracketStyle(false, false)} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* PulsingDot — red dot that pulses like a "LIVE" indicator            */
/* ------------------------------------------------------------------ */

interface PulsingDotProps {
  size?: number;
}

export const PulsingDot: React.FC<PulsingDotProps> = ({ size = 12 }) => {
  const frame = useCurrentFrame();

  const cycleLength = 40;
  const phase = frame % cycleLength;
  const scale = interpolate(
    phase,
    [0, cycleLength * 0.5, cycleLength],
    [1, 1.3, 1]
  );

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: BRAND.colors.accent,
        boxShadow: `0 0 ${size * 0.6}px ${BRAND.colors.accentGlow}`,
        transform: `scale(${scale})`,
      }}
    />
  );
};
