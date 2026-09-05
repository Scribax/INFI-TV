import { StyleSheet, type ColorValue } from "react-native";
import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Home,
  Tv,
  Star,
  Search,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react-native";
import { colors, fonts } from "@/constants/theme";

function TabIcon({
  icon: Icon,
  color,
}: {
  icon: LucideIcon;
  color: ColorValue;
}) {
  return <Icon size={21} color={color as string} strokeWidth={2} />;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          position: "absolute",
          borderTopColor: "transparent",
          backgroundColor: "transparent",
          elevation: 0,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
        },
        tabBarBackground: () => (
          <BlurView
            tint="dark"
            intensity={70}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          fontFamily: fonts.semibold,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Inicio", tabBarIcon: ({ color }) => <TabIcon icon={Home} color={color} /> }}
      />
      <Tabs.Screen
        name="canales"
        options={{ title: "Canales", tabBarIcon: ({ color }) => <TabIcon icon={Tv} color={color} /> }}
      />
      <Tabs.Screen
        name="favoritos"
        options={{ title: "Favoritos", tabBarIcon: ({ color }) => <TabIcon icon={Star} color={color} /> }}
      />
      <Tabs.Screen
        name="buscar"
        options={{ title: "Buscar", tabBarIcon: ({ color }) => <TabIcon icon={Search} color={color} /> }}
      />
      <Tabs.Screen
        name="mas"
        options={{ title: "Más", tabBarIcon: ({ color }) => <TabIcon icon={MoreHorizontal} color={color} /> }}
      />
    </Tabs>
  );
}
