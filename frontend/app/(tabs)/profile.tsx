// Profile / Me screen — stats, age mode, neurodiverse toggle.
import { useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useUser } from "@/src/userContext";
import { AGE_MODES, AgeMode, COLORS } from "@/src/theme";
import { MASCOTS, getMascotForCard } from "@/src/mascots";
import { MascotAvatar } from "@/src/components/Mascot";
import { LEVEL_NAMES, api } from "@/src/api";
import { storage } from "@/src/utils/storage";

export default function ProfileScreen() {
  const { user, setAgeMode, refresh, uid } = useUser();

  const onToggleND = useCallback(async () => {
    if (!uid || !user) return;
    await api.onboard(uid, {
      age_mode: user.age_mode,
      selected_topics: user.selected_topics,
      is_neurodiverse: !user.is_neurodiverse,
    });
    refresh();
  }, [uid, user, refresh]);

  const onReset = useCallback(async () => {
    await storage.removeItem("stemscroll.user_id");
    router.replace("/");
  }, []);

  if (!user) return null;
  const mascot = getMascotForCard({ subject: "physics" }, user.age_mode, user.is_neurodiverse);
  const levelName = LEVEL_NAMES[Math.min(user.level - 1, LEVEL_NAMES.length - 1)] || "Curious Atom";

  return (
    <SafeAreaView style={styles.root} testID="profile-screen">
      <LinearGradient colors={[COLORS.cosmos, COLORS.nebula]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={styles.header}>
          <MascotAvatar
            mascot={mascot}
            size="xl"
            pose={mascot.id === "ausomeKoala" ? "single" : "default"}
          />
          <Text style={styles.name}>{mascot.name}&apos;s Explorer</Text>
          <Text style={styles.levelBadge}>{levelName}</Text>
        </View>

        <View style={styles.statsRow}>
          <Stat label="XP" value={`${user.xp_total}`} icon="flash" color={COLORS.solarOrange} />
          <Stat label="Streak" value={`${user.streak_days}d`} icon="flame" color={COLORS.plasmaPink} />
          <Stat label="Level" value={`${user.level}`} icon="ribbon" color={COLORS.auroraTeal} />
        </View>

        <Text style={styles.sectionLabel}>Reading mode</Text>
        <View style={{ gap: 10 }}>
          {AGE_MODES.map((m) => {
            const active = user.age_mode === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                onPress={() => setAgeMode(m.id as AgeMode)}
                style={[styles.row, active && styles.rowActive]}
                testID={`profile-mode-${m.id}`}
              >
                <Text style={{ fontSize: 26 }}>{m.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{m.label}</Text>
                  <Text style={styles.rowDesc}>{m.desc}</Text>
                </View>
                {active && <Ionicons name="checkmark-circle" size={22} color={COLORS.auroraTeal} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Accessibility</Text>
        <TouchableOpacity
          onPress={onToggleND}
          style={[styles.row, user.is_neurodiverse && styles.rowActive]}
          testID="toggle-nd"
        >
          <Text style={{ fontSize: 26 }}>🎧</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Neurodiverse mode</Text>
            <Text style={styles.rowDesc}>Sensory-friendly mascot & messaging</Text>
          </View>
          <Ionicons
            name={user.is_neurodiverse ? "toggle" : "toggle-outline"}
            size={32}
            color={user.is_neurodiverse ? COLORS.auroraTeal : COLORS.moonrock}
          />
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Topics you follow</Text>
        <View style={styles.topicRow}>
          {user.selected_topics.length === 0 ? (
            <Text style={styles.rowDesc}>None yet — onboard again to pick topics.</Text>
          ) : (
            user.selected_topics.map((t) => (
              <View key={t} style={styles.topicChip}>
                <Text style={styles.topicChipText}>{t}</Text>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity style={styles.dangerBtn} onPress={onReset} testID="reset-btn">
          <Ionicons name="refresh" size={18} color={COLORS.plasmaPink} />
          <Text style={styles.dangerText}>Reset & re-onboard</Text>
        </TouchableOpacity>

        <View style={{ marginTop: 24, alignItems: "center", gap: 8 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {(Object.values(MASCOTS).slice(0, 6)).map((m) => (
              <MascotAvatar key={m.id} mascot={m} size="sm" />
            ))}
          </View>
          <Text style={styles.footer}>Meet the STEMScroll crew 🌱</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <View style={[s.stat, { borderColor: color }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  stat: {
    flex: 1, alignItems: "center", paddingVertical: 14,
    borderRadius: 16, borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    gap: 2,
  },
  statValue: { fontSize: 22, fontWeight: "900", marginTop: 4 },
  statLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1 },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { alignItems: "center", gap: 8, marginTop: 4, marginBottom: 20 },
  name: { color: COLORS.textPrimary, fontSize: 22, fontWeight: "900", marginTop: 8 },
  levelBadge: {
    color: COLORS.auroraTeal, fontSize: 12, fontWeight: "800",
    letterSpacing: 1, textTransform: "uppercase",
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: "rgba(0,229,195,0.12)",
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.auroraTeal,
  },
  statsRow: { flexDirection: "row", gap: 10 },
  sectionLabel: {
    color: COLORS.auroraTeal, fontWeight: "800", fontSize: 12,
    letterSpacing: 1, marginTop: 24, marginBottom: 10,
  },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: COLORS.border,
  },
  rowActive: { borderColor: COLORS.auroraTeal, backgroundColor: "rgba(0,229,195,0.08)" },
  rowTitle: { color: COLORS.textPrimary, fontWeight: "800", fontSize: 15 },
  rowDesc: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  topicRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  topicChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: "rgba(0,229,195,0.12)",
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.auroraTeal,
  },
  topicChipText: { color: COLORS.auroraTeal, fontWeight: "700", fontSize: 12, textTransform: "capitalize" },
  dangerBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginTop: 24, padding: 12, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.plasmaPink,
  },
  dangerText: { color: COLORS.plasmaPink, fontWeight: "700", fontSize: 14 },
  footer: { color: COLORS.textSecondary, fontSize: 12, fontWeight: "600" },
});
