"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useTheme } from "next-themes";

export type ThemeColor = "violet" | "blue" | "emerald" | "crimson" | "amber";

const themeColors = {
  violet: {
    light: "oklch(0.6231 0.1880 259.8145)",
    dark: "oklch(0.8315 0.1210 213.4241)",
  },
  blue: {
    light: "oklch(0.546 0.14 262)", 
    dark: "oklch(0.7 0.15 262)", 
  },
  emerald: {
    light: "oklch(0.55 0.15 150)", 
    dark: "oklch(0.7 0.15 150)", 
  },
  crimson: {
    light: "oklch(0.55 0.2 25)",
    dark: "oklch(0.65 0.2 25)",
  },
  amber: {
    light: "oklch(0.65 0.18 60)",
    dark: "oklch(0.75 0.18 60)",
  }
};

const ThemeColorContext = createContext<{
  color: ThemeColor;
  setColor: (color: ThemeColor) => void;
}>({ color: "violet", setColor: () => {} });

export function ThemeColorProvider({ children }: { children: React.ReactNode }) {
  const [color, setColorState] = useState<ThemeColor>("violet");
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const saved = localStorage.getItem("studora-theme-color") as ThemeColor;
    if (saved && themeColors[saved]) {
      setColorState(saved);
    }
  }, []);

  const setColor = (c: ThemeColor) => {
    setColorState(c);
    localStorage.setItem("studora-theme-color", c);
  };

  useEffect(() => {
    if (color === "violet") {
      document.documentElement.style.removeProperty('--primary');
      document.documentElement.style.removeProperty('--ring');
      document.documentElement.style.removeProperty('--sidebar-primary');
      return;
    }
    
    const isDark = resolvedTheme === "dark";
    const primaryColor = isDark ? themeColors[color].dark : themeColors[color].light;
    
    document.documentElement.style.setProperty('--primary', primaryColor);
    document.documentElement.style.setProperty('--ring', primaryColor);
    document.documentElement.style.setProperty('--sidebar-primary', primaryColor);
    
  }, [color, resolvedTheme]);

  return (
    <ThemeColorContext.Provider value={{ color, setColor }}>
      {children}
    </ThemeColorContext.Provider>
  );
}

export const useThemeColor = () => useContext(ThemeColorContext);
