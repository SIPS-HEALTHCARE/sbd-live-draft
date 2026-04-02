import React from "react";
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  staticFile,
} from "remotion";

type Props = {
  src: string;
  kenBurns?: "in" | "out";
  panDirection?: "left" | "right" | "up" | "down";
};

export const PhotoSlide: React.FC<Props> = ({
  src,
  kenBurns = "in",
  panDirection = "left",
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Ken Burns "in": scale 1.0 -> 1.15, "out": scale 1.15 -> 1.0
  const startScale = kenBurns === "in" ? 1.0 : 1.15;
  const endScale = kenBurns === "in" ? 1.15 : 1.0;
  const currentScale = interpolate(
    frame,
    [0, durationInFrames],
    [startScale, endScale],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Pan: slight 30px movement in the chosen direction
  const panAmount = interpolate(
    frame,
    [0, durationInFrames],
    [0, 30],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  let translateX = 0;
  let translateY = 0;

  switch (panDirection) {
    case "left":
      translateX = -panAmount;
      break;
    case "right":
      translateX = panAmount;
      break;
    case "up":
      translateY = -panAmount;
      break;
    case "down":
      translateY = panAmount;
      break;
  }

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${currentScale}) translate(${translateX}px, ${translateY}px)`,
          transformOrigin: "center center",
        }}
      />
    </AbsoluteFill>
  );
};

export default PhotoSlide;
