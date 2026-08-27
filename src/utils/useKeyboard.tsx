import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";
import {
  FN_MAP,
  isCharKey,
  isModifier,
  MODIFIERS,
  shifted,
  toKeyId,
  type Modifier,
} from "../keys";

const isLetter = (key: string) => /^[a-z]$/.test(key);

export function useKeyboard() {
  const [activeModifiers, setActiveModifiers] = useState<Modifier[]>([]);
  const [unusedModifiers, setUnusedModifiers] = useState<Modifier[]>([]);
  const [capsActive, setCapsActive] = useState(false);
  const [fnActive, setFnActive] = useState(false);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const pressedRef = useRef<Set<string>>(new Set());

  // The OS lock is the source of truth; tracking it locally would drift out of sync.
  const syncCapsLock = () => {
    invoke<boolean>("caps_lock").then(setCapsActive).catch(console.error);
  };

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;

    syncCapsLock();

    listen<{ key: string; down: boolean }>("physical-key", ({ payload }) => {
      const { key, down } = payload;

      if (down) pressedRef.current.add(key);
      else pressedRef.current.delete(key);

      // Read on release: at hook time the lock hasn't flipped yet.
      if (key === "Caps" && !down) syncCapsLock();
      setPressedKeys(new Set(pressedRef.current));
    }).then((unlisten) => {
      // StrictMode remounts before this resolves; without the guard a second listener survives.
      if (cancelled) unlisten();
      else stop = unlisten;
    });

    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  // A physically held modifier counts alongside a latched virtual one, so Ctrl (keyboard) + C (VK) works.
  const physicalModifiers = MODIFIERS.filter((m) => pressedKeys.has(m));
  const effectiveModifiers = [
    ...activeModifiers,
    ...physicalModifiers.filter((m) => !activeModifiers.includes(m)),
  ];

  const shiftActive = effectiveModifiers.includes("Shift");
  const hasNonShiftModifier = effectiveModifiers.some((m) => m !== "Shift");

  const send = (key: string, modifiers: Modifier[]) =>
    invoke("send_key", { key: toKeyId(key), modifiers }).catch(console.error);

  // Fn swaps the number row for the function row, like a laptop keyboard.
  const resolve = (key: string) =>
    fnActive && FN_MAP[key] ? FN_MAP[key] : key;

  const getLabel = (key: string) => {
    if (!isCharKey(key)) return key;
    if (isLetter(key))
      return shiftActive !== capsActive ? key.toUpperCase() : key;
    return shiftActive ? shifted(key) : key;
  };

  const toggleModifier = (modifier: Modifier) => {
    if (activeModifiers.includes(modifier)) {
      // Latched then released without being used: tap it, so Win opens Start and Alt opens the menu bar.
      if (unusedModifiers.includes(modifier)) send(modifier, []);
      setActiveModifiers((prev) => prev.filter((m) => m !== modifier));
      setUnusedModifiers((prev) => prev.filter((m) => m !== modifier));
    } else {
      setActiveModifiers((prev) => [...prev, modifier]);
      setUnusedModifiers((prev) => [...prev, modifier]);
    }
  };

  const isLatched = (key: string) => {
    if (key === "Caps") return capsActive;
    if (key === "Fn") return fnActive;
    return isModifier(key) && activeModifiers.includes(key);
  };

  const isPressed = (key: string) => pressedKeys.has(key);

  const handleKey = (key: string) => {
    if (key === "Caps") {
      // Toggle the real lock, then read back what the OS actually settled on.
      send("Caps", []).then(syncCapsLock);
      return;
    }
    if (key === "Fn") {
      setFnActive((prev) => !prev);
      return;
    }
    if (isModifier(key)) {
      toggleModifier(key);
      return;
    }
    // Plain characters go in as text: the glyph may sit on a key that Shift alone
    // can't reach (ABNT2 puts ? on its own key, not on Shift+/).
    if (isCharKey(key) && !hasNonShiftModifier) {
      invoke("send_text", { text: getLabel(key) }).catch(console.error);
      setUnusedModifiers([]);
      return;
    }
    // Named keys and shortcuts still need real virtual keys.
    send(key, effectiveModifiers);
    setUnusedModifiers([]);
  };

  return { resolve, getLabel, isLatched, isPressed, handleKey };
}
