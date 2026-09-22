import { BarChart3, Dumbbell, Target, Zap } from "lucide-react";

export type Screen = "home" | "plans" | "workouts" | "progress" | "account";

export const systems = [
  { name: "Push Pull Legs", label: "دفع · سحب · أرجل", days: "6 أيام", icon: Dumbbell, color: "gold" },
  { name: "Arnold Split", label: "نظام أرنولد", days: "6 أيام", icon: Zap, color: "green" },
  { name: "Upper / Lower", label: "علوي · سفلي", days: "4 أيام", icon: BarChart3, color: "blue" },
  { name: "Full Body", label: "جسم كامل", days: "3 أيام", icon: Target, color: "red" },
];