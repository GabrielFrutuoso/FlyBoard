import "./App.css";
import { Key } from "./components/Key";
import Header from "./components/TitleBar";
import { KEY_UNITS } from "./keys";
import { useKeyboard } from "./utils/useKeyboard";

function App() {
  const {
    resolve,
    getLabel,
    isLatched,
    isPressed,
    handleKey,
    inputError,
    layout,
    toggleLayout,
    rows,
  } = useKeyboard();

  return (
    <main className="flex h-screen w-screen flex-col bg-zinc-950">
      <Header layout={layout} onToggleLayout={toggleLayout} />
      {inputError && (
        <p className="mb-1 shrink-0 rounded-sm border border-amber-800 bg-amber-950 px-2 py-1 text-xs text-amber-100">
          {inputError}
        </p>
      )}
      <div className="flex min-h-0 w-full flex-1 flex-col gap-1 p-1 text-[clamp(0.75rem,2.4vh,1.125rem)]">
        {rows.map((row, i) => {
          const units = KEY_UNITS[layout];
          const spans = row.map((key) => Math.round((units[key] ?? 1) * 4));
          const totalColumns = spans.reduce((sum, span) => sum + span, 0);
          return (
            <div
              className="grid w-full min-h-0 flex-1 gap-1"
              style={{
                gridTemplateColumns: `repeat(${totalColumns}, minmax(0, 1fr))`,
              }}
              key={i}
            >
              {row.map((key, index) => {
                const effective = resolve(key);
                return (
                  <Key
                    key={`${key}-${index}`}
                    label={getLabel(effective)}
                    onClick={() => handleKey(effective)}
                    span={spans[index]}
                    isActive={isLatched(key)}
                    isPressed={isPressed(effective)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </main>
  );
}

export default App;
