import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  staticFile,
  useVideoConfig,
  CalculateMetadataFunction,
  continueRender,
  delayRender,
} from "remotion";
import { getVideoMetadata } from "@remotion/media-utils";
import type { Caption } from "@remotion/captions";
import { createTikTokStyleCaptions } from "@remotion/captions";

// Import all components
import { SIPSCaptions } from "./SIPSCaptions";
import { AudioLayer } from "./components/audio/AudioLayer";
import { PhotoMontage } from "./components/PhotoMontage";
import { GradientOverlay } from "./components/gradients/GradientOverlay";
import { Vignette } from "./components/gradients/Vignette";
import { LightLeak } from "./components/gradients/LightLeak";
import { ColorGrade } from "./components/gradients/ColorGrade";
import { LogoWatermark } from "./components/branding/LogoWatermark";
import { CornerBrackets } from "./components/branding/AccentElements";
import { LowerThird } from "./components/branding/LowerThird";

// Import timing data
import {
  CAPTION_SWITCH_MS,
  LIGHT_LEAK_SCHEDULE,
  LOWER_THIRD_SCHEDULE,
} from "./lib/timing";

type SIPSVideoProps = {
  src: string;
  showPhotos: boolean;
  showCaptions: boolean;
};

export const calculateSIPSMetadata: CalculateMetadataFunction<
  SIPSVideoProps
> = async ({ props }) => {
  const metadata = await getVideoMetadata(staticFile(props.src));
  return {
    fps: 30,
    durationInFrames: Math.ceil(metadata.durationInSeconds * 30),
    width: metadata.width,
    height: metadata.height,
  };
};

export const SIPSVideo: React.FC<SIPSVideoProps> = ({
  src,
  showPhotos,
  showCaptions,
}) => {
  const { fps } = useVideoConfig();
  const [handle] = useState(() => delayRender());
  const [captions, setCaptions] = useState<Caption[] | null>(null);

  useEffect(() => {
    fetch(staticFile("sips-video.json"))
      .then((res) => res.json())
      .then((data: Caption[]) => {
        setCaptions(data);
        continueRender(handle);
      })
      .catch((err) => {
        console.error("Failed to load captions:", err);
        continueRender(handle);
      });
  }, [handle]);

  const { pages } = createTikTokStyleCaptions({
    captions: captions ?? [],
    combineTokensWithinMilliseconds: CAPTION_SWITCH_MS,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* Layer 1: Main Video */}
      <OffthreadVideo
        src={staticFile(src)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* Layer 2: Color Grading */}
      <ColorGrade />

      {/* Layer 3: Photo Montage Overlays */}
      {showPhotos && <PhotoMontage />}

      {/* Layer 4: Gradient Overlays */}
      <GradientOverlay />

      {/* Layer 5: Vignette */}
      <Vignette intensity={0.6} />

      {/* Layer 6: Light Leaks (at scheduled moments) */}
      {LIGHT_LEAK_SCHEDULE.map((leak, i) => (
        <LightLeak
          key={i}
          triggerFrame={leak.triggerFrame}
          durationInFrames={leak.durationFrames}
        />
      ))}

      {/* Layer 7: Captions */}
      {showCaptions &&
        pages.map((page, i) => {
          const startFrame = Math.round((page.startMs / 1000) * fps);
          const durationFrames = Math.round((page.durationMs / 1000) * fps);
          return (
            <Sequence key={i} from={startFrame} durationInFrames={durationFrames}>
              <SIPSCaptions page={page} />
            </Sequence>
          );
        })}

      {/* Layer 8: Corner Brackets */}
      <CornerBrackets size={60} strokeWidth={3} opacity={0.4} />

      {/* Layer 9: Logo Watermark */}
      <LogoWatermark />

      {/* Layer 10: Lower Thirds */}
      {LOWER_THIRD_SCHEDULE.map((lt, i) => (
        <Sequence
          key={`lt-${i}`}
          from={lt.startFrame}
          durationInFrames={lt.durationFrames}
        >
          <LowerThird
            title={lt.title}
            subtitle={lt.subtitle}
            durationInFrames={lt.durationFrames}
          />
        </Sequence>
      ))}

      {/* Layer 11: Audio */}
      <AudioLayer src="dramatic-music.mp3" baseVolume={0.25} />
    </AbsoluteFill>
  );
};
