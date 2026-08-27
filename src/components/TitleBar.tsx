import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, X } from "lucide-react";

const appWindow = getCurrentWindow();

const Header = () => {
  return (
    <header
      data-tauri-drag-region
      className="flex h-6 shrink-0 select-none items-start justify-between pl-2"
    >
      <h1 data-tauri-drag-region className="text-xs text-zinc-300">
        FlyBoard
      </h1>

      <div className="flex items-center gap-1">
        <button
          className="rounded-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          onClick={() => appWindow.minimize()}
          aria-label="Minimize"
        >
          <Minus size={18} />
        </button>
        <button
          className="rounded-sm text-zinc-400 transition-colors hover:bg-red-600 hover:text-white"
          onClick={() => appWindow.close()}
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;
