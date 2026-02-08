import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import "./App.css";

function App() {

  const [activeModifiers, setActiveModifiers] = useState<string[]>([]);
  const rows = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m"],
    ["Backspace", "Enter"],
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
      // Send the displayed key (e.g. "!" instead of "1" if Shift is active)
      // We also pass the modifiers so the backend can press them (e.g. for shortcuts)
      let keyToSend = getDisplayKey(key);
      if (key === "Enter") keyToSend = "Return";

      invoke("send_key", {
        key: keyToSend,
        modifiers: activeModifiers,
      });
    }
  };

  return (
    <main className="container">
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        {rows.map((row, i) => (
          <div
            key={i}
            style={{ display: "flex", justifyContent: "center", gap: "5px" }}
          >
            {row.map((key) => {
              const displayKey = getDisplayKey(key);
              return (
                <button
                  key={key}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleKey(key)}
                  style={{
                    width: "60px",
                    height: "40px",
                    backgroundColor: activeModifiers.includes(key)
                      ? "#666"
                      : "",
                    color: activeModifiers.includes(key) ? "white" : "",
                  }}
                >
                  {displayKey}
                </button>
              );
            })}
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "center", gap: "5px" }}>
          {["Ctrl", "Shift", "Alt"].map((key) => (
            <button
              key={key}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleKey(key)}
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: activeModifiers.includes(key) ? "#666" : "",
                color: activeModifiers.includes(key) ? "white" : "",
              }}
            >
              {key}
            </button>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "5px",
          }}
        >
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleKey(" ")}
            style={{ width: "200px", height: "40px" }}
          >
            Space
          </button>
        </div>
      </div>
    </main>
  );
}

export default App;
