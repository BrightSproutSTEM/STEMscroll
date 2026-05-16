// Mission detail — vertical scroll through curated cards.
import { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { api, CardData, Mission } from "@/src/api";
import { COLORS, SUBJECTS, AgeMode } from "@/src/theme";
import { STEMCard } from "@/src/components/STEMCard";
import { useUser } from "@/src/userContext";

export default function MissionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, uid, addXP } = useUser();
  const { height } = useWindowDimensions();
  const [mission, setMission] = useState<(Mission & { cards: CardData[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const m = await api.getMission(id);
        setMission(m);
        if (uid) {
          const saved = await api.listSaved(uid);
          setSavedIds(new Set(saved.cards.map((c) => c.card_id)));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id, uid]);

  const toggleSave = useCallback(
    async (card: CardData) => {
      if (!uid) return;
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      const next = new Set(savedIds);
      if (next.has(card.id)) {
        next.delete(card.id);
        api.unsaveCard(uid, card.id).catch(() => {});
      } else {
        next.add(card.id);
        api.saveCard(uid, card.id, card).catch(() => {});
      }
      setSavedIds(next);
    },
    [savedIds, uid],
  );

  const claim = async () => {
    if (mission) {
      await addXP(mission.xpReward);
      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    }
    router.back();
  };

  if (loading || !mission) {
    return (
      <View style={styles.loading}>
        <LinearGradient colors={[COLORS.cosmos, COLORS.nebula]} style={StyleSheet.absoluteFill} />
        <ActivityIndicator color={COLORS.auroraTeal} />
      </View>
    );
  }

  const subj = SUBJECTS[mission.subject] || SUBJECTS.physics;
  const cardHeight = height - 140;

  return (
    <SafeAreaView style={styles.root} testID="mission-detail">
      <LinearGradient colors={[COLORS.cosmos, COLORS.nebula]} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back} testID="mission-back">
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{mission.emoji} {mission.title}</Text>
          <Text style={styles.meta}>{mission.totalCards} cards · +{mission.xpReward} XP</Text>
        </View>
        <View style={[styles.subjPill, { borderColor: subj.color }]}>
          <Text style={[styles.subjText, { color: subj.color }]}>{subj.label}</Text>
        </View>
      </View>

      <FlatList
        data={mission.cards}
        keyExtractor={(c) => c.id}
        snapToInterval={cardHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <STEMCard
            card={item}
            ageMode={(user?.age_mode as AgeMode) || "discoverer"}
            isSaved={savedIds.has(item.id)}
            isND={user?.is_neurodiverse}
            height={cardHeight}
            onSave={() => toggleSave(item)}
          />
        )}
        ListFooterComponent={
          <View style={[styles.complete, { height: cardHeight }]}>
            <Text style={styles.completeEmoji}>🎉</Text>
            <Text style={styles.completeTitle}>Mission complete!</Text>
            <Text style={styles.completeDesc}>You powered through {mission.totalCards} cards.</Text>
            <TouchableOpacity style={styles.claimBtn} onPress={claim} testID="claim-xp">
              <Ionicons name="sparkles" size={20} color={COLORS.cosmos} />
              <Text style={styles.claimText}>Claim +{mission.xpReward} XP</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.glass,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  back: {
    width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  title: { color: COLORS.textPrimary, fontWeight: "900", fontSize: 17 },
  meta: { color: COLORS.textSecondary, fontSize: 12 },
  subjPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  subjText: { fontWeight: "800", fontSize: 11 },
  complete: { alignItems: "center", justifyContent: "center", padding: 20, gap: 12 },
  completeEmoji: { fontSize: 80 },
  completeTitle: { color: COLORS.textPrimary, fontSize: 28, fontWeight: "900" },
  completeDesc: { color: COLORS.textSecondary, fontSize: 15, textAlign: "center" },
  claimBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: COLORS.auroraTeal,
    paddingHorizontal: 22, paddingVertical: 14, borderRadius: 28, marginTop: 12,
  },
  claimText: { color: COLORS.cosmos, fontWeight: "900", fontSize: 15 },
});
