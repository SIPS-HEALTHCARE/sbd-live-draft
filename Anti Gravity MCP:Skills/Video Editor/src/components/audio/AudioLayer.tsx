import React from "react";
import { Audio, interpolate, staticFile, useVideoConfig } from "remotion";

type Props = {
  src: string;
  baseVolume?: number;
};

export const AudioLayer: React.FC<Props> = ({ src, baseVolume = 0.25 }) => {
  const { durationInFrames } = useVideoConfig();

  return (
    <Audio
      src={staticFile(src)}
      volume={(frame) => {
        // Fade in over first 30 frames
        const fadeIn = interpolate(frame, [0, 30], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        // Fade out over last 60 frames
        const fadeOut = interpolate(
          frame,
          [durationInFrames - 60, durationInFrames],
          [1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        return baseVolume * fadeIn * fadeOut;
      }}
    />
  );
};
