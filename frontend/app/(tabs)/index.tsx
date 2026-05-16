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
import { SaveToast } from "@/src/components/SaveToast";
import { AGE_MODES, AgeMode, COLORS } from "@/src/theme";

// Tiny hook that pings the backend every 15s to decide live vs offline mode.
function useOnlineStatus() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    let alive = true;
    const ping = async () => {
      try {
        const ctl = new AbortController();
        const t = setTimeout(() => ctl.abort(), 3000);
        const r = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/`, { signal: ctl.signal });
        clearTimeout(t);
        if (alive) setOnline(r.ok);
      } catch {
        if (alive) setOnline(false);
      }
    };
    ping();
    const id = setInterval(ping, 15000);
    return () => { alive = false; clearInterval(id); };
  }, []);
  return online;
}

export default function FeedScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { user, uid, bumpStreak, addXP, setAgeMode } = useUser();
  const online = useOnlineStatus();
  const [cards, setCards] = useState<CardData[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showModePicker, setShowModePicker] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const seenRef = useRef<Set<string>>(new Set());
  const lastViewIdRef = useRef<string | null>(null);
  const lastViewAtRef = useRef<number>(0);

  const cardHeight = useMemo(() => {
    // available height = window - top bar - bottom tab (~ 88/68)
    const tabBar = Platform.OS === "ios" ? 88 : 68;
    return height - tabBar;
  }, [height]);

  // Stable string of topics for dep tracking — avoids array-identity churn
  const topicsKey = (user?.selected_topics || []).slice().sort().join(",");
  const ageMode = user?.age_mode;
  const loadedKeyRef = useRef<string>("");

  const load = useCallback(async () => {
    if (!uid || !ageMode) return;
    const key = `${uid}|${ageMode}|${topicsKey}`;
    if (loadedKeyRef.current === key) return;
    loadedKeyRef.current = key;
    setLoading(true);
    try {
      // Try the annealed (personalised) feed first; fall back to topic-filtered seed.
      let res: { cards: CardData[] };
      try {
        res = await api.annealedFeed(uid);
        if (!res.cards.length) throw new Error("empty");
      } catch {
        const topics = topicsKey ? topicsKey.split(",") : [];
        res = await api.getSeedCards(topics, ageMode);
      }
      setCards(res.cards);
      const saved = await api.listSaved(uid);
      setSavedIds(new Set(saved.cards.map((c) => c.card_id)));
    } catch (e) {
      console.warn("feed load failed", e);
    } finally {
      setLoading(false);
    }
  }, [uid, ageMode, topicsKey]);

  // Load feed only when user identity / age / topics actually change
  useEffect(() => {
    load();
  }, [load]);

  // Bump streak once per mount (not on every reload)
  const streakBumpedRef = useRef(false);
  useEffect(() => {
    if (!uid || streakBumpedRef.current) return;
    streakBumpedRef.current = true;
    bumpStreak().catch(() => {});
  }, [uid, bumpStreak]);

  const handleViewable = useCallback(
    ({ viewableItems }: any) => {
      const item = viewableItems[0]?.item as CardData | undefined;
      if (!item || !uid) return;
      // Annealing signal: if previous card was visible <2s before swiping past, treat as "skip".
      const now = Date.now();
      const prevId = lastViewIdRef.current;
      if (prevId && prevId !== item.id) {
        const dwell = now - lastViewAtRef.current;
        if (dwell < 2200) {
          const prevCard = cards.find((c) => c.id === prevId);
          api.recordSkip(uid, prevId, prevCard?.subject).catch(() => {});
        }
      }
      lastViewIdRef.current = item.id;
      lastViewAtRef.current = now;
      if (seenRef.current.has(item.id)) return;
      seenRef.current.add(item.id);
      api.recordView(uid, item.id, item.subject).catch(() => {});
      addXP(item.type === "fact" ? 5 : item.type === "story" ? 8 : 5).catch(() => {});
    },
    [uid, addXP, cards],
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
        setShowSaveToast(true);
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
        <View style={styles.skeleton} testID="feed-skeleton">
          <View style={styles.skBar} />
          <View style={styles.skEmoji} />
          <View style={[styles.skLine, { width: "80%" }]} />
          <View style={[styles.skLine, { width: "60%" }]} />
          <View style={[styles.skLine, { width: "92%", height: 14, marginTop: 16 }]} />
          <View style={[styles.skLine, { width: "85%", height: 14 }]} />
          <View style={[styles.skLine, { width: "72%", height: 14 }]} />
        </View>
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
          <View
            style={[
              styles.connPill,
              online
                ? { backgroundColor: "rgba(76,175,80,0.18)", borderColor: COLORS.sproutGreen }
                : { backgroundColor: "rgba(255,184,48,0.18)", borderColor: COLORS.solarOrange },
            ]}
            testID="connectivity-pill"
          >
            <View
              style={[
                styles.connDot,
                { backgroundColor: online ? COLORS.sproutGreen : COLORS.solarOrange },
              ]}
            />
            <Text
              style={[
                styles.connText,
                { color: online ? COLORS.sproutGreen : COLORS.solarOrange },
              ]}
            >
              {online ? "LIVE" : "OFFLINE"}
            </Text>
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

      <SaveToast visible={showSaveToast} onDone={() => setShowSaveToast(false)} />
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
  connPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
  },
  connDot: { width: 6, height: 6, borderRadius: 3 },
  connText: { fontWeight: "900", fontSize: 10, letterSpacing: 0.8 },
  skeleton: {
    position: "absolute", top: 80, left: 20, right: 20,
    backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 22,
    padding: 22, borderWidth: 1, borderColor: COLORS.border,
  },
  skBar: { width: 90, height: 22, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.10)", marginBottom: 20 },
  skEmoji: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.08)", alignSelf: "center", marginBottom: 16,
  },
  skLine: {
    height: 22, borderRadius: 6, marginVertical: 6,
    backgroundColor: "rgba(255,255,255,0.08)", alignSelf: "center",
  },
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
