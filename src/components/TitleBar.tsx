import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, X } from "lucide-react";
import type { Layout } from "../keys";

const appWindow = getCurrentWindow();

interface HeaderProps {
  layout?: Layout;
  onToggleLayout?: () => void;
}

const Header = ({ layout = "pt-br", onToggleLayout }: HeaderProps) => {
  return (
    <header
      data-tauri-drag-region
      className="flex h-6 shrink-0 select-none items-center justify-between pl-2"
    >
      <div data-tauri-drag-region className="flex items-center gap-2">
        <h1 data-tauri-drag-region className="text-xs font-semibold text-zinc-300">
          FlyBoard
        </h1>
        {onToggleLayout && (
          <button
            onClick={onToggleLayout}
            className="cursor-pointer rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
            title="Switch Keyboard Layout (PT-BR / EN)"
            aria-label="Toggle Keyboard Layout"
          >
            {layout === "pt-br" ? "PT-BR" : "EN"}
          </button>
        )}
      </div>

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
