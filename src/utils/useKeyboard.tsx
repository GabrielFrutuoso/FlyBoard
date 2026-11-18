import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";
import {
  getPhysicalKeyLabel,
  isCharKey,
  isModifier,
  MODIFIERS,
  type Layout,
  type Modifier,
} from "../keys";
import {
  allLayouts,
  BUILTIN_LAYOUTS,
  DEFAULT_KEY_SIZE,
  normalizeKeyGap,
  loadBoards,
  parseMacroKey,
  runMacroSteps,
  unitsFor,
  type BoardsFile,
  type KeyStyle,
  type Macro,
} from "./boardConfig";
import type { MacroIconId } from "./macroIcons";
import {
  composeDeadKey,
  deadKeyMark,
  getKeyLabel,
  isValidAccentBase,
  resolveKey,
} from "./keyboardText";
import { sendKeyboardInput } from "./keyboardOutput";

interface InputStatus {
  ready: boolean;
  message: string | null;
}

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export function useKeyboard() {
  const [boards, setBoards] = useState<BoardsFile>({ layouts: [], macros: [] });
  const [layoutId, setLayoutId] = useState<string>(() => {
    const saved =
      localStorage.getItem("flyboard_layout_id") ??
      localStorage.getItem("flyboard_layout");
    return saved ?? "pt-br";
  });
  const layouts = allLayouts(boards);
  const activeLayout =
    layouts.find((candidate) => candidate.id === layoutId) ??
    BUILTIN_LAYOUTS[0];
  const layout: Layout = activeLayout.base;
  const layoutRef = useRef<Layout>(layout);
  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  const macrosById = new Map(boards.macros.map((macro) => [macro.id, macro]));

  const setActiveLayout = (id: string) => {
    setLayoutId(id);
    localStorage.setItem("flyboard_layout_id", id);
    setPendingDeadKey(null);
  };

  const [activeModifiers, setActiveModifiers] = useState<Modifier[]>([]);
  const [unusedModifiers, setUnusedModifiers] = useState<Modifier[]>([]);
  const [capsActive, setCapsActive] = useState(false);
  const [fnActive, setFnActive] = useState(false);
  const [pendingDeadKey, setPendingDeadKey] = useState<{
    source: string;
    key: string;
    mark: string;
  } | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const pressedRef = useRef<Map<string, string>>(new Map());

  // The OS lock is the source of truth; tracking it locally would drift out of sync.
  const syncCapsLock = () => {
    invoke<boolean>("caps_lock").then(setCapsActive).catch(console.error);
  };

  const syncInputStatus = () => {
    invoke<InputStatus>("input_status")
      .then((status) => setInputError(status.message))
      .catch((error) => setInputError(errorMessage(error)));
  };

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;

    syncCapsLock();
    syncInputStatus();

    listen<{ key: string; source?: string; down: boolean }>(
      "physical-key",
      ({ payload }) => {
        const { key, down, source = key } = payload;
        const mappedKey = getPhysicalKeyLabel(key, layoutRef.current);

        if (down) pressedRef.current.set(source, mappedKey);
        else pressedRef.current.delete(source);

        // Read on release: at hook time the lock hasn't flipped yet.
        if (mappedKey === "Caps" && !down) syncCapsLock();
        setPressedKeys(new Set(pressedRef.current.values()));
      },
    ).then((unlisten) => {
      // StrictMode remounts before this resolves; without the guard a second listener survives.
      if (cancelled) unlisten();
      else stop = unlisten;
    });

    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  // Custom layouts and macros live in boards.json; the editor window announces saves so the
  // keyboard picks up changes without a restart.
  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;

    const refresh = () => {
      loadBoards()
        .then(setBoards)
        .catch((error) => setInputError(errorMessage(error)));
    };
    refresh();

    listen("boards-changed", refresh).then((unlisten) => {
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
  const physicalModifiers = MODIFIERS.filter((modifier) =>
    [...pressedRef.current.values()].includes(modifier),
  );
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
    return sendKeyboardInput({
      key,
      modifiers,
      text,
      physicalModifierHeld,
      capsActive,
      layout,
      builtinLayout: activeLayout.builtin,
    })
      .then(syncInputStatus)
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

  const releaseLatchedModifiers = () => {
    setActiveModifiers([]);
    setUnusedModifiers([]);
  };

  const runMacro = (macro: Macro) => {
    runMacroSteps(macro.steps, layoutRef.current)
      .then(syncInputStatus)
      .catch((error) => setInputError(errorMessage(error)));
  };

  const handleKey = (key: string) => {
    const macroId = parseMacroKey(key);
    if (macroId !== null) {
      releaseLatchedModifiers();
      const macro = macrosById.get(macroId);
      if (macro) runMacro(macro);
      return;
    }
    if (key === "Caps") {
      releaseLatchedModifiers();
      // Toggle the real lock, then read back what the OS actually settled on.
      send("Caps", []).then(syncCapsLock);
      return;
    }
    if (key === "Fn") {
      releaseLatchedModifiers();
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
    const mark =
      isCharKey(key) && shortcutModifiers.length === 0
        ? deadKeyMark(text, layout)
        : undefined;

    if (mark) {
      if (pendingDeadKey?.mark === mark) {
        setPendingDeadKey(null);
        send(key, effectiveModifiers, pendingDeadKey.key, physicalModifierHeld);
        releaseLatchedModifiers();
        return;
      }
      if (pendingDeadKey)
        send(key, effectiveModifiers, pendingDeadKey.key, physicalModifierHeld);
      setPendingDeadKey({ source: key, key: text, mark });
      releaseLatchedModifiers();
      return;
    }

    const composedText =
      pendingDeadKey && isCharKey(key) && shortcutModifiers.length === 0
        ? composeDeadKey(pendingDeadKey.key, pendingDeadKey.mark, text)
        : undefined;
    setPendingDeadKey(null);
    send(key, effectiveModifiers, composedText, physicalModifierHeld);
    releaseLatchedModifiers();
  };

  return {
    layout,
    layoutId: activeLayout.id,
    layouts: layouts.map(({ id, name }) => ({ id, name })),
    setLayout: setActiveLayout,
    rows: activeLayout.rows,
    appearance: activeLayout.appearance ?? "solid",
    backgroundColor: activeLayout.backgroundColor,
    transparency: activeLayout.transparency,
    keyGap: normalizeKeyGap(activeLayout.keyGap),
    keyRadius: activeLayout.keyRadius,
    keyLabelSize: activeLayout.keyLabelSize,
    keyboardPadding: activeLayout.keyboardPadding,
    keySizeFor: (rowIndex: number, keyIndex: number) =>
      activeLayout.keySizes?.[rowIndex]?.[keyIndex] ?? DEFAULT_KEY_SIZE,
    styleFor: (rowIndex: number, keyIndex: number): KeyStyle =>
      activeLayout.keyStyles?.[rowIndex]?.[keyIndex] ?? {},
    unitFor: (key: string) => unitsFor(key, layout),
    resolve: (key: string) => resolveKey(key, fnActive, layout),
    getLabel: (key: string) => {
      const macroId = parseMacroKey(key);
      if (macroId !== null) {
        const name = macrosById.get(macroId)?.name ?? "?";
        return name.length > 8 ? `${name.slice(0, 7)}…` : name;
      }
      const label = getKeyLabel(key, shiftActive, capsActive, layout);
      return label;
    },
    getMacroIcon: (key: string): MacroIconId | undefined => {
      const macroId = parseMacroKey(key);
      return macroId === null ? undefined : macrosById.get(macroId)?.icon;
    },
    getMacroName: (key: string): string | undefined => {
      const macroId = parseMacroKey(key);
      return macroId === null ? undefined : macrosById.get(macroId)?.name;
    },
    isLatched: (key: string) =>
      key === "Caps"
        ? capsActive
        : key === "Fn"
          ? fnActive
          : pendingDeadKey?.source === key
            ? true
            : isModifier(key) && activeModifiers.includes(key),
    isAccentAvailable: (key: string) => {
      if (!pendingDeadKey || parseMacroKey(key) !== null) return true;
      if (!isCharKey(key)) return true;

      const label = getKeyLabel(key, shiftActive, capsActive, layout);
      if (deadKeyMark(label, layout)) return true;
      return isValidAccentBase(pendingDeadKey.key, label);
    },
    isPressed: (key: string) => pressedKeys.has(key),
    handleKey,
    inputError,
  };
}
