import { Minus, Save, X } from "lucide-react";
import { HashRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { Button } from "../ui/button";
import LayoutsTab from "./LayoutsTab";
import MacrosTab from "./MacrosTab";
import { useBoardDocument } from "./hooks/useBoardDocument";
import { useEditorWindow } from "./hooks/useEditorWindow";

const TABS = [
  { path: "layouts", label: "layouts" },
  { path: "macros", label: "macros" },
] as const;

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `cursor-pointer rounded-sm px-2 py-1 text-xs capitalize ${
    isActive ? "bg-zinc-700 text-zinc-100" : "text-zinc-400 hover:bg-zinc-800"
  }`;

const LayoutEditor = () => {
  const { appWindow, error: windowError } = useEditorWindow();
  const { boards, loaded, dirty, saving, error, updateBoards, save } =
    useBoardDocument();

  const displayError = windowError ?? error;

  return (
    <HashRouter>
      <main className="flex h-screen w-screen flex-col bg-zinc-950 text-zinc-200">
        <header className="flex shrink-0 select-none items-center gap-2 border-b border-zinc-800 pl-2">
          <h1
            data-tauri-drag-region
            className="text-xs font-semibold text-zinc-300"
          >
            FlyBoard — Layout Editor
          </h1>
          <nav className="ml-2 flex gap-1">
            {TABS.map(({ path, label }) => (
              <NavLink key={path} to={`/${path}`} className={navLinkClass}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div
            data-tauri-drag-region
            className="h-7 min-w-4 flex-1 self-stretch"
            aria-hidden="true"
          />
          <div className="ml-auto flex items-center gap-1 pr-1">
            {displayError && (
              <span
                className="max-w-56 truncate text-[10px] text-red-400"
                title={displayError}
              >
                {displayError}
              </span>
            )}
            <Button
              type="button"
              size="sm"
              onClick={save}
              disabled={saving || !dirty}
              className="h-auto cursor-pointer gap-1 px-2 py-1 text-xs disabled:opacity-40"
            >
              <Save size={12} />
              {saving ? "Saving…" : dirty ? "Save" : "Saved"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-auto w-auto cursor-pointer rounded-sm p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              onClick={() => appWindow.minimize()}
              aria-label="Minimize"
            >
              <Minus size={18} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-auto w-auto cursor-pointer rounded-sm p-1 text-zinc-400 hover:bg-red-600 hover:text-white"
              onClick={() => appWindow.close()}
              aria-label="Close"
            >
              <X size={18} />
            </Button>
          </div>
        </header>
        <div className="flex min-h-0 flex-1">
          {loaded ? (
            <Routes>
              <Route path="/" element={<Navigate to="/layouts" replace />} />
              <Route
                path="/layouts"
                element={<LayoutsTab boards={boards} onChange={updateBoards} />}
              />
              <Route
                path="/macros"
                element={<MacrosTab boards={boards} onChange={updateBoards} />}
              />
              <Route path="*" element={<Navigate to="/layouts" replace />} />
            </Routes>
          ) : (
            <p className="p-4 text-xs text-zinc-500">Loading…</p>
          )}
        </div>
      </main>
    </HashRouter>
  );
};

export default LayoutEditor;
