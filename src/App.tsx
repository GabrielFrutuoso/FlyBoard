import "./App.css";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { useEffect } from "react";
import LayoutEditor from "./components/editor/LayoutEditor";
import { Key } from "./components/Key";
import { KeyboardGrid } from "./components/KeyboardGrid";
import Header from "./components/TitleBar";
import { useKeyboard } from "./utils/useKeyboard";

const windowLabel = getCurrentWindow().label;
const appWindow = getCurrentWindow();

function Keyboard() {
  const {
    resolve,
    getLabel,
    getMacroIcon,
    getMacroName,
    isLatched,
    isAccentAvailable,
    isPressed,
    handleKey,
    inputError,
    layoutId,
    layouts,
    setLayout,
    rows,
    unitFor,
    keySizeFor,
  } = useKeyboard();

  const rowSpans = rows.map((row, rowIndex) =>
    row.reduce(
      (total, key, keyIndex) =>
        total +
        Math.max(
          1,
          Math.round(unitFor(key) * 4 * keySizeFor(rowIndex, keyIndex).width),
        ),
      0,
    ),
  );
  const maxColumns = Math.max(...rowSpans, 1);
  const maxRowHeight = Math.max(
    ...rows.map((row, rowIndex) =>
      Math.max(
        1,
        ...row.map((_, keyIndex) => keySizeFor(rowIndex, keyIndex).height),
      ),
    ),
  );
  const minimumWidth = Math.max(220, Math.ceil(maxColumns * 5.5 + 10));
  const minimumHeight = Math.max(
    82,
    Math.ceil(
      26 + rows.length * 17 * maxRowHeight + Math.max(0, rows.length - 1) * 2,
    ),
  );

  useEffect(() => {
    appWindow
      .setMinSize(new LogicalSize(minimumWidth, minimumHeight))
      .then(() =>
        appWindow.setSize(new LogicalSize(minimumWidth, minimumHeight)),
      )
      .catch(console.error);
  }, [minimumHeight, minimumWidth]);

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950">
      <Header
        layouts={layouts}
        activeLayoutId={layoutId}
        onSelectLayout={setLayout}
      />
      {inputError && (
        <p className="mb-1 shrink-0 rounded-sm border border-amber-800 bg-amber-950 px-2 py-1 text-xs text-amber-100">
          {inputError}
        </p>
      )}
      <KeyboardGrid
        rows={rows}
        unitFor={unitFor}
        keySizeFor={keySizeFor}
        renderKey={(key, _rowIndex, _keyIndex, span, size) => {
          const effective = resolve(key);
          return (
            <Key
              key={`${key}-${_rowIndex}-${_keyIndex}`}
              label={getLabel(effective)}
              macroIcon={getMacroIcon(effective)}
              macroName={getMacroName(effective)}
              size={size}
              onClick={() => handleKey(effective)}
              span={span}
              isActive={isLatched(key)}
              isPressed={isPressed(effective)}
              isAvailable={isAccentAvailable(effective)}
            />
          );
        }}
        className="flex min-h-0 w-full flex-1 flex-col gap-0.5 p-0.5 text-[clamp(0.625rem,2.2vh,1rem)]"
      />
    </main>
  );
}

function App() {
  return windowLabel === "editor" ? <LayoutEditor /> : <Keyboard />;
}

export default App;
