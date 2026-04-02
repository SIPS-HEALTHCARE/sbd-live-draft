import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";

type Props = {
  topOpacity?: number;
  bottomOpacity?: number;
};

export const GradientOverlay: React.FC<Props> = ({
  topOpacity = 1,
  bottomOpacity = 1,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Subtle animated shift of gradient stop positions over time
  const bottomShift = interpolate(
    frame,
    [0, durationInFrames],
    [-2, 2],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const topShift = interpolate(
    frame,
    [0, durationInFrames],
    [0, 3],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const bottomGradient = `linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.2) ${40 + bottomShift}%, rgba(0,0,0,0.6) ${70 + bottomShift}%, rgba(0,0,0,0.95) 100%)`;

  const topGradient = `linear-gradient(to top, transparent 0%, rgba(0,0,0,0.5) ${80 + topShift}%, rgba(0,0,0,0.7) 100%)`;

  return (
    <>
      {/* Bottom gradient for caption readability */}
      <AbsoluteFill
        style={{
          background: bottomGradient,
          opacity: bottomOpacity,
          pointerEvents: "none",
        }}
      />

      {/* Top gradient for branding - covers top 25% */}
      <AbsoluteFill
        style={{
          background: topGradient,
          height: "25%",
          opacity: topOpacity,
          pointerEvents: "none",
        }}
      />
    </>
  );
};
