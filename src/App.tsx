import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import "./App.css";

function App() {

  const [activeModifiers, setActiveModifiers] = useState<string[]>([]);
  const rows = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "{"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", "}"],
    ["Shift", "z", "x", "c", "v", "b", "n", "m", "Shift"],
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
    "p": "{",
    "l": "}"
  };    

  const getDisplayKey = (key: string) => {
    if (key === "Backspace" || key === "Enter") return key;
    if (!activeModifiers.includes("Shift")) return key;
    if (shiftMap[key]) return shiftMap[key];
    return key.toUpperCase();
  };

  const handleKey = (key: string) => {
    if (["Ctrl", "Shift", "Alt"].includes(key)) {
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
            {row.map((key) => {
              const displayKey = getDisplayKey(key);
              const isActive = activeModifiers.includes(key);
              return (
                <button
                  className={`w-[60px] h-10 text-white transition-colors rounded-md ${
                    isActive ? "bg-zinc-600" : "bg-zinc-900 hover:bg-zinc-800"
                  }`}
                  key={key}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleKey(key)}
                >
                  {displayKey}
                </button>
              );
            })}
          </div>
        ))}
        {/* <div className="flex justify-center gap-1.5">
          {["Ctrl", "Alt"].map((key) => {
            const isActive = activeModifiers.includes(key);
            return (
              <button
                key={key}
                className={`w-10 h-10 text-white transition-colors ${
                  isActive ? "bg-zinc-600" : "bg-zinc-900 hover:bg-zinc-800"
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleKey(key)}
              >
                {key}
              </button>
            );
          })}
        </div> */}
        <div className="flex justify-center">
          <button
            className="w-[75%] h-10 bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleKey("return")}
          >
            Space
          </button>
        </div>
      </div>
    </main>
  );
}

export default App;
