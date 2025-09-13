// store/useCategoryTheme.ts
import {
  BookOpen,
  Brush,
  Building2,
  Club,
  CookingPot,
  Home,
  Hotel,
  Lamp,
  LayoutGrid,
  MonitorSmartphone,
  Smartphone,
} from "lucide-react-native";
import { create } from "zustand";

export type CategoryItem = { name: string; icon: any };

type ThemeState = {
  activeColor: string;
  gradientActive: readonly [string, string];
  gradientInactive: readonly [string, string];
  underlineColor: string;
  categories: CategoryItem[];

  setThemePayload: (
    payload: Partial<Omit<ThemeState, "setThemePayload">>
  ) => void;
  setThemePreset: (preset: "green" | "blue") => void;
};

export const useCategoryTheme = create<ThemeState>((set) => ({
  // Default (green/mint)
  activeColor: "#26FF91",
  gradientActive: ["#BEFBE0", "#FFFFFF"] as const,
  gradientInactive: ["#FFFFFF", "#F6F8FB"] as const,
  underlineColor: "#26FF91",
  categories: [
    { name: "All", icon: LayoutGrid },
    { name: "Mobiles", icon: Smartphone },
    { name: "Electronics", icon: MonitorSmartphone },
    { name: "Appliances", icon: CookingPot },
    { name: "Beauty", icon: Brush },
    { name: "Home", icon: Lamp },
    { name: "Books", icon: BookOpen },
  ],

  setThemePayload: (payload) => set((s) => ({ ...s, ...payload })),

  setThemePreset: (preset) =>
    set(() => {
      if (preset === "blue") {
        return {
          activeColor: "#1B19A8",
          gradientActive: [
            "rgba(27,25,168,0.2)",
            "rgba(255,255,255,0)",
          ] as const,
          gradientInactive: ["#FFFFFF", "#F6F8FB"] as const,
          underlineColor: "#1B19A8",
          categories: [
            { name: "All", icon: LayoutGrid },
            { name: "Restaurant", icon: Building2 },
            { name: "Club", icon: Club },
            { name: "Home", icon: Home },
            { name: "Hotel", icon: Hotel },
            { name: "Saloon", icon: Hotel },
            { name: "Oyo", icon: Hotel },
            { name: "Stay", icon: Hotel },
          ],
        };
      }

      // fallback = green
      return {
        activeColor: "#26FF91",
        gradientActive: ["#BEFBE0", "#FFFFFF"] as const,
        gradientInactive: ["#FFFFFF", "#F6F8FB"] as const,
        underlineColor: "#26FF91",
        categories: [
          { name: "All", icon: LayoutGrid },
          { name: "Mobiles", icon: Smartphone },
          { name: "Electronics", icon: MonitorSmartphone },
          { name: "Appliances", icon: CookingPot },
          { name: "Beauty", icon: Brush },
          { name: "Home", icon: Lamp },
          { name: "Books", icon: BookOpen },
        ],
      };
    }),
}));
