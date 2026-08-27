import "./App.css";
import { Key } from "./components/Key";
import { useKeyboard } from "./utils/useKeyboard";

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
  const { resolve, getLabel, isLatched, handleKey } = useKeyboard();

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
