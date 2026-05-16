// Mascot registry — emoji-based placeholders rendered as gradient circular avatars.
export type MascotId = "sprouty" | "drSprout" | "ausomeKoala" | "quizzle" | "wombles" | "zoomerroo" | "neuroSprouty";

export interface Mascot {
  id: MascotId;
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  tagline: string;
  messages: {
    greeting: string;
    encourage: string;
    quizRight: string;
    quizWrong: string;
    save?: string;
    empty?: string;
    streak?: string;
    intro?: string;
  };
}

export const MASCOTS: Record<MascotId, Mascot> = {
  sprouty: {
    id: "sprouty",
    name: "Sprouty",
    emoji: "🌱",
    color: "#4CAF50",
    bgColor: "rgba(76,175,80,0.18)",
    tagline: "Your STEM buddy",
    messages: {
      greeting: "Hi! I'm Sprouty! Ready to discover something amazing? 🌱",
      encourage: "You're doing great! Keep growing your brain!",
      quizRight: "YES! You nailed it! You're a STEM superstar! ⭐",
      quizWrong: "Oops! Now you know! Sprouty believes in you!",
      save: "Saved! Your brain library is growing!",
      empty: "Tap ♥ on any card to save it here!",
      streak: "🔥 Your streak is on fire! Keep it up!",
    },
  },
  drSprout: {
    id: "drSprout",
    name: "Dr. Sprout",
    emoji: "🥼",
    color: "#2E7D32",
    bgColor: "rgba(46,125,50,0.2)",
    tagline: "The brilliant scientist",
    messages: {
      greeting: "Dr. Sprout here. Let's explore the science behind everything. 🔬",
      encourage: "Excellent thinking, young scientist!",
      quizRight: "Correct! Concept applied perfectly.",
      quizWrong: "Not quite — that's the scientific method. Observe, adjust, try again.",
      streak: "Consistent daily learning is how great scientists work.",
    },
  },
  ausomeKoala: {
    id: "ausomeKoala",
    name: "Ausome",
    emoji: "🐨",
    color: "#9C7FD4",
    bgColor: "rgba(156,127,212,0.2)",
    tagline: "Every brain is brilliant",
    messages: {
      greeting: "Hey! I'm Ausome! Different brains are brilliant brains! 🎧",
      encourage: "You're doing this YOUR way — and that's the best way!",
      quizRight: "Your unique brain got it exactly right! 🌈",
      quizWrong: "That's okay! We can come back to this. No rush.",
    },
  },
  quizzle: {
    id: "quizzle",
    name: "Quizzle",
    emoji: "❓",
    color: "#F5A623",
    bgColor: "rgba(245,166,35,0.2)",
    tagline: "Quiz champion",
    messages: {
      greeting: "Quiz time! 🎯",
      encourage: "Take your time… Quizzle believes you know this!",
      quizRight: "BOOM! Quizzle's doing a happy dance! 🎉",
      quizWrong: "Oops! The answer was hiding — now you know where!",
      intro: "Quick Quiz with Quizzle! 🎯 Think carefully…",
    },
  },
  wombles: {
    id: "wombles",
    name: "Wombles",
    emoji: "🥽",
    color: "#8D6E63",
    bgColor: "rgba(141,110,99,0.25)",
    tagline: "Hands-on expert",
    messages: {
      greeting: "Wombles here! Time to get your hands busy! 🥽",
      encourage: "Science is messy and that's WONDERFUL!",
      quizRight: "Did you see that?! THAT is real science happening!",
      quizWrong: "Try again — even Einstein made messes!",
      intro: "Goggles on? Ask a grown-up to help? Let's go!",
    },
  },
  zoomerroo: {
    id: "zoomerroo",
    name: "Zoomerroo",
    emoji: "🦘",
    color: "#FF6D00",
    bgColor: "rgba(255,109,0,0.2)",
    tagline: "Tech explorer",
    messages: {
      greeting: "Zoomerroo is ZOOMING in with today's STEM discovery! ⚡",
      encourage: "Every coder started exactly where you are now!",
      quizRight: "ZOOOM! Right on target!",
      quizWrong: "Re-route and try again — that's how engineers work!",
      streak: "Your STEM streak is charging up! ⚡",
    },
  },
  neuroSprouty: {
    id: "neuroSprouty",
    name: "Neuro",
    emoji: "🧠",
    color: "#76C442",
    bgColor: "rgba(118,196,66,0.2)",
    tagline: "Neurodiverse champion",
    messages: {
      greeting: "Every kind of brain is welcome here! 🧠🌈",
      encourage: "Neurodiversity is a superpower!",
      quizRight: "Your brain is brilliant!",
      quizWrong: "Take a breath. Try again at your pace.",
    },
  },
};

export function getMascotForCard(card: { type?: string; subject?: string; mascot?: string }, ageMode: string, isND = false): Mascot {
  if (card?.mascot && (card.mascot as MascotId) in MASCOTS) return MASCOTS[card.mascot as MascotId];
  if (card?.type === "quiz") return MASCOTS.quizzle;
  if (card?.type === "experiment") return MASCOTS.wombles;
  if (["technology", "engineering", "maths"].includes(card?.subject || "")) return MASCOTS.zoomerroo;
  if (ageMode === "scientist" || ageMode === "guide") return MASCOTS.drSprout;
  if (isND) return MASCOTS.ausomeKoala;
  return MASCOTS.sprouty;
}
