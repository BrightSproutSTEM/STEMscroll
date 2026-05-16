// 4-step onboarding: welcome → age picker → topic picker → growth plan / start.
import { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@/src/userContext";
import { AGE_MODES, AgeMode, COLORS, SUBJECTS } from "@/src/theme";
import { MASCOTS, getMascotForCard } from "@/src/mascots";
import { MascotAvatar } from "@/src/components/Mascot";

const TOPIC_KEYS = Object.keys(SUBJECTS);

export default function Onboarding() {
  const { onboard } = useUser();
  const [step, setStep] = useState(0);
  const [ageMode, setAgeMode] = useState<AgeMode | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [isND, setIsND] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = async () => {
    if (!ageMode) return;
    setSubmitting(true);
    try {
      await onboard(ageMode, topics.length ? topics : TOPIC_KEYS.slice(0, 4), isND);
      router.replace("/(tabs)");
    } finally {
      setSubmitting(false);
    }
  };

  const mascot = ageMode
    ? getMascotForCard({ subject: "physics" }, ageMode, isND)
    : MASCOTS.sprouty;

  return (
    <SafeAreaView style={styles.root} testID="onboarding-screen">
      <LinearGradient colors={[COLORS.cosmos, COLORS.nebula]} style={StyleSheet.absoluteFill} />

      <View style={styles.progressBar}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i <= step && { backgroundColor: COLORS.auroraTeal, width: 32 },
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {step === 0 && (
          <View style={styles.center} testID="onboarding-step-0">
            <MascotAvatar mascot={MASCOTS.sprouty} size="xl" />
            <Text style={styles.h1}>Hello, curious mind!</Text>
            <Text style={styles.sub}>
              Replace <Text style={styles.strike}>doom scrolling</Text> with{" "}
              <Text style={{ color: COLORS.auroraTeal, fontWeight: "900" }}>WONDER</Text>.
            </Text>
            <Text style={styles.copy}>
              Hi! I&apos;m Sprouty. I&apos;ll help you discover bite-sized STEM ideas every day.
              No ads. No paywalls. Just wonder. 🌱
            </Text>
            <Pressable
              style={[styles.toggleRow, isND && styles.toggleRowActive]}
              onPress={() => setIsND((v) => !v)}
              testID="neurodiverse-toggle"
            >
              <Ionicons
                name={isND ? "checkbox" : "square-outline"}
                size={22}
                color={isND ? COLORS.auroraTeal : COLORS.moonrock}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>I&apos;m a neurodiverse family</Text>
                <Text style={styles.toggleHint}>Enables sensory-friendly defaults 🎧</Text>
              </View>
            </Pressable>
          </View>
        )}

        {step === 1 && (
          <View testID="onboarding-step-1">
            <Text style={styles.h1}>Who&apos;s exploring today?</Text>
            <Text style={styles.sub}>Pick a reading level — you can change it anytime.</Text>
            <View style={{ gap: 12, marginTop: 16 }}>
              {AGE_MODES.map((m) => {
                const active = ageMode === m.id;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => setAgeMode(m.id as AgeMode)}
                    style={[styles.ageCard, active && styles.ageCardActive]}
                    testID={`age-mode-${m.id}`}
                  >
                    <Text style={{ fontSize: 36 }}>{m.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ageTitle}>{m.label}</Text>
                      <Text style={styles.ageDesc}>{m.desc}</Text>
                    </View>
                    {active && (
                      <Ionicons name="checkmark-circle" size={26} color={COLORS.auroraTeal} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {step === 2 && (
          <View testID="onboarding-step-2">
            <Text style={styles.h1}>What sparks your curiosity?</Text>
            <Text style={styles.sub}>Pick up to 4. We&apos;ll show you a mix.</Text>
            <View style={styles.topicGrid}>
              {TOPIC_KEYS.map((k) => {
                const s = SUBJECTS[k];
                const active = topics.includes(k);
                return (
                  <Pressable
                    key={k}
                    onPress={() => {
                      setTopics((prev) => {
                        if (prev.includes(k)) return prev.filter((x) => x !== k);
                        if (prev.length >= 4) return prev;
                        return [...prev, k];
                      });
                    }}
                    style={[
                      styles.topicTile,
                      active && { borderColor: s.color, backgroundColor: s.gradient[0] },
                    ]}
                    testID={`topic-${k}`}
                  >
                    <Text style={{ fontSize: 32 }}>{s.emoji}</Text>
                    <Text style={styles.topicLabel}>{s.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.center} testID="onboarding-step-3">
            <MascotAvatar
              mascot={mascot}
              size="xl"
              pose={mascot.id === "ausomeKoala" ? "armsUp" : "default"}
            />
            <Text style={styles.h1}>Your plan is ready!</Text>
            <Text style={styles.sub}>{mascot.messages.greeting}</Text>
            <View style={styles.planRow}>
              <View style={styles.planStat}>
                <Text style={styles.planNum}>5</Text>
                <Text style={styles.planLbl}>cards{"\n"}per day</Text>
              </View>
              <View style={styles.planStat}>
                <Text style={styles.planNum}>{topics.length || 4}</Text>
                <Text style={styles.planLbl}>topics{"\n"}picked</Text>
              </View>
              <View style={styles.planStat}>
                <Text style={styles.planNum}>🔥</Text>
                <Text style={styles.planLbl}>streaks{"\n"}unlocked</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={back} testID="back-btn">
            <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}
        {step < 3 ? (
          <TouchableOpacity
            style={[styles.primaryBtn, step === 1 && !ageMode && { opacity: 0.4 }]}
            disabled={step === 1 && !ageMode}
            onPress={next}
            testID="next-btn"
          >
            <Text style={styles.primaryBtnText}>{step === 0 ? "Let's go" : "Continue"}</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.cosmos} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, submitting && { opacity: 0.6 }]}
            disabled={submitting}
            onPress={finish}
            testID="finish-btn"
          >
            <Text style={styles.primaryBtnText}>Start exploring</Text>
            <Ionicons name="sparkles" size={20} color={COLORS.cosmos} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cosmos },
  progressBar: {
    flexDirection: "row", gap: 6, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4,
    justifyContent: "center",
  },
  progressDot: {
    width: 16, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.15)",
  },
  scroll: { padding: 24, paddingBottom: 24, flexGrow: 1 },
  center: { alignItems: "center", gap: 16 },
  h1: { color: COLORS.textPrimary, fontSize: 30, fontWeight: "900", textAlign: "center", letterSpacing: -0.8, marginTop: 12 },
  sub: { color: COLORS.textSecondary, fontSize: 16, textAlign: "center", lineHeight: 23, marginTop: 4 },
  copy: { color: COLORS.stardust, fontSize: 15, textAlign: "center", lineHeight: 22, marginTop: 12, paddingHorizontal: 8 },
  strike: { textDecorationLine: "line-through", color: COLORS.moonrock },

  toggleRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: COLORS.border,
    marginTop: 22,
  },
  toggleRowActive: { borderColor: COLORS.auroraTeal, backgroundColor: "rgba(0,229,195,0.08)" },
  toggleTitle: { color: COLORS.textPrimary, fontWeight: "700", fontSize: 14 },
  toggleHint: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },

  ageCard: {
    flexDirection: "row", alignItems: "center", gap: 16,
    padding: 16, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  ageCardActive: { borderColor: COLORS.auroraTeal, backgroundColor: "rgba(0,229,195,0.1)" },
  ageTitle: { color: COLORS.textPrimary, fontWeight: "800", fontSize: 18 },
  ageDesc: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },

  topicGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 16, justifyContent: "space-between" },
  topicTile: {
    width: "48%", aspectRatio: 1,
    borderRadius: 18, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center", justifyContent: "center", gap: 8, padding: 8,
  },
  topicLabel: { color: COLORS.textPrimary, fontWeight: "700", fontSize: 14, textAlign: "center" },

  planRow: { flexDirection: "row", gap: 12, marginTop: 24, width: "100%", justifyContent: "space-between" },
  planStat: {
    flex: 1, alignItems: "center", padding: 16, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: COLORS.border,
  },
  planNum: { color: COLORS.auroraTeal, fontSize: 32, fontWeight: "900" },
  planLbl: { color: COLORS.textSecondary, fontSize: 11, textAlign: "center", marginTop: 4, lineHeight: 14 },

  footer: { flexDirection: "row", gap: 12, padding: 20, paddingBottom: 24 },
  backBtn: {
    width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: COLORS.border,
  },
  primaryBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: COLORS.auroraTeal, paddingVertical: 16, borderRadius: 28,
  },
  primaryBtnText: { color: COLORS.cosmos, fontWeight: "900", fontSize: 16 },
});
