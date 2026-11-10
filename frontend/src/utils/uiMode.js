import { useCallback, useState } from "react";

// Look of the student panel: "smart" (new design) or "classic". Remembered per browser.
const STORAGE_KEY = "blitz.uiMode";
export const DEFAULT_UI_MODE = "smart";

function readStoredMode() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "smart" || value === "classic" ? value : DEFAULT_UI_MODE;
  } catch {
    return DEFAULT_UI_MODE;
  }
}

export function useUiMode() {
  const [mode, setMode] = useState(readStoredMode);
  const changeMode = useCallback((next) => {
    setMode(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable (private window): the choice lasts for this visit only
    }
  }, []);
  return [mode, changeMode];
}
