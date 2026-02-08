import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import "./App.css";
import { Key } from "./components/Key";

function App() {
  const [activeModifiers, setActiveModifiers] = useState<string[]>([]);
  const rows = [
    ["'", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "Backspace"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "]", "Enter"],
    ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
    ["Shift", "z", "x", "c", "v", "b", "n", "m"],
  ];

  const shiftMap: Record<string, string> = {
    "1": "!",
    "2": "@",
    "3": "#",
    "4": "$",
    "5": "%",
    "6": "^",
    "7": "&",
    "8": "*",
    "9": "(",
    "0": ")",
    "'": "`",
    "[": "{",
    "]": "}",
    ";": ":",
    ",": "<",
    ".": ">",
    "/": "?",
    "-": "_",
    "=": "+",
  };

  const getDisplayKey = (key: string) => {
    if (key === "Backspace" || key === "Enter" || key === " ") return key;
    if (!activeModifiers.includes("Shift")) return key;
    if (shiftMap[key]) return shiftMap[key];
    return key.toUpperCase();
  };

  const handleKey = (key: string) => {
    if (["Shift"].includes(key)) {
      setActiveModifiers((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
      );
    } else {
      let keyToSend = getDisplayKey(key);
      if (key === "Enter") keyToSend = "Return";

      invoke("send_key", {
        key: keyToSend,
        modifiers: activeModifiers,
      });
    }
  };
  
  return (
    <main className="flex justify-center items-center h-screen bg-zinc-950">
      <div className="flex flex-col justify-center gap-1">
        {rows.map((row, i) => (
          <div
            className="w-full flex justify-center items-center gap-1"
            key={i}
          >
            {row.map((key, index) => {
              const displayKey = getDisplayKey(key);
              const isActive = activeModifiers.includes(key);
              return (
                <Key
                  key={`${key}-${index}`}
                  label={displayKey}
                  onClick={() => handleKey(key)}
                  className={`${key === "Shift" || key === "Enter" ? "w-[3.75rem]" : "w-12"} h-8`}
                  isActive={isActive}
                />
              );
            })}
          </div>
        ))}

        <div className="flex justify-center">
          <Key
            label="Space"
            onClick={() => handleKey(" ")}
            className="w-[55%] h-8"
          />
        </div>
      </div>
    </main>
  );
}

export default App;
