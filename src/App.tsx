import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import "./App.css";
import { Key } from "./components/Key";
import {
  FN_MAP,
  isCharKey,
  isModifier,
  shifted,
  toKeyId,
  type Modifier,
} from "./keys";

const rows = [
  ["'", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
  ["Tab", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "Backspace"],
  ["Caps", "a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "]", "Enter"],
  ["Shift", "z", "x", "c", "v", "b", "n", "m", ",", "Up", ".", "/"],
  ["Ctrl", "Fn", "Win", "Space", "AltGr", "Left", "Down", "Right", "Alt"],
];

// Relative widths, chosen so every row adds up to the same total.
const KEY_UNITS: Record<string, number> = {
  Backspace: 2,
  Enter: 2,
  Shift: 2,
  Space: 5.5,
  Ctrl: 1.5,
  Win: 1.5,
  Alt: 1.5,
  AltGr: 1.5,
  Fn: 1.5,
  Tab: 1.5,
  Caps: 1.75,
};

function App() {
  const [activeModifiers, setActiveModifiers] = useState<Modifier[]>([]);
  // Modifiers latched but not yet combined with anything, so they can fire as a lone tap.
  const [unusedModifiers, setUnusedModifiers] = useState<Modifier[]>([]);
  // Local latch only: the OS Caps Lock state is left alone so the two can't fight each other.
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

  const isLetter = (key: string) => /^[a-z]$/.test(key);

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

  return (
    <main className="h-screen w-screen bg-zinc-950 p-1">
      <div className="flex h-full w-full flex-col gap-1 text-[clamp(0.75rem,2.4vh,1.125rem)]">
        {rows.map((row, i) => (
          <div className="flex w-full min-h-0 flex-1 gap-1" key={i}>
            {row.map((key, index) => {
              const effective = resolve(key);
              return (
                <Key
                  key={`${key}-${index}`}
                  label={getLabel(effective)}
                  onClick={() => handleKey(effective)}
                  units={KEY_UNITS[key] ?? 1}
                  isActive={isLatched(key)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </main>
  );
}

export default App;
