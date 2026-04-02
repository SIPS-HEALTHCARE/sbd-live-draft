import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { PHOTOS } from "../lib/photos";
import { PhotoSlide } from "./PhotoSlide";
import {
  TransitionWrapper,
  type TransitionType,
} from "./transitions/TransitionWrapper";

/**
 * PhotoMontage - Orchestrates a photo slideshow overlaid on the video.
 *
 * Layout:
 *   Body section  (frames 300-3005): 12 photos, ~225 frames apart, 90 frames each (3s)
 *   Outro section (frames 3005-3335): 8 photos, 30 frames each (1s rapid-fire)
 *
 * Photos are evenly sampled from the full 58-photo set.
 * Transitions rotate through: fade, slide, zoom, wipe.
 * The entire montage sits at 0.85 opacity so the underlying video peeks through.
 */

// Transition types to rotate through
const TRANSITION_TYPES: TransitionType[] = ["fade", "slide", "zoom", "wipe"];

// Slide directions to rotate through for slide/wipe transitions
const SLIDE_DIRECTIONS: Array<"left" | "right" | "top" | "bottom"> = [
  "left",
  "right",
  "top",
  "bottom",
];

// Ken Burns settings to alternate
const KEN_BURNS: Array<"in" | "out"> = ["in", "out"];
const PAN_DIRECTIONS: Array<"left" | "right" | "up" | "down"> = [
  "left",
  "right",
  "up",
  "down",
];

/**
 * Pick `count` photos evenly distributed from the full array,
 * starting at `startIndex` offset so body and outro don't overlap.
 */
function pickPhotos(startIndex: number, count: number): string[] {
  const step = Math.floor(PHOTOS.length / count);
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const idx = (startIndex + i * step) % PHOTOS.length;
    result.push(PHOTOS[idx]);
  }
  return result;
}

// 12 body photos sampled from the first half of the array
const bodyPhotos = pickPhotos(0, 12);
// 8 outro photos sampled from the second half
const outroPhotos = pickPhotos(30, 8);

// Body: starts at frame 300, each photo 90 frames, spaced ~225 frames apart
const BODY_START = 300;
const BODY_PHOTO_DURATION = 90; // 3 seconds
const BODY_SPACING = 225; // ~7.5 seconds apart

// Outro: starts at frame 3005, each photo 30 frames, back-to-back
const OUTRO_START = 3005;
const OUTRO_PHOTO_DURATION = 30; // 1 second

// Transition overlay duration (how many frames the transition animation lasts)
const TRANSITION_DURATION = 15;

export const PhotoMontage: React.FC = () => {
  return (
    <AbsoluteFill style={{ opacity: 0.85 }}>
      {/* --- Body photos --- */}
      {bodyPhotos.map((photo, i) => {
        const from = BODY_START + i * BODY_SPACING;
        const transitionType = TRANSITION_TYPES[i % TRANSITION_TYPES.length];
        const slideFrom = SLIDE_DIRECTIONS[i % SLIDE_DIRECTIONS.length];
        const kb = KEN_BURNS[i % KEN_BURNS.length];
        const pan = PAN_DIRECTIONS[i % PAN_DIRECTIONS.length];

        return (
          <Sequence
            key={`body-${i}`}
            from={from}
            durationInFrames={BODY_PHOTO_DURATION}
            name={`Body Photo ${i + 1}`}
          >
            <TransitionWrapper
              type={transitionType}
              durationInFrames={TRANSITION_DURATION}
              direction="both"
              from={slideFrom}
            >
              <PhotoSlide
                src={photo}
                kenBurns={kb}
                panDirection={pan}
              />
            </TransitionWrapper>
          </Sequence>
        );
      })}

      {/* --- Outro photos (rapid-fire) --- */}
      {outroPhotos.map((photo, i) => {
        const from = OUTRO_START + i * OUTRO_PHOTO_DURATION;
        const transitionType = TRANSITION_TYPES[i % TRANSITION_TYPES.length];
        const slideFrom = SLIDE_DIRECTIONS[i % SLIDE_DIRECTIONS.length];
        const kb = KEN_BURNS[i % KEN_BURNS.length];
        const pan = PAN_DIRECTIONS[i % PAN_DIRECTIONS.length];

        return (
          <Sequence
            key={`outro-${i}`}
            from={from}
            durationInFrames={OUTRO_PHOTO_DURATION}
            name={`Outro Photo ${i + 1}`}
          >
            <TransitionWrapper
              type={transitionType}
              durationInFrames={Math.min(TRANSITION_DURATION, 10)}
              direction="in"
              from={slideFrom}
            >
              <PhotoSlide
                src={photo}
                kenBurns={kb}
                panDirection={pan}
              />
            </TransitionWrapper>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export default PhotoMontage;
