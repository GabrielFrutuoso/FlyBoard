import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import "./App.css";
import { Key } from "./components/Key";
import { isCharKey, isModifier, shifted, toKeyId, type Modifier } from "./keys";

const rows = [
  ["'", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "Backspace"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "]", "Enter"],
  ["Shift", "z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
  ["Ctrl", "Win", "Alt", "Space", "AltGr", "Tab"],
];

const WIDE_KEYS = new Set([
  "Shift",
  "Enter",
  "Backspace",
  "Ctrl",
  "Alt",
  "AltGr",
  "Win",
  "Tab",
]);

function App() {
  const [activeModifiers, setActiveModifiers] = useState<Modifier[]>([]);
  // Modifiers latched but not yet combined with anything, so they can fire as a lone tap.
  const [unusedModifiers, setUnusedModifiers] = useState<Modifier[]>([]);

  const shiftActive = activeModifiers.includes("Shift");
  const hasNonShiftModifier = activeModifiers.some((m) => m !== "Shift");

  const send = (key: string, modifiers: Modifier[]) => {
    invoke("send_key", { key: toKeyId(key), modifiers }).catch(console.error);
  };

  const getLabel = (key: string) =>
    isCharKey(key) && shiftActive ? shifted(key) : key;

  // With Ctrl/Alt/Win latched, apps expect the unshifted character (Ctrl+1, not Ctrl+!).
  const getCharToSend = (key: string) =>
    isCharKey(key) && shiftActive && !hasNonShiftModifier ? shifted(key) : key;

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
    if (isModifier(key)) {
      toggleModifier(key);
      return;
    }
    send(getCharToSend(key), activeModifiers);
    setUnusedModifiers([]);
  };

  return (
    <main className="flex justify-center items-center h-screen bg-zinc-950">
      <div className="flex flex-col justify-center gap-1">
        {rows.map((row, i) => (
          <div
            className="w-full flex justify-center items-center gap-1"
            key={i}
          >
            {row.map((key, index) => (
              <Key
                key={`${key}-${index}`}
                label={getLabel(key)}
                onClick={() => handleKey(key)}
                className={`${
                  key === "Space"
                    ? "w-56"
                    : WIDE_KEYS.has(key)
                      ? "w-[3.75rem]"
                      : "w-12"
                } h-8`}
                isActive={isModifier(key) && activeModifiers.includes(key)}
              />
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}

export default App;
