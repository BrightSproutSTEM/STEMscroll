// Static registry mapping mascotId+pose to require() image sources.
// Only assets bundled into the app are listed here; absence falls back to emoji.
import type { ImageSourcePropType } from "react-native";

export const MASCOT_IMAGES: Record<string, Record<string, ImageSourcePropType>> = {
  sprouty: {
    default: require("../assets/mascots/sprouty/default.png"),
    thumbsUp: require("../assets/mascots/sprouty/default.png"),
    surprise: require("../assets/mascots/sprouty/surprise.png"),
    thinking: require("../assets/mascots/sprouty/thinking.png"),
    eureka: require("../assets/mascots/sprouty/thinking.png"),
    celebrate: require("../assets/mascots/sprouty/default.png"),
  },
  ausomeKoala: {
    default: require("../assets/mascots/ausome-koala/koala-default.png"),
    armsUp: require("../assets/mascots/ausome-koala/koala-armsup.png"),
    sensory: require("../assets/mascots/ausome-koala/koala-sensory.png"),
    front: require("../assets/mascots/ausome-koala/koala-front.png"),
    single: require("../assets/mascots/ausome-koala/koala-single.png"),
    celebrate: require("../assets/mascots/ausome-koala/koala-armsup.png"),
  },
  drSprout: {
    default: require("../assets/mascots/dr-sprout/thumbsup.png"),
    victory: require("../assets/mascots/dr-sprout/victory.png"),
    thumbsUp: require("../assets/mascots/dr-sprout/thumbsup.png"),
    surprise: require("../assets/mascots/dr-sprout/surprise.png"),
    starJump: require("../assets/mascots/dr-sprout/starjump.png"),
    meditating: require("../assets/mascots/dr-sprout/meditating.png"),
    celebrate: require("../assets/mascots/dr-sprout/victory.png"),
  },
  quizzle: {
    default: require("../assets/mascots/quizzle/default.png"),
    celebrate: require("../assets/mascots/quizzle/default.png"),
  },
  wombles: {
    default: require("../assets/mascots/wombles/default.png"),
    celebrate: require("../assets/mascots/wombles/default.png"),
  },
  zoomerroo: {
    default: require("../assets/mascots/zoomerroo/default.png"),
    celebrate: require("../assets/mascots/zoomerroo/default.png"),
  },
  neuroSprouty: {
    default: require("../assets/mascots/neuro-sprouty/happy.png"),
    happy: require("../assets/mascots/neuro-sprouty/happy.png"),
    brainwave: require("../assets/mascots/neuro-sprouty/brainwave.png"),
    aac: require("../assets/mascots/neuro-sprouty/aac.png"),
    selfHug: require("../assets/mascots/neuro-sprouty/selfhug.png"),
    kisses: require("../assets/mascots/neuro-sprouty/kisses.png"),
    celebrate: require("../assets/mascots/neuro-sprouty/brainwave.png"),
  },
};

export function getMascotImage(mascotId: string, pose = "default"): ImageSourcePropType | null {
  const set = MASCOT_IMAGES[mascotId];
  if (!set) return null;
  return set[pose] || set.default || null;
}
