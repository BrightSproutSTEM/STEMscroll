// Reusable mascot circular avatar with optional speech bubble.
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Mascot } from "@/src/mascots";
import { COLORS } from "@/src/theme";

type Size = "sm" | "md" | "lg" | "xl";

const sizeMap: Record<Size, number> = { sm: 48, md: 72, lg: 100, xl: 140 };
const fontMap: Record<Size, number> = { sm: 24, md: 38, lg: 52, xl: 72 };

export function MascotAvatar({
  mascot,
  size = "md",
  testID,
}: {
  mascot: Mascot;
  size?: Size;
  testID?: string;
}) {
  const px = sizeMap[size];
  return (
    <View
      testID={testID || `mascot-${mascot.id}`}
      style={[
        styles.avatar,
        { width: px, height: px, borderRadius: px / 2, borderColor: mascot.color },
      ]}
    >
      <LinearGradient
        colors={[mascot.bgColor, "rgba(255,255,255,0.04)"]}
        style={[StyleSheet.absoluteFill, { borderRadius: px / 2 }]}
      />
      <Text style={{ fontSize: fontMap[size] }}>{mascot.emoji}</Text>
    </View>
  );
}

export function MascotBubble({
  mascot,
  message,
  size = "md",
  testID,
}: {
  mascot: Mascot;
  message?: string;
  size?: Size;
  testID?: string;
}) {
  return (
    <View style={styles.bubbleRow} testID={testID || `mascot-bubble-${mascot.id}`}>
      <MascotAvatar mascot={mascot} size={size} />
      {message ? (
        <View style={styles.bubble}>
          <Text style={styles.bubbleName}>{mascot.name}</Text>
          <Text style={styles.bubbleText}>{message}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: COLORS.nebula,
  },
  bubbleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  bubble: {
    flex: 1,
    backgroundColor: COLORS.stardust,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleName: { fontWeight: "800", color: COLORS.cosmos, fontSize: 12, marginBottom: 2 },
  bubbleText: { color: COLORS.cosmos, fontSize: 14, lineHeight: 19, fontWeight: "500" },
});
