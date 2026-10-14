"use client";

import { useEffect, useState } from "react";
import { api, type UserSettings } from "@/lib/api";

export function useTheme() {
  const [theme, setThemeState] = useState<string>("midnight");
  const [fontSize, setFontSizeState] = useState<string>("medium");
  const [settings, setSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    // Load local storage first for fast initial render
    const savedTheme = localStorage.getItem("assignmentos_theme") || "midnight";
    const savedFontSize = localStorage.getItem("assignmentos_font_size") || "medium";
    setThemeState(savedTheme);
    setFontSizeState(savedFontSize);
    document.documentElement.setAttribute("data-theme", savedTheme);
    document.documentElement.setAttribute("data-font-size", savedFontSize);

    // Sync from server if logged in
    api.settings.get()
      .then((res) => {
        if (res?.settings) {
          setSettings(res.settings);
          if (res.settings.theme) {
            setThemeState(res.settings.theme);
            localStorage.setItem("assignmentos_theme", res.settings.theme);
            document.documentElement.setAttribute("data-theme", res.settings.theme);
          }
          if (res.settings.fontSize) {
            setFontSizeState(res.settings.fontSize);
            localStorage.setItem("assignmentos_font_size", res.settings.fontSize);
            document.documentElement.setAttribute("data-font-size", res.settings.fontSize);
          }
        }
      })
      .catch(() => undefined);
  }, []);

  const changeTheme = (newTheme: string) => {
    setThemeState(newTheme);
    localStorage.setItem("assignmentos_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    api.settings.update({ theme: newTheme }).catch(() => undefined);
  };

  const changeFontSize = (newFontSize: string) => {
    setFontSizeState(newFontSize);
    localStorage.setItem("assignmentos_font_size", newFontSize);
    document.documentElement.setAttribute("data-font-size", newFontSize);
    api.settings.update({ fontSize: newFontSize }).catch(() => undefined);
  };

  return { theme, changeTheme, fontSize, changeFontSize, settings, setSettings };
}
