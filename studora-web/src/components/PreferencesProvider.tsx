"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type LandingPage = "/dashboard" | "/rooms" | "/assignments";

type Preferences = {
  landingPage: LandingPage;
  showRecentActivity: boolean;
  showUpcomingDeadlines: boolean;
};

type PreferencesContextType = Preferences & {
  updatePreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
};

const defaultPreferences: Preferences = {
  landingPage: "/dashboard",
  showRecentActivity: true,
  showUpcomingDeadlines: true,
};

const PreferencesContext = createContext<PreferencesContextType>({
  ...defaultPreferences,
  updatePreference: () => {},
});

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("studora-preferences");
    if (saved) {
      try {
        setPreferences({ ...defaultPreferences, ...JSON.parse(saved) });
      } catch (e) {
        console.error("Failed to parse preferences", e);
      }
    }
    setMounted(true);
  }, []);

  const updatePreference = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem("studora-preferences", JSON.stringify(next));
      return next;
    });
  };

  // Do not delay rendering children to avoid layout shift if possible, but for preferences it might cause hydration mismatches if not careful.
  // We'll just provide the default first, then update on mount.

  return (
    <PreferencesContext.Provider value={{ ...preferences, updatePreference }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export const usePreferences = () => useContext(PreferencesContext);
