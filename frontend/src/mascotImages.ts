// Static registry mapping mascotId+pose to require() image sources.
// Only assets bundled into the app are listed here; absence falls back to emoji.
import type { ImageSourcePropType } from "react-native";

export const MASCOT_IMAGES: Record<string, Record<string, ImageSourcePropType>> = {
  ausomeKoala: {
    default: require("../assets/mascots/ausome-koala/koala-default.png"),
    armsUp: require("../assets/mascots/ausome-koala/koala-armsup.png"),
    sensory: require("../assets/mascots/ausome-koala/koala-sensory.png"),
    front: require("../assets/mascots/ausome-koala/koala-front.png"),
    single: require("../assets/mascots/ausome-koala/koala-single.png"),
    celebrate: require("../assets/mascots/ausome-koala/koala-armsup.png"),
  },
};

export function getMascotImage(mascotId: string, pose = "default"): ImageSourcePropType | null {
  const set = MASCOT_IMAGES[mascotId];
  if (!set) return null;
  return set[pose] || set.default || null;
}
