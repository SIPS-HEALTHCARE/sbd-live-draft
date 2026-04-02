import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { makeTransform, scale } from "@remotion/animation-utils";

type ZoomTransitionProps = {
  children: React.ReactNode;
  durationInFrames?: number;
  direction?: "in" | "out";
};

const SPRING_CONFIG = {
  damping: 200,
  stiffness: 80,
  mass: 0.8,
};

export const ZoomTransition: React.FC<ZoomTransitionProps> = ({
  children,
  durationInFrames = 15,
  direction = "in",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: SPRING_CONFIG,
    durationInFrames,
  });

  let scaleValue: number;
  let opacity: number;

  if (direction === "in") {
    // Scale from 1.3 down to 1.0 (zoom in reveal)
    scaleValue = interpolate(progress, [0, 1], [1.3, 1.0]);
    opacity = interpolate(progress, [0, 1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  } else {
    // Scale from 1.0 down to 0.7 (zoom out exit)
    scaleValue = interpolate(progress, [0, 1], [1.0, 0.7]);
    opacity = interpolate(progress, [0, 1], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  const transform = makeTransform([scale(scaleValue)]);

  return (
    <AbsoluteFill
      style={{
        transform,
        opacity,
        transformOrigin: "center center",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export default ZoomTransition;
