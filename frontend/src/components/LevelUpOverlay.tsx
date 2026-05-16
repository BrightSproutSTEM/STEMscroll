// Global level-up celebration overlay. Watches user.level; when it bumps,
// fades in over the whole screen with brainwave Neuro Sprouty + new level name.
import React, { useEffect, useRef, useState } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming, withRepeat, Easing,
} from "react-native-reanimated";
import { useUser } from "@/src/userContext";
import { LEVEL_NAMES } from "@/src/api";
import { COLORS } from "@/src/theme";
import { MASCOTS } from "@/src/mascots";
import { MascotAvatar } from "@/src/components/Mascot";

export function LevelUpOverlay() {
  const { user } = useUser();
  const [visible, setVisible] = useState(false);
  const [shownLevel, setShownLevel] = useState<number | null>(null);
  const prevLevel = useRef<number | null>(null);

  const scale = useSharedValue(0);
  const glowRot = useSharedValue(0);

  useEffect(() => {
    if (!user) return;
    if (prevLevel.current === null) {
      prevLevel.current = user.level;
      return;
    }
    if (user.level > prevLevel.current) {
      setShownLevel(user.level);
      setVisible(true);
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    }
    prevLevel.current = user.level;
  }, [user]);

  useEffect(() => {
    if (visible) {
      scale.value = 0;
      scale.value = withSequence(
        withSpring(1.18, { damping: 7, stiffness: 130 }),
        withSpring(1, { damping: 9, stiffness: 110 }),
      );
      glowRot.value = 0;
      glowRot.value = withRepeat(
        withTiming(1, { duration: 6000, easing: Easing.linear }),
        -1,
        false,
      );
    }
  }, [visible, scale, glowRot]);

  const mascotStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${glowRot.value * 360}deg` }] }));

  if (!visible || !shownLevel) return null;
  const levelName = LEVEL_NAMES[Math.min(shownLevel - 1, LEVEL_NAMES.length - 1)] || "Curious Atom";

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={() => setVisible(false)}>
      <Pressable style={styles.backdrop} onPress={() => setVisible(false)} testID="levelup-overlay">
        <Animated.View style={[styles.rays, glowStyle]} pointerEvents="none">
          <LinearGradient
            colors={["transparent", "rgba(0,229,195,0.25)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <View style={styles.card}>
          <Text style={styles.smallLabel}>LEVEL UP!</Text>
          <Animated.View style={mascotStyle}>
            <MascotAvatar mascot={MASCOTS.neuroSprouty} pose="brainwave" size="xl" />
          </Animated.View>
          <Text style={styles.bigTitle}>You&apos;re now a</Text>
          <Text style={styles.levelName}>{levelName}</Text>
          <Text style={styles.subtitle}>
            Your brain just leveled up! 🧠✨ Every kind of brain is a superpower.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={() => setVisible(false)} testID="levelup-continue">
            <Ionicons name="sparkles" size={18} color={COLORS.cosmos} />
            <Text style={styles.btnText}>Keep exploring</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(11,15,46,0.96)",
    padding: 24,
  },
  rays: {
    position: "absolute", width: 800, height: 800,
    top: -200, left: "50%", marginLeft: -400, opacity: 0.7,
  },
  card: {
    width: "100%", maxWidth: 360,
    alignItems: "center", gap: 8,
    padding: 28, borderRadius: 28,
    backgroundColor: "rgba(26,31,78,0.95)",
    borderWidth: 2, borderColor: COLORS.auroraTeal,
  },
  smallLabel: {
    color: COLORS.auroraTeal, fontWeight: "900", fontSize: 12,
    letterSpacing: 3, marginBottom: 4,
  },
  bigTitle: {
    color: COLORS.textPrimary, fontSize: 18, fontWeight: "700", marginTop: 8,
  },
  levelName: {
    color: COLORS.solarOrange, fontSize: 30, fontWeight: "900",
    letterSpacing: -0.5, textAlign: "center",
  },
  subtitle: {
    color: COLORS.textSecondary, fontSize: 14, textAlign: "center",
    marginTop: 6, lineHeight: 20,
  },
  btn: {
    flexDirection: "row", gap: 8, alignItems: "center",
    backgroundColor: COLORS.auroraTeal,
    paddingHorizontal: 22, paddingVertical: 12, borderRadius: 22,
    marginTop: 16,
  },
  btnText: { color: COLORS.cosmos, fontWeight: "900", fontSize: 15 },
});
