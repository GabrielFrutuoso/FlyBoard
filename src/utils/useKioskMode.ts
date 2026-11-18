import {
  currentMonitor,
  getCurrentWindow,
  LogicalSize,
  type PhysicalPosition,
  type PhysicalSize,
} from "@tauri-apps/api/window";
import { moveWindow, Position } from "@tauri-apps/plugin-positioner";
import { useEffect, useRef, useState } from "react";

const appWindow = getCurrentWindow();
const kioskHeightKey = "flyboard_kiosk_height";

interface WindowMinimums {
  width: number;
  height: number;
  kioskHeight: number;
}

interface WindowBounds {
  size: PhysicalSize;
  position: PhysicalPosition;
}

interface KioskMonitor {
  width: number;
  height: number;
  scaleFactor: number;
}

function saveKioskHeight(height: number) {
  try {
    localStorage.setItem(kioskHeightKey, String(height));
  } catch (error) {
    console.error("Could not save kiosk height", error);
  }
}

export function useKioskMode(minimums: WindowMinimums) {
  const [isKiosk, setIsKiosk] = useState(false);
  const [isTogglingKiosk, setIsTogglingKiosk] = useState(false);
  const kioskMonitor = useRef<KioskMonitor | null>(null);
  const isRestoringWindow = useRef(false);
  const savedBounds = useRef<WindowBounds | null>(null);

  useEffect(() => {
    const configureWindow = async () => {
      const monitor = kioskMonitor.current;
      if (monitor) {
        const logicalSize = (await appWindow.innerSize()).toLogical(
          await appWindow.scaleFactor(),
        );
        const minHeight = Math.min(minimums.kioskHeight, monitor.height);
        await appWindow.setSizeConstraints({
          minWidth: monitor.width,
          maxWidth: monitor.width,
          minHeight,
          maxHeight: monitor.height,
        });
        await appWindow.setSize(
          new LogicalSize(
            monitor.width,
            Math.max(logicalSize.height, minHeight),
          ),
        );
        await moveWindow(Position.BottomCenter);
        return;
      }

      await appWindow.setMinSize(
        new LogicalSize(minimums.width, minimums.height),
      );
      await appWindow.setSize(
        new LogicalSize(minimums.width, minimums.height),
      );
    };

    configureWindow().catch(console.error);
  }, [minimums.height, minimums.kioskHeight, minimums.width]);

  useEffect(() => {
    if (!isKiosk) return;

    let disposed = false;
    let unlisten: (() => void) | undefined;
    appWindow
      .onResized(({ payload }) => {
        const monitor = kioskMonitor.current;
        if (!monitor || isRestoringWindow.current) return;
        saveKioskHeight(payload.toLogical(monitor.scaleFactor).height);
      })
      .then((stopListening) => {
        if (disposed) stopListening();
        else unlisten = stopListening;
      })
      .catch(console.error);

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [isKiosk]);

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
        if (monitor) {
          saveKioskHeight(kioskBounds.size.toLogical(monitor.scaleFactor).height);
        }
        isRestoringWindow.current = true;
        try {
          await appWindow.setSizeConstraints({
            minWidth: minimums.width,
            minHeight: minimums.height,
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
                minHeight: Math.min(minimums.kioskHeight, monitor.height),
                maxHeight: monitor.height,
              });
              await appWindow.setSize(kioskBounds.size);
              await appWindow.setPosition(kioskBounds.position);
            } catch (restoreError) {
              console.error("Could not restore kiosk mode", restoreError);
            }
          }
          throw error;
        } finally {
          isRestoringWindow.current = false;
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
      const minHeight = Math.min(minimums.kioskHeight, height);
      const savedHeight = Number(localStorage.getItem(kioskHeightKey));
      const kioskHeight =
        Number.isFinite(savedHeight) && savedHeight > 0
          ? Math.min(height, Math.max(minHeight, savedHeight))
          : minHeight;

      try {
        await appWindow.setSizeConstraints({
          minWidth: width,
          maxWidth: width,
          minHeight,
          maxHeight: height,
        });
        await appWindow.setSize(new LogicalSize(width, kioskHeight));
        await moveWindow(Position.BottomCenter);
        await appWindow.setResizable(true);
      } catch (error) {
        try {
          await appWindow.setSizeConstraints({
            minWidth: minimums.width,
            minHeight: minimums.height,
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
      kioskMonitor.current = { width, height, scaleFactor: monitor.scaleFactor };
      setIsKiosk(true);
    } finally {
      setIsTogglingKiosk(false);
    }
  };

  return {
    isKiosk,
    isTogglingKiosk,
    toggleKiosk,
    startResizeDragging: () =>
      appWindow.startResizeDragging("North").catch(console.error),
  };
}
