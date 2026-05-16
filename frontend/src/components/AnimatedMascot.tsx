// Animated wrapper around MascotAvatar — plays a bouncy entrance whenever
// `pose` (or the mascot itself) changes. Great for celebration moments.
import React, { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { MascotAvatar } from "./Mascot";
import type { Mascot } from "@/src/mascots";

type Size = "sm" | "md" | "lg" | "xl";
type Variant = "bounce" | "celebrate" | "subtle" | "float";

export function AnimatedMascot({
  mascot,
  pose = "default",
  size = "md",
  variant = "bounce",
  testID,
}: {
  mascot: Mascot;
  pose?: string;
  size?: Size;
  variant?: Variant;
  testID?: string;
}) {
  const scale = useSharedValue(0.6);
  const rotate = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (variant === "celebrate") {
      // Pop in, then a tiny rotation wobble — used for mission complete / level up
      scale.value = 0.4;
      scale.value = withSequence(
        withSpring(1.15, { damping: 7, stiffness: 140 }),
        withSpring(1, { damping: 10, stiffness: 110 }),
      );
      rotate.value = withDelay(
        140,
        withSequence(
          withTiming(-0.08, { duration: 160, easing: Easing.out(Easing.cubic) }),
          withTiming(0.08, { duration: 220, easing: Easing.inOut(Easing.cubic) }),
          withTiming(0, { duration: 180, easing: Easing.inOut(Easing.cubic) }),
        ),
      );
    } else if (variant === "subtle") {
      scale.value = 0.92;
      scale.value = withSpring(1, { damping: 12, stiffness: 160 });
    } else if (variant === "float") {
      // Gentle breathing for meditating / idle poses
      scale.value = withSpring(1, { damping: 14, stiffness: 120 });
      translateY.value = withSequence(
        withTiming(-3, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(3, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      );
    } else {
      // Default bounce — pose swap reaction
      scale.value = 0.75;
      scale.value = withSpring(1, { damping: 9, stiffness: 150 });
    }
  }, [pose, mascot.id, variant, scale, rotate, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateZ: `${rotate.value}rad` },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View style={animStyle} testID={testID || `animated-mascot-${mascot.id}-${pose}`}>
      <MascotAvatar mascot={mascot} pose={pose} size={size} />
    </Animated.View>
  );
}
