// Root layout for STEMScroll: wraps app in UserProvider + Stack navigation.
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { UserProvider } from "@/src/userContext";
import { LevelUpOverlay } from "@/src/components/LevelUpOverlay";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0B0F2E" } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="mission/[id]" options={{ presentation: "modal" }} />
        </Stack>
        <LevelUpOverlay />
      </UserProvider>
    </SafeAreaProvider>
  );
}
