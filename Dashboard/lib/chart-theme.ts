export const chartColors = {
  primary: "hsl(var(--chart-1))",
  secondary: "hsl(var(--chart-2))",
  success: "hsl(142.1 76.2% 36.3%)",
  danger: "hsl(0 84.2% 60.2%)",
  warning: "hsl(38 92% 50%)",
  muted: "hsl(var(--muted-foreground))",
  info: "hsl(217.2 91.2% 59.8%)",
};

export const statusColors: Record<string, string> = {
  healthy: "#22c55e",
  normal: "#22c55e",
  filled: "#3b82f6",
  crowned: "#1d4ed8",
  extracted: "#9ca3af",
  needs_treatment: "#ef4444",
  root_canal: "#f97316",
  implant: "#8b5cf6",
  high: "#ef4444",
  low: "#f97316",
  critical: "#dc2626",
  borderline: "#eab308",
};

export const specialtyColors: Record<string, string> = {
  cardiology: "#ef4444",
  neurology: "#8b5cf6",
  gastroenterology: "#22c55e",
  ent: "#3b82f6",
  dermatology: "#f97316",
  urology: "#06b6d4",
  endocrinology: "#eab308",
  ophthalmology: "#14b8a6",
  orthopedics: "#6366f1",
  dentistry: "#ec4899",
  general: "#6b7280",
  "primary care": "#6b7280",
  "primary care physician": "#6b7280",
  "restorative dentist": "#ec4899",
};

export const recoveryColors = {
  red: "#ef4444",
  yellow: "#eab308",
  green: "#22c55e",
};

export const chartDefaults = {
  strokeWidth: 2,
  dotRadius: 4,
  activeDotRadius: 6,
  animationDuration: 300,
};
