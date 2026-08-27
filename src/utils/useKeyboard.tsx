import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import {
  FN_MAP,
  isCharKey,
  isModifier,
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

  const shiftActive = activeModifiers.includes("Shift");
  const hasNonShiftModifier = activeModifiers.some((m) => m !== "Shift");

  const send = (key: string, modifiers: Modifier[]) => {
    invoke("send_key", { key: toKeyId(key), modifiers }).catch(console.error);
  };

  // Fn swaps the number row for the function row, like a laptop keyboard.
  const resolve = (key: string) =>
    fnActive && FN_MAP[key] ? FN_MAP[key] : key;

  const getLabel = (key: string) => {
    if (!isCharKey(key)) return key;
    if (isLetter(key))
      return shiftActive !== capsActive ? key.toUpperCase() : key;
    return shiftActive ? shifted(key) : key;
  };

  const getCharToSend = (key: string) => {
    if (!isCharKey(key)) return key;
    // Shortcuts use the base character: Ctrl+1 rather than Ctrl+!, and Caps must not force Ctrl+Shift+C.
    if (hasNonShiftModifier) return key;
    return getLabel(key);
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

  const handleKey = (key: string) => {
    if (key === "Caps") {
      setCapsActive((prev) => !prev);
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
    send(getCharToSend(key), activeModifiers);
    setUnusedModifiers([]);
  };

  return { resolve, getLabel, isLatched, handleKey };
}
