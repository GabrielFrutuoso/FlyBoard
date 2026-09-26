import { getCurrentWindow } from "@tauri-apps/api/window";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { ChevronDown, Minus, Pencil, X } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const appWindow = getCurrentWindow();

const openEditor = async () => {
  const editor = await WebviewWindow.getByLabel("editor");
  if (!editor) {
    console.error("Editor window is not available");
    return;
  }
  await editor.show();
  await editor.setFocus();
};

export interface LayoutOption {
  id: string;
  name: string;
}

interface HeaderProps {
  layouts?: LayoutOption[];
  activeLayoutId?: string;
  onSelectLayout?: (id: string) => void;
}

const Header = ({ layouts, activeLayoutId, onSelectLayout }: HeaderProps) => {
  const activeName =
    layouts?.find((layout) => layout.id === activeLayoutId)?.name ?? "PT-BR";

  return (
    <header className="flex shrink-0 select-none items-center justify-between pl-1.5">
      <div className="flex items-center gap-1">
        <h1
          data-tauri-drag-region
          className="text-xs font-semibold text-zinc-300"
        >
          FlyBoard
        </h1>
        {layouts && onSelectLayout && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              render={
                <Button
                  size="sm"
                  className="h-auto cursor-pointer gap-0.5 px-1 py-0 text-[9px] font-bold"
                />
              }
              title="Choose keyboard layout"
              aria-label="Choose keyboard layout"
            >
              {activeName}
              <ChevronDown size={10} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={4}
              className="max-h-[calc(100vh-2.5rem)] min-w-28 overflow-y-auto rounded-sm border border-zinc-700 bg-zinc-900 py-0.5 text-zinc-200 shadow-lg"
            >
              {layouts.map((layout) => (
                <DropdownMenuItem
                  key={layout.id}
                  onClick={() => onSelectLayout(layout.id)}
                  className={`cursor-pointer px-2 py-1 text-[11px] hover:bg-zinc-700 focus:bg-zinc-700 ${
                    layout.id === activeLayoutId
                      ? "font-semibold text-zinc-100"
                      : "text-zinc-300"
                  }`}
                >
                  {layout.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {onSelectLayout && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-auto w-auto cursor-pointer rounded-sm p-0.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            onClick={() => openEditor().catch(console.error)}
            title="Edit layouts & macros"
            aria-label="Edit layouts and macros"
          >
            <Pencil size={8} />
          </Button>
        )}
      </div>

      <div
        data-tauri-drag-region
        className="h-6 min-w-3 flex-1 self-stretch"
        aria-hidden="true"
      />

      <div className="flex items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-auto w-auto rounded-sm p-0.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          onClick={() => appWindow.minimize()}
          aria-label="Minimize"
        >
          <Minus size={16} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-auto w-auto rounded-sm p-0.5 text-zinc-400 hover:bg-red-600 hover:text-white"
          onClick={() => appWindow.close()}
          aria-label="Close"
        >
          <X size={16} />
        </Button>
      </div>
    </header>
  );
};

export default Header;
