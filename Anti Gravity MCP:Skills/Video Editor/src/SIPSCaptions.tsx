import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import {
  makeTransform,
  translateY,
  scale as scaleTransform,
} from "@remotion/animation-utils";
import type { TikTokPage } from "@remotion/captions";
import { BRAND } from "./components/branding/BrandConfig";

type SIPSCaptionsProps = {
  page: TikTokPage;
};

export const SIPSCaptions: React.FC<SIPSCaptionsProps> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // --- Entrance animation: spring scale 0.85→1 + translateY 50→0 + opacity 0→1 ---
  const enterSpring = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 100, mass: 0.5 },
    durationInFrames: 20,
  });

  const enterScale = interpolate(enterSpring, [0, 1], [0.85, 1]);
  const enterOpacity = interpolate(enterSpring, [0, 1], [0, 1]);
  const enterTranslateY = interpolate(enterSpring, [0, 1], [50, 0]);

  // --- Exit animation: last 8 frames → opacity 1→0, scale 1→0.95 ---
  const exitStart = durationInFrames - 8;
  const exitOpacity = interpolate(
    frame,
    [exitStart, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const exitScale = interpolate(
    frame,
    [exitStart, durationInFrames],
    [1, 0.95],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Combine entrance and exit
  const combinedScale = enterScale * exitScale;
  const combinedOpacity = enterOpacity * exitOpacity;

  const containerTransform = makeTransform([
    translateY(enterTranslateY),
    scaleTransform(combinedScale),
  ]);

  const currentTimeMs = (frame / fps) * 1000;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
      }}
    >
      {/* Gradient overlay for caption readability */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "45%",
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.85) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Caption container */}
      <div
        style={{
          transform: containerTransform,
          opacity: combinedOpacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingBottom: 280,
          maxWidth: "95%",
        }}
      >
        {/* Frosted glass card */}
        <div
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(20px)",
            borderRadius: 16,
            padding: "20px 32px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Token text row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 12,
            }}
          >
            {page.tokens.map((token, i) => {
              const isActive =
                currentTimeMs >= token.fromMs - page.startMs &&
                currentTimeMs < token.toMs - page.startMs;

              // Per-word staggered entrance
              const wordDelay = i * 2;
              const wordSpring = spring({
                frame: Math.max(0, frame - wordDelay),
                fps,
                config: { damping: 200, stiffness: 120, mass: 0.5 },
                durationInFrames: 15,
              });
              const wordEntryOpacity = interpolate(wordSpring, [0, 1], [0, 1]);
              const wordEntryY = interpolate(wordSpring, [0, 1], [20, 0]);

              // Spring-based scale for the active word pulse
              const activeWordSpring = spring({
                frame: isActive ? frame : 0,
                fps,
                config: { damping: 12, stiffness: 200, mass: 0.4 },
                durationInFrames: 10,
              });

              const wordScale = isActive
                ? interpolate(activeWordSpring, [0, 1], [1, 1.12])
                : 1;

              // Active highlight pill scale-in
              const pillSpring = spring({
                frame: isActive ? frame : 0,
                fps,
                config: { damping: 14, stiffness: 180, mass: 0.3 },
                durationInFrames: 8,
              });
              const pillScale = isActive
                ? interpolate(pillSpring, [0, 1], [0.6, 1])
                : 0;

              const wordTransform = makeTransform([
                translateY(wordEntryY),
                scaleTransform(wordScale),
              ]);

              const trimmedText = token.text.trim();
              if (!trimmedText) return null;

              return (
                <span
                  key={i}
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: wordTransform,
                    opacity: wordEntryOpacity,
                  }}
                >
                  {/* Active word highlight pill */}
                  {isActive && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: BRAND.colors.primary,
                        borderRadius: 8,
                        padding: "4px 12px",
                        transform: `scale(${pillScale})`,
                        zIndex: 0,
                      }}
                    />
                  )}
                  {/* Word text */}
                  <span
                    style={{
                      position: "relative",
                      zIndex: 1,
                      fontFamily: BRAND.fonts.heading,
                      fontSize: 68,
                      fontWeight: 900,
                      textTransform: "uppercase",
                      lineHeight: 1.2,
                      wordBreak: "break-word",
                      padding: "4px 12px",
                      color: isActive
                        ? BRAND.colors.text
                        : BRAND.colors.text,
                      WebkitTextStroke: isActive
                        ? undefined
                        : "3px rgba(0,0,0,0.8)",
                      paintOrder: isActive ? undefined : "stroke fill",
                      textShadow: isActive
                        ? "0 0 30px rgba(255,0,0,0.6), 0 0 60px rgba(255,0,0,0.3)"
                        : "0 2px 4px rgba(0,0,0,0.5)",
                    }}
                  >
                    {trimmedText}
                  </span>
                </span>
              );
            })}
          </div>

          {/* Red accent bar beneath captions */}
          <div
            style={{
              width: "60%",
              height: 4,
              backgroundColor: BRAND.colors.primary,
              borderRadius: 2,
              marginTop: 16,
              boxShadow: `0 0 15px ${BRAND.colors.accentGlow}`,
              opacity: combinedOpacity,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
