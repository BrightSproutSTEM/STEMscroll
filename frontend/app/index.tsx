// Splash + route guard. Sends users to onboarding or tabs based on profile.
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useUser } from "@/src/userContext";
import { COLORS } from "@/src/theme";
import { LinearGradient } from "expo-linear-gradient";

export default function Index() {
  const { user, loading } = useUser();

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      if (user?.onboarded) router.replace("/(tabs)");
      else router.replace("/onboarding");
    }, 400);
    return () => clearTimeout(t);
  }, [loading, user]);

  return (
    <View style={styles.root} testID="splash-screen">
      <LinearGradient colors={[COLORS.cosmos, COLORS.nebula]} style={StyleSheet.absoluteFill} />
      <Text style={styles.emoji}>🌱</Text>
      <Text style={styles.title}>STEMScroll</Text>
      <Text style={styles.tagline}>Replace doom scrolling with wonder</Text>
      <ActivityIndicator color={COLORS.auroraTeal} style={{ marginTop: 28 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.cosmos },
  emoji: { fontSize: 88, marginBottom: 8 },
  title: { color: COLORS.textPrimary, fontSize: 36, fontWeight: "900", letterSpacing: -1 },
  tagline: { color: COLORS.auroraTeal, fontSize: 14, marginTop: 6, fontWeight: "600" },
});
