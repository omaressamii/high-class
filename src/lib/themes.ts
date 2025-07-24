
export interface ThemeColors {
  primary: string; // HSL string e.g., "220 70% 55%"
  accent: string;  // HSL string e.g., "250 60% 60%"
  background: string; // HSL string e.g., "210 20% 98%"
  foreground: string; // HSL string e.g., "215 25% 27%"
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
}

export const themes: Record<string, ThemeColors> = {
  'default-blue': {
    primary: "220 70% 55%", // Brighter, more vibrant blue
    accent: "250 60% 60%",   // A gentle violet/lavender
    background: "210 20% 98%", // Light cool grey
    foreground: "215 25% 27%", // Dark desaturated blue
    card: "0 0% 100%",
    cardForeground: "215 25% 27%",
    popover: "0 0% 100%",
    popoverForeground: "215 25% 27%",
    secondary: "210 15% 90%",
    secondaryForeground: "215 20% 35%",
    muted: "210 15% 94%",
    mutedForeground: "215 15% 55%",
    destructive: "0 65% 55%",
    destructiveForeground: "0 0% 100%",
    border: "210 15% 88%",
    input: "210 15% 88%",
    ring: "220 70% 55%",
  },
  'green': {
    primary: "145 63% 42%", // Darker, rich green
    accent: "160 60% 45%",   // Complementary teal/green
    background: "120 30% 97%", // Very light, slightly green-tinted grey
    foreground: "145 35% 20%", // Very dark, slightly desaturated green
    card: "0 0% 100%",
    cardForeground: "145 35% 20%",
    popover: "0 0% 100%",
    popoverForeground: "145 35% 20%",
    secondary: "140 25% 90%", // Lighter green-grey
    secondaryForeground: "145 30% 35%",
    muted: "130 20% 94%", // Even lighter green-grey
    mutedForeground: "145 20% 55%",
    destructive: "0 65% 55%", // Standard destructive red
    destructiveForeground: "0 0% 100%",
    border: "140 20% 88%",
    input: "140 20% 88%",
    ring: "145 63% 42%",
  },
  'purple': {
    primary: "260 65% 60%", // Pleasant purple
    accent: "280 70% 65%",   // Brighter complementary purple/magenta
    background: "270 30% 97%", // Very light, slightly purple-tinted grey
    foreground: "260 35% 20%", // Very dark, slightly desaturated purple
    card: "0 0% 100%",
    cardForeground: "260 35% 20%",
    popover: "0 0% 100%",
    popoverForeground: "260 35% 20%",
    secondary: "265 25% 90%", // Lighter purple-grey
    secondaryForeground: "260 30% 35%",
    muted: "270 20% 94%", // Even lighter purple-grey
    mutedForeground: "260 20% 55%",
    destructive: "0 65% 55%", // Standard destructive red
    destructiveForeground: "0 0% 100%",
    border: "265 20% 88%",
    input: "265 20% 88%",
    ring: "260 65% 60%",
  },
   'classic-gold': {
    primary: "45 80% 50%",   // Rich gold
    accent: "35 70% 60%",    // Softer, complementary gold/orange
    background: "40 30% 97%", // Very light, warm off-white/cream
    foreground: "35 50% 20%", // Dark, warm brown
    card: "0 0% 100%",
    cardForeground: "35 50% 20%",
    popover: "0 0% 100%",
    popoverForeground: "35 50% 20%",
    secondary: "40 25% 90%", // Light beige
    secondaryForeground: "35 40% 35%",
    muted: "40 20% 94%",    // Lighter beige
    mutedForeground: "35 30% 55%",
    destructive: "0 65% 55%", // Standard destructive red
    destructiveForeground: "0 0% 100%",
    border: "40 20% 88%",
    input: "40 20% 88%",
    ring: "45 80% 50%",
  },
};

export const defaultThemeName = 'default-blue';

export function getThemeColors(themeName?: string): ThemeColors {
  const name = themeName && themes[themeName] ? themeName : defaultThemeName;
  return themes[name];
}
