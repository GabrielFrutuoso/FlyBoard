import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";

const appWindow = getCurrentWindow();

export function useEditorWindow() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;

    appWindow
      .onCloseRequested((event) => {
        event.preventDefault();
        void appWindow.hide();
      })
      .then((removeListener) => {
        if (cancelled) removeListener();
        else unlisten = removeListener;
      })
      .catch((windowError) => setError(String(windowError)));

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);

  return { appWindow, error };
}
