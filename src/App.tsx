import "./App.css";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect } from "react";
import LayoutEditor from "./components/editor/LayoutEditor";
import { Key } from "./components/Key";
import { KeyboardGrid } from "./components/KeyboardGrid";
import Header from "./components/TitleBar";
import { isModifier } from "./keys";
import {
  DEFAULT_KEY_GAP,
  DEFAULT_KEYBOARD_PADDING,
  DEFAULT_KEY_LABEL_SIZE,
  DEFAULT_KEY_RADIUS,
  clampInteger,
  layoutSurfaceStyle,
  parseMacroKey,
} from "./utils/boardConfig";
import { useKeyboard } from "./utils/useKeyboard";
import { useKioskMode } from "./utils/useKioskMode";

const windowLabel = getCurrentWindow().label;

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
    appearance,
    backgroundColor,
    transparency,
    keyGap,
    keyRadius,
    keyLabelSize,
    keyboardPadding,
    unitFor,
    keySizeFor,
    styleFor,
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
    Math.ceil(26 + rows.length * 17 * maxRowHeight),
  );
  const minimumKioskHeight = Math.max(
    150,
    Math.ceil(32 + rows.length * 28 * maxRowHeight),
  );

  const {
    isKiosk,
    isTogglingKiosk,
    toggleKiosk,
    startResizeDragging,
  } = useKioskMode({
    width: minimumWidth,
    height: minimumHeight,
    kioskHeight: minimumKioskHeight,
  });

  return (
    <main
      className="keyboard-surface flex h-screen w-screen flex-col overflow-hidden"
      data-appearance={appearance}
      style={layoutSurfaceStyle({
        appearance,
        backgroundColor,
        transparency,
      })}
    >
      {isKiosk && (
        <div
          className="flex h-2 shrink-0 cursor-ns-resize items-center justify-center"
          title="Drag to resize keyboard height"
          aria-hidden="true"
          onMouseDown={(event) => {
            if (event.button === 0 && !isTogglingKiosk) {
              startResizeDragging();
            }
          }}
        >
          <div className="h-0.5 w-12 rounded-full bg-zinc-500" />
        </div>
      )}
      <Header
        layouts={layouts}
        activeLayoutId={layoutId}
        onSelectLayout={setLayout}
        isKiosk={isKiosk}
        isTogglingKiosk={isTogglingKiosk}
        onToggleKiosk={() => toggleKiosk().catch(console.error)}
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
        keyGap={keyGap ?? DEFAULT_KEY_GAP}
        renderKey={(key, rowIndex, keyIndex, span, size, keyGapSize) => {
          const effective = resolve(key);
          const keyStyle = styleFor(rowIndex, keyIndex);
          return (
            <Key
              key={`${key}-${rowIndex}-${keyIndex}`}
              label={getLabel(effective)}
              macroIcon={getMacroIcon(effective)}
              macroName={getMacroName(effective)}
              size={size}
              onClick={() => handleKey(effective)}
              onRepeat={() => handleKey(effective)}
              repeatable={
                !isModifier(effective) &&
                effective !== "Caps" &&
                effective !== "Fn" &&
                parseMacroKey(effective) === null
              }
              span={span}
              labelColor={keyStyle.labelColor}
              labelWeight={keyStyle.labelWeight}
              labelOverride={keyStyle.customLabel}
              borderColor={keyStyle.borderColor}
              borderWidth={keyStyle.borderWidth}
              borderTransparency={keyStyle.borderTransparency}
              backgroundColor={keyStyle.backgroundColor}
              keyRadius={
                keyStyle.radius ?? keyRadius ?? DEFAULT_KEY_RADIUS
              }
              keyGap={keyGapSize}
              keyLabelSize={
                keyStyle.labelSize ?? keyLabelSize ?? DEFAULT_KEY_LABEL_SIZE
              }
              appearance={keyStyle.appearance ?? appearance}
              transparency={keyStyle.transparency ?? transparency}
              isActive={isLatched(key)}
              isPressed={isPressed(key) || isPressed(effective)}
              isAvailable={isAccentAvailable(effective)}
            />
          );
        }}
        className="flex min-h-0 w-full flex-1 flex-col gap-0.5 text-[clamp(0.625rem,2.2vh,1rem)]"
        style={{
          padding: `${clampInteger(
            keyboardPadding,
            DEFAULT_KEYBOARD_PADDING,
            0,
            24,
          )}px`,
        }}
      />
    </main>
  );
}

function App() {
  useEffect(() => {
    const preventContextMenu = (event: MouseEvent) => event.preventDefault();
    document.addEventListener("contextmenu", preventContextMenu);

    return () =>
      document.removeEventListener("contextmenu", preventContextMenu);
  }, []);

  return windowLabel === "editor" ? <LayoutEditor /> : <Keyboard />;
}

export default App;
