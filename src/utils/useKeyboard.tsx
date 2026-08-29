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

const getKeyLabel = (
  key: string,
  shiftActive: boolean,
  capsActive: boolean,
) => {
  if (!isCharKey(key)) return key;
  if (isLetter(key))
    return shiftActive !== capsActive ? key.toUpperCase() : key;
  return shiftActive ? shifted(key) : key;
};

const resolveKey = (key: string, fnActive: boolean) =>
  fnActive && FN_MAP[key] ? FN_MAP[key] : key;

interface InputStatus {
  ready: boolean;
  message: string | null;
}

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export function useKeyboard() {
  const [activeModifiers, setActiveModifiers] = useState<Modifier[]>([]);
  const [unusedModifiers, setUnusedModifiers] = useState<Modifier[]>([]);
  const [capsActive, setCapsActive] = useState(false);
  const [fnActive, setFnActive] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const pressedRef = useRef<Set<string>>(new Set());

  // The OS lock is the source of truth; tracking it locally would drift out of sync.
  const syncCapsLock = () => {
    invoke<boolean>("caps_lock").then(setCapsActive).catch(console.error);
  };

  const syncInputStatus = () => {
    invoke<InputStatus>("input_status")
      .then((status) => setInputError(status.ready ? null : status.message))
      .catch((error) => setInputError(errorMessage(error)));
  };

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;

    syncCapsLock();
    syncInputStatus();

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

  const send = (key: string, modifiers: Modifier[]) =>
    invoke<void>("send_key", { key: toKeyId(key), modifiers })
      .then(() => setInputError(null))
      .catch((error) => setInputError(errorMessage(error)));

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
    send(key, effectiveModifiers);
    setUnusedModifiers([]);
  };

  return {
    resolve: (key: string) => resolveKey(key, fnActive),
    getLabel: (key: string) => getKeyLabel(key, shiftActive, capsActive),
    isLatched: (key: string) =>
      key === "Caps"
        ? capsActive
        : key === "Fn"
          ? fnActive
          : isModifier(key) && activeModifiers.includes(key),
    isPressed: (key: string) => pressedKeys.has(key),
    handleKey,
    inputError,
  };
}
