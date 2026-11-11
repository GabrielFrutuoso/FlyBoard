import "./App.css";
import {
  currentMonitor,
  getCurrentWindow,
  LogicalSize,
  type PhysicalPosition,
  type PhysicalSize,
} from "@tauri-apps/api/window";
import { moveWindow, Position } from "@tauri-apps/plugin-positioner";
import { useEffect, useRef, useState } from "react";
import LayoutEditor from "./components/editor/LayoutEditor";
import { Key } from "./components/Key";
import { KeyboardGrid } from "./components/KeyboardGrid";
import Header from "./components/TitleBar";
import { isModifier } from "./keys";
import {
  DEFAULT_KEY_GAP,
  DEFAULT_KEY_LABEL_SIZE,
  DEFAULT_KEY_RADIUS,
  layoutSurfaceStyle,
  parseMacroKey,
} from "./utils/boardConfig";
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
    appearance,
    backgroundColor,
    transparency,
    keyGap,
    keyRadius,
    keyLabelSize,
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

  const [isKiosk, setIsKiosk] = useState(false);
  const [isTogglingKiosk, setIsTogglingKiosk] = useState(false);
  const kioskMonitor = useRef<{ width: number; height: number } | null>(null);
  const savedBounds = useRef<{
    size: PhysicalSize;
    position: PhysicalPosition;
  } | null>(null);

  useEffect(() => {
    const configureWindow = async () => {
      const monitor = kioskMonitor.current;
      if (monitor) {
        const height = (await appWindow.innerSize()).toLogical(
          await appWindow.scaleFactor(),
        ).height;
        const minHeight = Math.min(minimumKioskHeight, monitor.height);
        await appWindow.setSizeConstraints({
          minWidth: monitor.width,
          maxWidth: monitor.width,
          minHeight,
          maxHeight: monitor.height,
        });
        await appWindow.setSize(
          new LogicalSize(monitor.width, Math.max(height, minHeight)),
        );
        await moveWindow(Position.BottomCenter);
      } else {
        await appWindow.setMinSize(new LogicalSize(minimumWidth, minimumHeight));
        await appWindow.setSize(new LogicalSize(minimumWidth, minimumHeight));
      }
    };

    configureWindow().catch(console.error);
  }, [minimumHeight, minimumKioskHeight, minimumWidth]);

  const toggleKiosk = async () => {
    setIsTogglingKiosk(true);
    try {
      if (isKiosk) {
        const bounds = savedBounds.current;
        if (!bounds) {
          throw new Error(
            "Cannot exit kiosk mode because the previous window size is unavailable",
          );
        }

        const monitor = kioskMonitor.current;
        const kioskBounds = {
          size: await appWindow.innerSize(),
          position: await appWindow.outerPosition(),
        };
        try {
          await appWindow.setSizeConstraints({
            minWidth: minimumWidth,
            minHeight: minimumHeight,
          });
          await appWindow.setSize(bounds.size);
          await appWindow.setPosition(bounds.position);
          await appWindow.setResizable(true);
        } catch (error) {
          if (monitor) {
            try {
              await appWindow.setSizeConstraints({
                minWidth: monitor.width,
                maxWidth: monitor.width,
                minHeight: Math.min(minimumKioskHeight, monitor.height),
                maxHeight: monitor.height,
              });
              await appWindow.setSize(kioskBounds.size);
              await appWindow.setPosition(kioskBounds.position);
            } catch (restoreError) {
              console.error("Could not restore kiosk mode", restoreError);
            }
          }
          throw error;
        }

        kioskMonitor.current = null;
        savedBounds.current = null;
        setIsKiosk(false);
        return;
      }

      const monitor = await currentMonitor();
      if (!monitor) {
        throw new Error(
          "Cannot enable kiosk mode because the current monitor is unavailable",
        );
      }

      const bounds = {
        size: await appWindow.innerSize(),
        position: await appWindow.outerPosition(),
      };
      const width = monitor.size.width / monitor.scaleFactor;
      const height = monitor.size.height / monitor.scaleFactor;
      const kioskHeight = Math.min(minimumKioskHeight, height);

      try {
        await appWindow.setSizeConstraints({
          minWidth: width,
          maxWidth: width,
          minHeight: kioskHeight,
          maxHeight: height,
        });
        await appWindow.setSize(new LogicalSize(width, kioskHeight));
        await moveWindow(Position.BottomCenter);
        await appWindow.setResizable(true);
      } catch (error) {
        try {
          await appWindow.setSizeConstraints({
            minWidth: minimumWidth,
            minHeight: minimumHeight,
          });
          await appWindow.setSize(bounds.size);
          await appWindow.setPosition(bounds.position);
          await appWindow.setResizable(true);
        } catch (restoreError) {
          console.error(
            "Could not restore the window after enabling kiosk mode",
            restoreError,
          );
        }
        throw error;
      }

      savedBounds.current = bounds;
      kioskMonitor.current = { width, height };
      setIsKiosk(true);
    } finally {
      setIsTogglingKiosk(false);
    }
  };

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
              appWindow.startResizeDragging("North").catch(console.error);
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
              borderColor={keyStyle.borderColor}
              borderTransparency={keyStyle.borderTransparency}
              backgroundColor={keyStyle.backgroundColor}
              keyRadius={keyRadius ?? DEFAULT_KEY_RADIUS}
              keyGap={keyGapSize}
              keyLabelSize={keyLabelSize ?? DEFAULT_KEY_LABEL_SIZE}
              appearance={keyStyle.appearance ?? appearance}
              transparency={keyStyle.transparency ?? transparency}
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
  useEffect(() => {
    const preventContextMenu = (event: MouseEvent) => event.preventDefault();
    document.addEventListener("contextmenu", preventContextMenu);

    return () =>
      document.removeEventListener("contextmenu", preventContextMenu);
  }, []);

  return windowLabel === "editor" ? <LayoutEditor /> : <Keyboard />;
}

export default App;
