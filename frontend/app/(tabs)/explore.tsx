// Explore screen — browse subjects + AI card generator.
import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  TextInput, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SUBJECTS } from "@/src/theme";
import { api, CardData } from "@/src/api";
import { useUser } from "@/src/userContext";
import { STEMCard } from "@/src/components/STEMCard";
import { useWindowDimensions } from "react-native";

export default function ExploreScreen() {
  const { user } = useUser();
  const { height } = useWindowDimensions();
  const [topic, setTopic] = useState("");
  const [cardType, setCardType] = useState<"fact" | "quiz" | "experiment" | "story" | "diagram">("fact");
  const [generated, setGenerated] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!topic.trim()) {
      Alert.alert("Pick a topic", "Type something like 'volcanoes' or 'black holes'.");
      return;
    }
    setLoading(true);
    try {
      const card = await api.generateCard(topic.trim(), user?.age_mode || "discoverer", cardType);
      setGenerated(card);
    } catch (e: any) {
      Alert.alert("Couldn't generate", e?.message || "Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} testID="explore-screen">
      <LinearGradient colors={[COLORS.cosmos, COLORS.nebula]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={styles.h1}>Explore 🔭</Text>
        <Text style={styles.sub}>Ask the AI for a STEM card on anything.</Text>

        <View style={styles.inputBox}>
          <Ionicons name="search" size={18} color={COLORS.moonrock} />
          <TextInput
            style={styles.input}
            placeholder="e.g. volcanoes, gravity, the brain…"
            placeholderTextColor={COLORS.moonrock}
            value={topic}
            onChangeText={setTopic}
            testID="explore-topic-input"
            returnKeyType="search"
            onSubmitEditing={generate}
          />
        </View>

        <Text style={styles.sectionLabel}>Card type</Text>
        <View style={styles.typeRow}>
          {(["fact", "quiz", "experiment", "story", "diagram"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setCardType(t)}
              style={[styles.typeChip, cardType === t && styles.typeChipActive]}
              testID={`type-chip-${t}`}
            >
              <Text style={[styles.typeChipText, cardType === t && { color: COLORS.cosmos }]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.generateBtn, loading && { opacity: 0.6 }]}
          onPress={generate}
          disabled={loading}
          testID="generate-btn"
        >
          {loading ? (
            <ActivityIndicator color={COLORS.cosmos} />
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color={COLORS.cosmos} />
              <Text style={styles.generateText}>Generate card</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Or browse subjects</Text>
        <View style={styles.subjectGrid}>
          {Object.entries(SUBJECTS).map(([k, s]) => (
            <TouchableOpacity
              key={k}
              onPress={() => {
                setTopic(s.label.toLowerCase());
              }}
              testID={`subject-${k}`}
            >
              <LinearGradient
                colors={s.gradient as any}
                style={styles.subjTile}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={{ fontSize: 32 }}>{s.emoji}</Text>
                <Text style={styles.subjLabel}>{s.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {generated && (
          <View style={{ marginTop: 20, borderRadius: 24, overflow: "hidden" }} testID="generated-card-wrap">
            <STEMCard
              card={generated}
              ageMode={(user?.age_mode as any) || "discoverer"}
              isSaved={false}
              isND={user?.is_neurodiverse}
              height={Math.min(720, height * 0.85)}
              onSave={() => {}}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  h1: { color: COLORS.textPrimary, fontSize: 32, fontWeight: "900", letterSpacing: -0.8 },
  sub: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
  inputBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: COLORS.border, borderWidth: 1,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    marginTop: 20,
  },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: 15, fontWeight: "500" },
  sectionLabel: {
    color: COLORS.auroraTeal, fontWeight: "800", fontSize: 12,
    letterSpacing: 1, marginTop: 22, marginBottom: 10,
  },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: COLORS.border, borderWidth: 1, borderRadius: 16,
  },
  typeChipActive: { backgroundColor: COLORS.auroraTeal, borderColor: COLORS.auroraTeal },
  typeChipText: { color: COLORS.textPrimary, fontWeight: "700", fontSize: 13, textTransform: "capitalize" },
  generateBtn: {
    flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.auroraTeal,
    paddingVertical: 14, borderRadius: 24, marginTop: 18,
  },
  generateText: { color: COLORS.cosmos, fontWeight: "900", fontSize: 15 },
  subjectGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" },
  subjTile: {
    width: 100, height: 100, borderRadius: 16,
    alignItems: "center", justifyContent: "center", gap: 6,
    borderWidth: 1, borderColor: COLORS.border,
  },
  subjLabel: { color: COLORS.textPrimary, fontWeight: "700", fontSize: 12 },
});
