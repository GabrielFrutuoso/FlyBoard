import { Keyboard, Minus, Save, Sparkles, X, Zap } from "lucide-react";
import { useEffect } from "react";
import { HashRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { Button } from "../ui/button";
import LayoutsTab from "./LayoutsTab";
import MacrosTab from "./MacrosTab";
import { useBoardDocument } from "./hooks/useBoardDocument";
import { useEditorWindow } from "./hooks/useEditorWindow";

const TABS = [
  {
    path: "layouts",
    label: "Layouts",
    description: "Arrange and style keys",
    icon: Keyboard,
  },
  {
    path: "macros",
    label: "Macros",
    description: "Build reusable actions",
    icon: Zap,
  },
] as const;

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `group flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 transition ${
    isActive
      ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10"
      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
  }`;

const LayoutEditor = () => {
  const { appWindow, error: windowError } = useEditorWindow();
  const { boards, loaded, dirty, saving, error, updateBoards, save } =
    useBoardDocument();

  const displayError = windowError ?? error;

  useEffect(() => {
    const handleSaveShortcut = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "s"
      ) {
        event.preventDefault();
        if (dirty && !saving) save();
      }
    };
    window.addEventListener("keydown", handleSaveShortcut);
    return () => window.removeEventListener("keydown", handleSaveShortcut);
  }, [dirty, save, saving]);

  return (
    <HashRouter>
      <main className="editor-shell flex h-screen w-screen flex-col overflow-hidden text-zinc-100">
        <header className="editor-titlebar flex h-16 shrink-0 select-none items-center border-b border-white/7 px-4">
          <div
            data-tauri-drag-region
            className="flex min-w-48 items-center gap-3"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-sky-400 text-zinc-950 shadow-[0_8px_30px_rgb(56_189_248/20%)]">
              <Sparkles size={17} strokeWidth={2.4} />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">
                Layout Editor
              </h1>
              <p className="text-[10px] text-zinc-500">
                Make your keyboard feel like yours
              </p>
            </div>
          </div>
          <nav className="ml-6 flex items-center gap-1.5">
            {TABS.map(({ path, label, description, icon: Icon }) => (
              <NavLink key={path} to={`/${path}`} className={navLinkClass}>
                <Icon
                  size={16}
                  className="text-sky-300/80 group-[.active]:text-sky-300"
                />
                <span>
                  <span className="block text-xs font-medium">{label}</span>
                  <span className="hidden text-[9px] text-zinc-500 xl:block">
                    {description}
                  </span>
                </span>
              </NavLink>
            ))}
          </nav>
          <div
            data-tauri-drag-region
            className="h-full min-w-4 flex-1 self-stretch"
            aria-hidden="true"
          />
          <div className="ml-auto flex items-center gap-2">
            {(dirty || saving) && (
              <span
                className={`hidden items-center gap-1.5 text-[11px] sm:flex ${
                  dirty ? "text-amber-200" : "text-zinc-400"
                }`}
                role="status"
                aria-live="polite"
              >
                <span
                  className={`size-1.5 rounded-full ${
                    saving ? "animate-pulse bg-sky-300" : "bg-amber-300"
                  }`}
                />
                {saving ? "Saving…" : "Unsaved changes"}
              </span>
            )}
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
              className="h-8 cursor-pointer gap-1.5 rounded-lg bg-sky-300 px-3 text-xs font-semibold text-zinc-950 shadow-sm hover:bg-sky-200 disabled:bg-white/6 disabled:text-zinc-500"
              title="Save changes (Ctrl/⌘+S)"
            >
              <Save size={14} />
              {saving ? "Saving…" : dirty ? "Save" : "Saved"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer rounded-lg p-0 text-zinc-500 hover:bg-white/6 hover:text-zinc-100"
              onClick={() => appWindow.minimize()}
              aria-label="Minimize"
            >
              <Minus size={18} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer rounded-lg p-0 text-zinc-500 hover:bg-red-500/90 hover:text-white"
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
            <div className="flex flex-1 items-center justify-center gap-3 text-sm text-zinc-400">
              <span className="size-4 animate-spin rounded-full border-2 border-zinc-700 border-t-sky-300" />
              Opening your workspace…
            </div>
          )}
        </div>
      </main>
    </HashRouter>
  );
};

export default LayoutEditor;
