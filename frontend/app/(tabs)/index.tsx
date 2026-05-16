// Vertical snap-scroll feed screen.
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, useWindowDimensions, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useUser } from "@/src/userContext";
import { api, CardData } from "@/src/api";
import { STEMCard } from "@/src/components/STEMCard";
import { AGE_MODES, AgeMode, COLORS } from "@/src/theme";

export default function FeedScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { user, uid, bumpStreak, addXP, setAgeMode } = useUser();
  const [cards, setCards] = useState<CardData[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showModePicker, setShowModePicker] = useState(false);
  const seenRef = useRef<Set<string>>(new Set());

  const cardHeight = useMemo(() => {
    // available height = window - top bar - bottom tab (~ 88/68)
    const tabBar = Platform.OS === "ios" ? 88 : 68;
    return height - tabBar;
  }, [height]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const topics = user?.selected_topics || [];
      const res = await api.getSeedCards(topics, user?.age_mode);
      // Shuffle for variety
      const shuffled = [...res.cards].sort(() => Math.random() - 0.5);
      setCards(shuffled);
      if (uid) {
        const saved = await api.listSaved(uid);
        setSavedIds(new Set(saved.cards.map((c) => c.card_id)));
        // Bump streak on entry
        bumpStreak().catch(() => {});
      }
    } catch (e) {
      console.warn("feed load failed", e);
    } finally {
      setLoading(false);
    }
  }, [user?.selected_topics, user?.age_mode, uid, bumpStreak]);

  useEffect(() => {
    if (user) load();
  }, [load, user]);

  const handleViewable = useCallback(
    ({ viewableItems }: any) => {
      const item = viewableItems[0]?.item as CardData | undefined;
      if (!item || !uid) return;
      if (seenRef.current.has(item.id)) return;
      seenRef.current.add(item.id);
      api.recordView(uid, item.id, item.subject).catch(() => {});
      addXP(item.type === "fact" ? 5 : item.type === "story" ? 8 : 5).catch(() => {});
    },
    [uid, addXP],
  );

  const toggleSave = useCallback(
    async (card: CardData) => {
      if (!uid) return;
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
      const next = new Set(savedIds);
      if (next.has(card.id)) {
        next.delete(card.id);
        setSavedIds(next);
        api.unsaveCard(uid, card.id).catch(() => {});
      } else {
        next.add(card.id);
        setSavedIds(next);
        api.saveCard(uid, card.id, card).catch(() => {});
      }
    },
    [savedIds, uid],
  );

  const handleQuiz = useCallback(
    async (card: CardData, _idx: number, correct: boolean) => {
      try {
        await Haptics.notificationAsync(
          correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
        );
      } catch {}
      await addXP(correct ? 10 : 3);
    },
    [addXP],
  );

  if (loading || !user) {
    return (
      <View style={styles.loading}>
        <LinearGradient colors={[COLORS.cosmos, COLORS.nebula]} style={StyleSheet.absoluteFill} />
        <ActivityIndicator color={COLORS.auroraTeal} size="large" />
        <Text style={styles.loadingText}>Loading your STEM feed…</Text>
      </View>
    );
  }

  const ageLabel = AGE_MODES.find((a) => a.id === user.age_mode)?.label || "Discoverer";

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.cosmos }} testID="feed-container">
      <FlatList
        data={cards}
        keyExtractor={(c) => c.id}
        snapToInterval={cardHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        getItemLayout={(_d, i) => ({ length: cardHeight, offset: cardHeight * i, index: i })}
        onViewableItemsChanged={handleViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={({ item }) => (
          <STEMCard
            card={item}
            ageMode={user.age_mode as AgeMode}
            isSaved={savedIds.has(item.id)}
            isND={user.is_neurodiverse}
            height={cardHeight}
            onSave={() => toggleSave(item)}
            onQuizAnswer={(idx, correct) => handleQuiz(item, idx, correct)}
          />
        )}
      />

      {/* Floating top bar */}
      <SafeAreaView edges={["top"]} style={styles.topBarWrap} pointerEvents="box-none">
        <View style={styles.topBar} testID="feed-top-bar">
          <View style={styles.logo}>
            <Text style={{ fontSize: 22 }}>🌱</Text>
            <Text style={styles.logoText}>STEMScroll</Text>
          </View>
          <View style={styles.streak} testID="streak-counter">
            <Ionicons name="flame" size={16} color={COLORS.solarOrange} />
            <Text style={styles.streakText}>{user.streak_days} day{user.streak_days === 1 ? "" : "s"}</Text>
          </View>
          <TouchableOpacity
            style={styles.modeBtn}
            onPress={() => setShowModePicker((v) => !v)}
            testID="age-mode-toggle"
          >
            <Text style={styles.modeText}>{ageLabel}</Text>
            <Ionicons name="chevron-down" size={14} color={COLORS.auroraTeal} />
          </TouchableOpacity>
        </View>

        {showModePicker && (
          <View style={styles.modePicker} testID="age-mode-picker">
            {AGE_MODES.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.modeOption, user.age_mode === m.id && styles.modeOptionActive]}
                onPress={() => {
                  setShowModePicker(false);
                  setAgeMode(m.id as AgeMode);
                }}
                testID={`mode-option-${m.id}`}
              >
                <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modeOptionTitle}>{m.label}</Text>
                  <Text style={styles.modeOptionDesc}>{m.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.cosmos },
  loadingText: { color: COLORS.textSecondary, marginTop: 12, fontSize: 14 },
  topBarWrap: { position: "absolute", top: 0, left: 0, right: 0 },
  topBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: COLORS.glass,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  logo: { flexDirection: "row", alignItems: "center", gap: 6 },
  logoText: { color: COLORS.textPrimary, fontWeight: "900", fontSize: 16 },
  streak: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,184,48,0.15)",
    borderColor: COLORS.solarOrange, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14,
    marginLeft: "auto",
  },
  streakText: { color: COLORS.solarOrange, fontWeight: "800", fontSize: 12 },
  modeBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(0,229,195,0.15)",
    borderColor: COLORS.auroraTeal, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14,
  },
  modeText: { color: COLORS.auroraTeal, fontWeight: "800", fontSize: 12 },
  modePicker: {
    backgroundColor: COLORS.nebula,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    paddingVertical: 6,
  },
  modeOption: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  modeOptionActive: { backgroundColor: "rgba(0,229,195,0.1)" },
  modeOptionTitle: { color: COLORS.textPrimary, fontWeight: "700", fontSize: 15 },
  modeOptionDesc: { color: COLORS.textSecondary, fontSize: 12 },
});
