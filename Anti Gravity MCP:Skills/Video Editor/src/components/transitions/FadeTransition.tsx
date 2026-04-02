import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";

type FadeTransitionProps = {
  children: React.ReactNode;
  durationInFrames?: number;
  direction?: "in" | "out" | "both";
};

const EASE_CURVE = Easing.bezier(0.25, 0.1, 0.25, 1);

export const FadeTransition: React.FC<FadeTransitionProps> = ({
  children,
  durationInFrames = 15,
  direction = "in",
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames: totalDuration } = useVideoConfig();

  let opacity = 1;

  if (direction === "in") {
    opacity = interpolate(frame, [0, durationInFrames], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE_CURVE,
    });
  } else if (direction === "out") {
    const startFrame = totalDuration - durationInFrames;
    opacity = interpolate(frame, [startFrame, totalDuration], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE_CURVE,
    });
  } else {
    // "both" — fade in at start, fade out at end
    const fadeIn = interpolate(frame, [0, durationInFrames], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE_CURVE,
    });
    const startOut = totalDuration - durationInFrames;
    const fadeOut = interpolate(frame, [startOut, totalDuration], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE_CURVE,
    });
    opacity = Math.min(fadeIn, fadeOut);
  }

  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export default FadeTransition;
