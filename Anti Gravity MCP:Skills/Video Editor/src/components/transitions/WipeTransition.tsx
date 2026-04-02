import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";

type WipeTransitionProps = {
  children: React.ReactNode;
  durationInFrames?: number;
  from?: "left" | "right" | "top" | "bottom";
};

const EASE_CURVE = Easing.bezier(0.25, 0.1, 0.25, 1);

export const WipeTransition: React.FC<WipeTransitionProps> = ({
  children,
  durationInFrames = 15,
  from = "left",
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_CURVE,
  });

  let clipPath: string;

  switch (from) {
    case "left":
      // Reveals from the left edge rightward
      clipPath = `inset(0 ${100 - progress}% 0 0)`;
      break;
    case "right":
      // Reveals from the right edge leftward
      clipPath = `inset(0 0 0 ${100 - progress}%)`;
      break;
    case "top":
      // Reveals from the top edge downward
      clipPath = `inset(0 0 ${100 - progress}% 0)`;
      break;
    case "bottom":
      // Reveals from the bottom edge upward
      clipPath = `inset(${100 - progress}% 0 0 0)`;
      break;
    default:
      clipPath = "inset(0 0 0 0)";
  }

  return (
    <AbsoluteFill style={{ clipPath }}>
      {children}
    </AbsoluteFill>
  );
};

export default WipeTransition;
