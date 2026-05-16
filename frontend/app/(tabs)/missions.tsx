// Missions list — curated card sets per topic.
import { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { api, Mission } from "@/src/api";
import { COLORS, SUBJECTS } from "@/src/theme";
import { MASCOTS, MascotId } from "@/src/mascots";
import { MascotAvatar } from "@/src/components/Mascot";

export default function MissionsScreen() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listMissions();
      setMissions(res.missions);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.root} testID="missions-screen">
      <LinearGradient colors={[COLORS.cosmos, COLORS.nebula]} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Text style={styles.h1}>Missions 🚀</Text>
        <Text style={styles.sub}>Guided STEM journeys with a built-in story.</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={COLORS.auroraTeal} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={missions}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 14 }}
          renderItem={({ item }) => {
            const subj = SUBJECTS[item.subject] || SUBJECTS.physics;
            const m = MASCOTS[item.mascot as MascotId] || MASCOTS.sprouty;
            return (
              <TouchableOpacity
                onPress={() => router.push(`/mission/${item.id}`)}
                testID={`mission-${item.id}`}
              >
                <LinearGradient
                  colors={subj.gradient as any}
                  style={styles.missionCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.missionRow}>
                    <MascotAvatar mascot={m} size="md" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.missionEmoji}>{item.emoji}</Text>
                      <Text style={styles.missionTitle}>{item.title}</Text>
                      <Text style={styles.missionMeta}>
                        {item.totalCards} cards · {item.estimatedMinutes} min · +{item.xpReward} XP
                      </Text>
                      <Text style={styles.missionCurr}>{item.curriculum}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={22} color={COLORS.textPrimary} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cosmos },
  header: { padding: 20, paddingTop: 12 },
  h1: { color: COLORS.textPrimary, fontSize: 32, fontWeight: "900", letterSpacing: -0.8 },
  sub: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
  missionCard: { padding: 18, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border },
  missionRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  missionEmoji: { fontSize: 26, marginBottom: 2 },
  missionTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: "800" },
  missionMeta: { color: COLORS.stardust, fontSize: 12, marginTop: 4, fontWeight: "600" },
  missionCurr: { color: COLORS.auroraTeal, fontSize: 11, marginTop: 4, fontWeight: "700", letterSpacing: 0.5 },
});
