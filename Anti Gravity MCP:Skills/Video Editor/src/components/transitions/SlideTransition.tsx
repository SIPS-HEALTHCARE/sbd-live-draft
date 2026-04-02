import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { makeTransform, translateX, translateY } from "@remotion/animation-utils";

type SlideTransitionProps = {
  children: React.ReactNode;
  durationInFrames?: number;
  from?: "left" | "right" | "top" | "bottom";
};

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;

const SPRING_CONFIG = {
  damping: 200,
  stiffness: 80,
  mass: 0.8,
};

export const SlideTransition: React.FC<SlideTransitionProps> = ({
  children,
  durationInFrames = 15,
  from = "left",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: SPRING_CONFIG,
    durationInFrames,
  });

  let transform: string;

  switch (from) {
    case "left":
      transform = makeTransform([translateX(-CANVAS_WIDTH * (1 - progress))]);
      break;
    case "right":
      transform = makeTransform([translateX(CANVAS_WIDTH * (1 - progress))]);
      break;
    case "top":
      transform = makeTransform([translateY(-CANVAS_HEIGHT * (1 - progress))]);
      break;
    case "bottom":
      transform = makeTransform([translateY(CANVAS_HEIGHT * (1 - progress))]);
      break;
    default:
      transform = "none";
  }

  return (
    <AbsoluteFill style={{ transform }}>
      {children}
    </AbsoluteFill>
  );
};

export default SlideTransition;
