// Floating "Saved!" toast — pops Neuro Sprouty blowing kisses with rainbow hearts
// when a user saves a card. Auto-dismisses after 1.6s.
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay, runOnJS, Easing,
} from "react-native-reanimated";
import { COLORS } from "@/src/theme";
import { MASCOTS } from "@/src/mascots";
import { MascotAvatar } from "@/src/components/Mascot";

export function SaveToast({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const translateY = useSharedValue(120);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = 120;
      opacity.value = 0;
      translateY.value = withSpring(0, { damping: 12, stiffness: 130 });
      opacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
      opacity.value = withDelay(
        1400,
        withTiming(0, { duration: 320, easing: Easing.in(Easing.cubic) }, (finished) => {
          if (finished) runOnJS(onDone)();
        }),
      );
      translateY.value = withDelay(
        1400,
        withTiming(40, { duration: 320, easing: Easing.in(Easing.cubic) }),
      );
    }
  }, [visible, translateY, opacity, onDone]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.wrap, animStyle]} pointerEvents="none" testID="save-toast">
      <View style={styles.bar}>
        <MascotAvatar mascot={MASCOTS.neuroSprouty} pose="kisses" size="md" />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Saved! 💖</Text>
          <Text style={styles.subtitle}>Your brain library is growing</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute", left: 16, right: 16, bottom: 110,
    alignItems: "center",
  },
  bar: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "rgba(26,31,78,0.97)",
    borderColor: COLORS.plasmaPink, borderWidth: 1.5,
    borderRadius: 22, paddingVertical: 10, paddingHorizontal: 14,
    shadowColor: COLORS.plasmaPink, shadowOpacity: 0.4, shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
    maxWidth: 360, width: "100%",
  },
  title: { color: COLORS.textPrimary, fontWeight: "900", fontSize: 15 },
  subtitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
});
