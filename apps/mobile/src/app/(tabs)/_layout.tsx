import { StyleSheet, View } from "react-native";
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

/**
 * Píldora flotante en la pestaña activa: el ícono se asienta sobre un fondo
 * brand redondeado, como las tab bars de apps de streaming (look pro, no
 * solo cambio de color).
 */
function TabIcon({ icon: Icon, focused }: { icon: LucideIcon; focused: boolean }) {
  return (
    <View style={[styles.pill, focused && styles.pillActive]}>
      <Icon
        size={20}
        color={focused ? "#FFFFFF" : colors.textFaint}
        strokeWidth={focused ? 2.4 : 2}
      />
    </View>
  );
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
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarBackground: () => (
          <BlurView tint="dark" intensity={70} style={StyleSheet.absoluteFill} />
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
        options={{ title: "Inicio", tabBarIcon: ({ focused }) => <TabIcon icon={Home} focused={focused} /> }}
      />
      <Tabs.Screen
        name="canales"
        options={{ title: "Canales", tabBarIcon: ({ focused }) => <TabIcon icon={Tv} focused={focused} /> }}
      />
      <Tabs.Screen
        name="favoritos"
        options={{ title: "Favoritos", tabBarIcon: ({ focused }) => <TabIcon icon={Star} focused={focused} /> }}
      />
      <Tabs.Screen
        name="buscar"
        options={{ title: "Buscar", tabBarIcon: ({ focused }) => <TabIcon icon={Search} focused={focused} /> }}
      />
      <Tabs.Screen
        name="mas"
        options={{ title: "Más", tabBarIcon: ({ focused }) => <TabIcon icon={MoreHorizontal} focused={focused} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  pill: {
    width: 46,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  pillActive: {
    backgroundColor: colors.brand,
  },
});
