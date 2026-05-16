// Full-screen STEM card component — renders all 5 card types.
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Linking,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { CardData } from "@/src/api";
import { COLORS, SUBJECTS, AgeMode } from "@/src/theme";
import { getMascotForCard } from "@/src/mascots";
import { MascotAvatar } from "@/src/components/Mascot";
import { AnimatedMascot } from "@/src/components/AnimatedMascot";

interface Props {
  card: CardData;
  ageMode: AgeMode;
  isSaved: boolean;
  isND?: boolean;
  height: number;
  onSave: () => void;
  onQuizAnswer?: (idx: number, correct: boolean) => void;
}

export function STEMCard({ card, ageMode, isSaved, isND, height, onSave, onQuizAnswer }: Props) {
  const subject = SUBJECTS[card.subject] || SUBJECTS.physics;
  const mascot = getMascotForCard(card, ageMode, isND);
  const [speaking, setSpeaking] = useState(false);
  const verified = card.verified !== false && (card.confidence ?? 0.95) >= 0.85;
  const flagged = !verified && (card.confidence ?? 0) >= 0.65;

  const toggleSpeak = async () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    const utter = `${card.headline}. ${card.body}${card.explanation ? `. ${card.explanation}` : ""}`;
    Speech.speak(utter, {
      rate: ageMode === "explorer" ? 0.85 : 0.95,
      pitch: 1.05,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const openSource = () => {
    if (card.source_url) Linking.openURL(card.source_url).catch(() => {});
  };

  return (
    <View style={[styles.root, { height }]} testID={`card-${card.id}`}>
      <LinearGradient
        colors={[subject.gradient[0], COLORS.cosmos]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.inner}>
        {/* Top bar: subject + verification status + TTS */}
        <View style={styles.topBar} testID={`card-subject-${card.subject}`}>
          <View style={[styles.subjectPill, { borderColor: subject.color }]}>
            <Text style={styles.subjectEmoji}>{subject.emoji}</Text>
            <Text style={[styles.subjectLabel, { color: subject.color }]}>
              {subject.label.toUpperCase()}
            </Text>
          </View>
          {verified ? (
            <View style={styles.verifiedPill} testID="verified-badge">
              <Ionicons name="shield-checkmark" size={12} color={COLORS.sproutGreen} />
              <Text style={styles.verifiedText}>VERIFIED</Text>
            </View>
          ) : flagged ? (
            <View style={styles.unverifiedPill} testID="unverified-badge">
              <Ionicons name="warning" size={12} color={COLORS.solarOrange} />
              <Text style={styles.unverifiedText}>CHECK WITH A GROWN-UP</Text>
            </View>
          ) : null}
          <TouchableOpacity
            onPress={toggleSpeak}
            style={[styles.ttsBtn, speaking && { backgroundColor: COLORS.auroraTeal, borderColor: COLORS.auroraTeal }]}
            testID="tts-btn"
            accessibilityLabel="Read aloud"
          >
            <Ionicons
              name={speaking ? "volume-high" : "volume-medium-outline"}
              size={16}
              color={speaking ? COLORS.cosmos : COLORS.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Body */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.emoji}>{card.emoji}</Text>
          <Text style={styles.headline} testID="card-headline">{card.headline}</Text>

          {card.type === "fact" && <FactBody card={card} ageMode={ageMode} />}
          {card.type === "quiz" && (
            <QuizBody card={card} mascot={mascot} onAnswer={onQuizAnswer} />
          )}
          {card.type === "experiment" && <ExperimentBody card={card} />}
          {card.type === "story" && <StoryBody card={card} />}
          {card.type === "diagram" && <DiagramBody card={card} />}

          {card.source ? (
            <TouchableOpacity
              style={styles.sourcePill}
              onPress={openSource}
              disabled={!card.source_url}
              testID="source-pill"
            >
              <Ionicons name="library-outline" size={13} color={COLORS.auroraTeal} />
              <Text style={styles.sourceText}>Source: {card.source}</Text>
              {card.source_url ? (
                <Ionicons name="open-outline" size={13} color={COLORS.auroraTeal} />
              ) : null}
            </TouchableOpacity>
          ) : null}

          {/* Mascot footer */}
          <View style={styles.mascotFooter}>
            <MascotAvatar mascot={mascot} size="sm" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.mascotName}>{mascot.name}</Text>
              <Text style={styles.mascotTagline}>{mascot.tagline}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Action bar */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, isSaved && { backgroundColor: "rgba(255,94,125,0.2)", borderColor: COLORS.plasmaPink }]}
            onPress={onSave}
            testID="save-heart-btn"
          >
            <Ionicons
              name={isSaved ? "heart" : "heart-outline"}
              size={22}
              color={isSaved ? COLORS.plasmaPink : COLORS.textPrimary}
            />
            <Text style={[styles.actionLabel, isSaved && { color: COLORS.plasmaPink }]}>
              {isSaved ? "Saved" : "Save"}
            </Text>
          </TouchableOpacity>
          <View style={styles.xpBadge} testID="xp-badge">
            <Ionicons name="flash" size={16} color={COLORS.solarOrange} />
            <Text style={styles.xpText}>+{card.xpValue || 5} XP</Text>
          </View>
          <View style={styles.swipeHint}>
            <Ionicons name="chevron-up" size={20} color={COLORS.moonrock} />
            <Text style={styles.swipeText}>Swipe</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function cardTypeLabel(t: string) {
  return ({ fact: "FACT", quiz: "QUIZ", experiment: "TRY IT", story: "STORY", diagram: "DIAGRAM" } as any)[t] || t.toUpperCase();
}

function FactBody({ card, ageMode }: { card: CardData; ageMode: AgeMode }) {
  return <Text style={[styles.body, ageMode === "explorer" && styles.bodyLarge]}>{card.body}</Text>;
}

function QuizBody({
  card,
  mascot,
  onAnswer,
}: {
  card: CardData;
  mascot: ReturnType<typeof getMascotForCard>;
  onAnswer?: (idx: number, correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const correct = card.correctAnswer ?? 0;
  const isCorrect = picked === correct;
  const reactionPose = picked === null ? "default" : isCorrect ? "thumbsUp" : "surprise";

  return (
    <View>
      <Text style={styles.body}>{card.body}</Text>
      <View style={{ marginTop: 16, gap: 10 }}>
        {(card.quizOptions || []).map((opt, idx) => {
          const isPicked = picked === idx;
          const showResult = picked !== null;
          const isCorrectAns = idx === correct;
          let extra = {};
          if (showResult && isCorrectAns) extra = { borderColor: COLORS.sproutGreen, backgroundColor: "rgba(76,175,80,0.18)" };
          else if (showResult && isPicked && !isCorrectAns)
            extra = { borderColor: COLORS.plasmaPink, backgroundColor: "rgba(255,94,125,0.18)" };
          return (
            <Pressable
              key={idx}
              testID={`card-quiz-option-${idx}`}
              disabled={picked !== null}
              onPress={() => {
                setPicked(idx);
                onAnswer?.(idx, idx === correct);
              }}
              style={[styles.quizOpt, extra]}
            >
              <Text style={styles.quizLetter}>{String.fromCharCode(65 + idx)}</Text>
              <Text style={styles.quizText}>{opt}</Text>
              {showResult && isCorrectAns && (
                <Ionicons name="checkmark-circle" size={22} color={COLORS.sproutGreen} />
              )}
              {showResult && isPicked && !isCorrectAns && (
                <Ionicons name="close-circle" size={22} color={COLORS.plasmaPink} />
              )}
            </Pressable>
          );
        })}
      </View>
      {picked !== null && (
        <View style={styles.reactRow}>
          <AnimatedMascot
            mascot={mascot}
            pose={reactionPose}
            size="md"
            variant="celebrate"
            testID="quiz-mascot-reaction"
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.reactLabel, { color: isCorrect ? COLORS.sproutGreen : COLORS.plasmaPink }]}>
              {isCorrect ? mascot.messages.quizRight : mascot.messages.quizWrong}
            </Text>
            {card.explanation ? (
              <Text style={styles.explainText} testID="quiz-explanation">{card.explanation}</Text>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
}

function ExperimentBody({ card }: { card: CardData }) {
  const [reveal, setReveal] = useState(false);
  return (
    <View>
      <Text style={styles.body}>{card.body}</Text>
      <Text style={styles.sectionLabel}>You'll need:</Text>
      {(card.materials || []).map((m, i) => (
        <Text key={i} style={styles.bullet}>• {m}</Text>
      ))}
      <Text style={styles.sectionLabel}>Steps:</Text>
      {(card.steps || []).map((s, i) => (
        <Text key={i} style={styles.bullet}>{i + 1}. {s}</Text>
      ))}
      <TouchableOpacity
        style={styles.revealBtn}
        onPress={() => setReveal((r) => !r)}
        testID="reveal-result-btn"
      >
        <Ionicons name={reveal ? "eye-off" : "eye"} size={18} color={COLORS.auroraTeal} />
        <Text style={styles.revealText}>{reveal ? "Hide" : "What happens?"}</Text>
      </TouchableOpacity>
      {reveal && card.whatHappens ? (
        <View style={styles.explainBox}>
          <Text style={styles.explainLabel}>The science:</Text>
          <Text style={styles.explainText}>{card.whatHappens}</Text>
          {card.parentNote ? (
            <Text style={[styles.explainText, { marginTop: 8, fontStyle: "italic" }]}>
              📝 {card.parentNote}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function StoryBody({ card }: { card: CardData }) {
  return <Text style={[styles.body, { fontStyle: "italic" }]}>{card.body}</Text>;
}

function DiagramBody({ card }: { card: CardData }) {
  return (
    <View>
      <Text style={styles.body}>{card.body}</Text>
      <View style={{ marginTop: 16, gap: 10 }}>
        {(card.diagramParts || []).map((p, i) => (
          <View key={i} style={styles.diagramRow}>
            <View style={styles.diagramDot}>
              <Text style={styles.diagramDotText}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.diagramLabel}>{p.label}</Text>
              <Text style={styles.diagramDesc}>{p.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: "100%", overflow: "hidden", backgroundColor: COLORS.cosmos },
  inner: { flex: 1, padding: 20, paddingTop: 24 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  subjectPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  subjectEmoji: { fontSize: 16 },
  subjectLabel: { fontWeight: "800", fontSize: 11, letterSpacing: 1 },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  typeText: { color: COLORS.textPrimary, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  bodyContent: { paddingBottom: 24 },
  emoji: { fontSize: 76, textAlign: "center", marginVertical: 8 },
  headline: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 34,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  body: { color: COLORS.stardust, fontSize: 17, lineHeight: 25, fontWeight: "400" },
  bodyLarge: { fontSize: 20, lineHeight: 28 },
  source: { color: COLORS.moonrock, fontSize: 11, marginTop: 16, fontStyle: "italic" },
  sourcePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 16, alignSelf: "flex-start",
    backgroundColor: "rgba(0,229,195,0.10)",
    borderColor: COLORS.auroraTeal, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
  },
  sourceText: { color: COLORS.auroraTeal, fontSize: 12, fontWeight: "700" },
  verifiedPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
    backgroundColor: "rgba(76,175,80,0.18)",
    borderColor: COLORS.sproutGreen, borderWidth: 1,
  },
  verifiedText: { color: COLORS.sproutGreen, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  unverifiedPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
    backgroundColor: "rgba(255,184,48,0.18)",
    borderColor: COLORS.solarOrange, borderWidth: 1,
  },
  unverifiedText: { color: COLORS.solarOrange, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  ttsBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1, borderColor: COLORS.border,
  },

  quizOpt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: COLORS.border,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  quizLetter: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    color: COLORS.textPrimary,
    textAlign: "center", lineHeight: 28,
    fontWeight: "800", fontSize: 13,
  },
  quizText: { color: COLORS.textPrimary, fontSize: 15, fontWeight: "600", flex: 1 },

  explainBox: {
    marginTop: 14,
    backgroundColor: "rgba(0,229,195,0.08)",
    borderColor: COLORS.auroraTeal,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  explainLabel: { color: COLORS.auroraTeal, fontWeight: "700", fontSize: 13, marginBottom: 6 },
  explainText: { color: COLORS.textPrimary, fontSize: 15, lineHeight: 21 },

  reactRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    marginTop: 14,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderColor: COLORS.border, borderWidth: 1,
    borderRadius: 16, padding: 12,
  },
  reactLabel: { fontWeight: "800", fontSize: 15, marginBottom: 4 },

  sectionLabel: { color: COLORS.auroraTeal, fontWeight: "800", fontSize: 13, marginTop: 14, marginBottom: 6, letterSpacing: 0.5 },
  bullet: { color: COLORS.stardust, fontSize: 15, lineHeight: 22 },

  revealBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 14, paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: "rgba(0,229,195,0.1)",
    borderColor: COLORS.auroraTeal,
    borderWidth: 1, borderRadius: 12,
    alignSelf: "flex-start",
  },
  revealText: { color: COLORS.auroraTeal, fontWeight: "700", fontSize: 14 },

  diagramRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  diagramDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.auroraTeal,
    alignItems: "center", justifyContent: "center",
  },
  diagramDotText: { color: COLORS.cosmos, fontWeight: "900", fontSize: 13 },
  diagramLabel: { color: COLORS.textPrimary, fontWeight: "700", fontSize: 15 },
  diagramDesc: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },

  mascotFooter: {
    flexDirection: "row", alignItems: "center", marginTop: 18,
    padding: 12, backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  mascotName: { color: COLORS.textPrimary, fontWeight: "800", fontSize: 14 },
  mascotTagline: { color: COLORS.textSecondary, fontSize: 12 },

  actions: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingTop: 8,
  },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14,
  },
  actionLabel: { color: COLORS.textPrimary, fontWeight: "700", fontSize: 14 },
  xpBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: "rgba(255,184,48,0.15)",
    borderColor: COLORS.solarOrange, borderWidth: 1, borderRadius: 12,
  },
  xpText: { color: COLORS.solarOrange, fontWeight: "800", fontSize: 12 },
  swipeHint: { marginLeft: "auto", alignItems: "center" },
  swipeText: { color: COLORS.moonrock, fontSize: 10, fontWeight: "700", letterSpacing: 1 },
});
