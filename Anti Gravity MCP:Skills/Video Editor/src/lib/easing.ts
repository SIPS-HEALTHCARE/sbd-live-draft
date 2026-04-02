import { Easing } from "remotion";

export const EASING = {
  smoothIn: Easing.bezier(0.25, 0.1, 0.25, 1),
  dramaticIn: Easing.bezier(0.68, -0.55, 0.265, 1.55), // overshoot
  gentleOut: Easing.bezier(0, 0, 0.2, 1),
  snap: Easing.bezier(0.5, 0, 0, 1),
} as const;

export const SPRING_CONFIGS = {
  gentle: { damping: 200, stiffness: 80, mass: 0.8 },
  snappy: { damping: 15, stiffness: 200, mass: 0.4 },
  bouncy: { damping: 10, stiffness: 150, mass: 0.6 },
  heavy: { damping: 30, stiffness: 60, mass: 1.2 },
} as const;
