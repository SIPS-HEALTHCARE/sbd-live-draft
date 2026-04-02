import React from "react";
import { FadeTransition } from "./FadeTransition";
import { SlideTransition } from "./SlideTransition";
import { ZoomTransition } from "./ZoomTransition";
import { WipeTransition } from "./WipeTransition";

export type TransitionType = "fade" | "slide" | "zoom" | "wipe";

type TransitionWrapperProps = {
  children: React.ReactNode;
  type: TransitionType;
  durationInFrames?: number;
  /** Direction for fade ("in"|"out"|"both") and zoom ("in"|"out") */
  direction?: "in" | "out" | "both";
  /** Side for slide and wipe transitions */
  from?: "left" | "right" | "top" | "bottom";
};

export const TransitionWrapper: React.FC<TransitionWrapperProps> = ({
  children,
  type,
  durationInFrames,
  direction,
  from,
}) => {
  switch (type) {
    case "fade":
      return (
        <FadeTransition
          durationInFrames={durationInFrames}
          direction={direction}
        >
          {children}
        </FadeTransition>
      );
    case "slide":
      return (
        <SlideTransition durationInFrames={durationInFrames} from={from}>
          {children}
        </SlideTransition>
      );
    case "zoom":
      return (
        <ZoomTransition
          durationInFrames={durationInFrames}
          direction={direction === "both" ? "in" : direction}
        >
          {children}
        </ZoomTransition>
      );
    case "wipe":
      return (
        <WipeTransition durationInFrames={durationInFrames} from={from}>
          {children}
        </WipeTransition>
      );
    default:
      return <>{children}</>;
  }
};

// Re-export all transition components for convenience
export { FadeTransition } from "./FadeTransition";
export { SlideTransition } from "./SlideTransition";
export { ZoomTransition } from "./ZoomTransition";
export { WipeTransition } from "./WipeTransition";

export default TransitionWrapper;
