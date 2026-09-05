import { Text } from "react-native";
import { Tabs } from "expo-router";
import { colors } from "@/constants/theme";

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 18 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Inicio", tabBarIcon: () => <TabIcon emoji="🏠" /> }}
      />
      <Tabs.Screen
        name="canales"
        options={{ title: "Canales", tabBarIcon: () => <TabIcon emoji="📺" /> }}
      />
      <Tabs.Screen
        name="favoritos"
        options={{ title: "Favoritos", tabBarIcon: () => <TabIcon emoji="⭐" /> }}
      />
      <Tabs.Screen
        name="buscar"
        options={{ title: "Buscar", tabBarIcon: () => <TabIcon emoji="🔎" /> }}
      />
      <Tabs.Screen
        name="mas"
        options={{ title: "Más", tabBarIcon: () => <TabIcon emoji="⋯" /> }}
      />
    </Tabs>
  );
}
