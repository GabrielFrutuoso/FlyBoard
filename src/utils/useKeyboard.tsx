import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";
import {
  accentFor,
  composeAccent,
  FN_MAP,
  getPhysicalKeyLabel,
  isAccentBase,
  isCharKey,
  isModifier,
  LAYOUT_ROWS,
  MODIFIERS,
  shifted,
  toPhysicalKeyId,
  type Layout,
  type Modifier,
} from "../keys";
import type { AccentKey } from "../keys";

const isLetter = (key: string) => /^[a-z]$/.test(key);

const getKeyLabel = (
  key: string,
  shiftActive: boolean,
  capsActive: boolean,
  layout: Layout,
) => {
  if (!isCharKey(key)) return key;
  if (isLetter(key))
    return shiftActive !== capsActive ? key.toUpperCase() : key;
  return shiftActive ? shifted(key, layout) : key;
};

const resolveKey = (key: string, fnActive: boolean, layout: Layout) =>
  fnActive && FN_MAP[layout]?.[key] ? FN_MAP[layout][key] : key;

interface InputStatus {
  ready: boolean;
  message: string | null;
}

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export function useKeyboard() {
  const [layout, setLayout] = useState<Layout>(() => {
    const saved = localStorage.getItem("flyboard_layout");
    return saved === "en" || saved === "pt-br" ? saved : "pt-br";
  });
  const layoutRef = useRef<Layout>(layout);
  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  const toggleLayout = () => {
    setLayout((prev) => {
      const next = prev === "pt-br" ? "en" : "pt-br";
      localStorage.setItem("flyboard_layout", next);
      return next;
    });
    setActiveAccent(null);
  };

  const [activeModifiers, setActiveModifiers] = useState<Modifier[]>([]);
  const [unusedModifiers, setUnusedModifiers] = useState<Modifier[]>([]);
  const [capsActive, setCapsActive] = useState(false);
  const [fnActive, setFnActive] = useState(false);
  const [activeAccent, setActiveAccent] = useState<{
    source: string;
    key: AccentKey;
    physical: boolean;
  } | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const pressedRef = useRef<Map<string, string>>(new Map());
  const activeModifiersRef = useRef(activeModifiers);
  const capsActiveRef = useRef(capsActive);
  const activeAccentRef = useRef(activeAccent);

  useEffect(() => {
    activeModifiersRef.current = activeModifiers;
  }, [activeModifiers]);

  useEffect(() => {
    capsActiveRef.current = capsActive;
  }, [capsActive]);

  useEffect(() => {
    activeAccentRef.current = activeAccent;
  }, [activeAccent]);

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

    listen<{ key: string; source?: string; down: boolean }>("physical-key", ({ payload }) => {
      const { key, down, source = key } = payload;
      const mappedKey = getPhysicalKeyLabel(key, layoutRef.current);

      if (down) pressedRef.current.set(source, mappedKey);
      else pressedRef.current.delete(source);

      if (down && mappedKey !== "Caps" && !isModifier(mappedKey)) {
        const shiftHeld =
          pressedRef.current.has("Shift") ||
          activeModifiersRef.current.includes("Shift");
        const physicalLabel = getKeyLabel(
          mappedKey,
          shiftHeld,
          capsActiveRef.current,
          layoutRef.current,
        );
        const accent = accentFor(physicalLabel);

        if (accent) {
          setActiveAccent((current) =>
            current?.key === accent
              ? null
              : { source: mappedKey, key: accent, physical: true },
          );
        } else if (activeAccentRef.current) {
          setActiveAccent(null);
        }
      }

      // Read on release: at hook time the lock hasn't flipped yet.
      if (mappedKey === "Caps" && !down) syncCapsLock();
      setPressedKeys(new Set(pressedRef.current.values()));
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

  const send = (
    key: string,
    modifiers: Modifier[],
    text?: string,
    physicalModifierHeld = false,
  ) => {
    const hasShortcutModifier = modifiers.some(
      (modifier) => modifier !== "Shift",
    );
    const request =
      isCharKey(key) && !hasShortcutModifier && !physicalModifierHeld
        ? invoke<void>("send_text", {
            text:
              text ??
              getKeyLabel(key, modifiers.includes("Shift"), capsActive, layout),
          })
        : invoke<void>("send_key", {
            key: toPhysicalKeyId(key, layout),
            modifiers,
          });

    return request
      .then(() => setInputError(null))
      .catch((error) => setInputError(errorMessage(error)));
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
    const text = getKeyLabel(key, shiftActive, capsActive, layout);
    const physicalModifierHeld = physicalModifiers.length > 0;
    const shortcutModifiers = effectiveModifiers.filter(
      (modifier) => modifier !== "Shift",
    );
    const accent =
      isCharKey(key) && shortcutModifiers.length === 0
        ? accentFor(text)
        : undefined;

    if (accent) {
      if (activeAccent?.key === accent) {
        setActiveAccent(null);
        send(key, effectiveModifiers, accent, physicalModifierHeld);
        setUnusedModifiers([]);
        return;
      }
      if (activeAccent && !activeAccent.physical) {
        send(key, effectiveModifiers, activeAccent.key, physicalModifierHeld);
      }
      setActiveAccent({ source: key, key: accent, physical: false });
      return;
    }

    const canCompose =
      activeAccent &&
      isCharKey(key) &&
      shortcutModifiers.length === 0 &&
      isAccentBase(activeAccent.key, text);
    if (activeAccent && !activeAccent.physical && !canCompose) {
      void send(activeAccent.key, [], activeAccent.key);
    }
    const composedText =
      canCompose
        ? composeAccent(activeAccent.key, text)
        : undefined;
    setActiveAccent(null);
    send(key, effectiveModifiers, composedText, physicalModifierHeld);
    setUnusedModifiers([]);
  };

  return {
    layout,
    toggleLayout,
    rows: LAYOUT_ROWS[layout],
    resolve: (key: string) => resolveKey(key, fnActive, layout),
    getLabel: (key: string) => {
      const label = getKeyLabel(key, shiftActive, capsActive, layout);
      return activeAccent && isAccentBase(activeAccent.key, label)
        ? composeAccent(activeAccent.key, label)
        : label;
    },
    isLatched: (key: string) =>
      key === "Caps"
        ? capsActive
        : key === "Fn"
          ? fnActive
          : activeAccent?.source === key
            ? true
            : isModifier(key) && activeModifiers.includes(key),
    isAccentAvailable: (key: string) => {
      if (!activeAccent) return true;
      const label = getKeyLabel(key, shiftActive, capsActive, layout);
      return (
        !isCharKey(key) ||
        Boolean(accentFor(label)) ||
        isAccentBase(activeAccent.key, label)
      );
    },
    isPressed: (key: string) => pressedKeys.has(key),
    handleKey,
    inputError,
  };
}
