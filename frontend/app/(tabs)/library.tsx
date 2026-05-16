// Library screen — shows saved cards.
import { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { api, CardData } from "@/src/api";
import { useUser } from "@/src/userContext";
import { COLORS, SUBJECTS } from "@/src/theme";
import { MASCOTS } from "@/src/mascots";
import { MascotBubble } from "@/src/components/Mascot";

export default function LibraryScreen() {
  const { uid, user } = useUser();
  const [items, setItems] = useState<{ card_id: string; card_data: CardData }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!uid) return;
    const res = await api.listSaved(uid);
    setItems(res.cards);
    setLoading(false);
    setRefreshing(false);
  }, [uid]);

  useEffect(() => {
    load();
  }, [load]);

  const unsave = async (card_id: string) => {
    if (!uid) return;
    setItems((prev) => prev.filter((x) => x.card_id !== card_id));
    api.unsaveCard(uid, card_id).catch(() => {});
  };

  const mascot = user?.is_neurodiverse ? MASCOTS.ausomeKoala : MASCOTS.sprouty;

  return (
    <SafeAreaView style={styles.root} testID="library-screen">
      <LinearGradient colors={[COLORS.cosmos, COLORS.nebula]} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Text style={styles.h1}>Library 📚</Text>
        <Text style={styles.sub}>Your saved STEM moments.</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={COLORS.auroraTeal} style={{ marginTop: 40 }} />
      ) : items.length === 0 ? (
        <View style={styles.empty} testID="library-empty">
          <MascotBubble mascot={mascot} message={mascot.messages.empty || "Save cards to revisit!"} size="lg" />
          <Text style={styles.emptyTitle}>No saves yet</Text>
          <Text style={styles.emptyHint}>Tap the ♥ on any card in the Feed to keep it here.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.card_id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={COLORS.auroraTeal}
            />
          }
          renderItem={({ item }) => {
            const c = item.card_data;
            const subj = SUBJECTS[c.subject] || SUBJECTS.physics;
            return (
              <LinearGradient
                colors={subj.gradient as any}
                style={styles.libCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.libRow}>
                  <Text style={styles.libSubject}>{subj.emoji} {subj.label.toUpperCase()}</Text>
                  <TouchableOpacity
                    onPress={() => unsave(item.card_id)}
                    testID={`unsave-${item.card_id}`}
                    style={styles.libHeart}
                  >
                    <Ionicons name="heart" size={16} color={COLORS.plasmaPink} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.libEmoji}>{c.emoji}</Text>
                <Text numberOfLines={3} style={styles.libHeadline}>
                  {c.headline}
                </Text>
                <View style={styles.libType}>
                  <Text style={styles.libTypeText}>{c.type.toUpperCase()}</Text>
                </View>
              </LinearGradient>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { padding: 20, paddingTop: 12 },
  h1: { color: COLORS.textPrimary, fontSize: 32, fontWeight: "900", letterSpacing: -0.8 },
  sub: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
  empty: { padding: 28, alignItems: "center", marginTop: 32, gap: 16 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: "800", marginTop: 4 },
  emptyHint: { color: COLORS.textSecondary, fontSize: 14, textAlign: "center", paddingHorizontal: 24 },
  libCard: {
    flex: 1, aspectRatio: 0.82, borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, justifyContent: "space-between",
  },
  libRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  libSubject: { color: COLORS.textPrimary, fontSize: 10, fontWeight: "800", letterSpacing: 0.5, flex: 1 },
  libHeart: { padding: 4 },
  libEmoji: { fontSize: 36, textAlign: "center" },
  libHeadline: { color: COLORS.textPrimary, fontSize: 14, fontWeight: "700", lineHeight: 18 },
  libType: {
    backgroundColor: "rgba(0,0,0,0.35)", alignSelf: "flex-start",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  libTypeText: { color: COLORS.auroraTeal, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
});
