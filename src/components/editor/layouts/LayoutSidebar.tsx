import { Check, Keyboard, LockKeyhole, Plus } from "lucide-react";
import type { BoardLayout } from "../../../utils/boardConfig";
import { Button } from "../../ui/button";

interface LayoutSidebarProps {
  layouts: BoardLayout[];
  selectedId: string;
  onSelect: (id: string) => void;
  newName: string;
  onNewNameChange: (name: string) => void;
  template: string;
  onTemplateChange: (template: string) => void;
  onCreate: () => void;
}

export function LayoutSidebar({
  layouts,
  selectedId,
  onSelect,
  newName,
  onNewNameChange,
  template,
  onTemplateChange,
  onCreate,
}: LayoutSidebarProps) {
  return (
    <section className="flex h-full min-h-0 flex-col p-3">
      <div className="mb-3">
        <p className="editor-eyebrow">Workspace</p>
        <h2 className="mt-1 text-sm font-semibold text-zinc-100">
          Your layouts
        </h2>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
          Choose a starting point, then make it your own.
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {layouts.map((layout) => (
          <button
            key={layout.id}
            type="button"
            onClick={() => onSelect(layout.id)}
            className={`group flex w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-xl border px-2.5 py-2.5 text-left transition ${
              layout.id === selectedId
                ? "border-sky-400/25 bg-sky-400/10 text-zinc-100"
                : "border-transparent text-zinc-400 hover:border-white/6 hover:bg-white/4 hover:text-zinc-200"
            }`}
            title={layout.name}
          >
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                layout.id === selectedId
                  ? "bg-sky-300 text-zinc-950"
                  : "bg-zinc-800/80 text-zinc-500 group-hover:text-zinc-300"
              }`}
            >
              <Keyboard size={14} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium">
                {layout.name}
              </span>
              <span className="mt-0.5 flex items-center gap-1 text-[9px] text-zinc-500">
                {layout.builtin ? (
                  <>
                    <LockKeyhole size={9} /> Built-in template
                  </>
                ) : (
                  `${layout.rows.length} rows · ${layout.rows.reduce(
                    (count, row) => count + row.length,
                    0,
                  )} keys`
                )}
              </span>
            </span>
            {layout.id === selectedId && (
              <Check size={13} className="shrink-0 text-sky-300" />
            )}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-2 rounded-xl border border-white/7 bg-black/15 p-3">
        <div>
          <p className="text-[11px] font-medium text-zinc-200">
            Create a layout
          </p>
          <p className="mt-0.5 text-[9px] text-zinc-500">
            Start blank or from a familiar keyboard.
          </p>
        </div>
        <input
          value={newName}
          onChange={(event) => onNewNameChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onCreate();
          }}
          placeholder="Layout name"
          className="editor-input"
        />
        <select
          value={template}
          onChange={(event) => onTemplateChange(event.target.value)}
          className="editor-input cursor-pointer"
        >
          <option value="blank">Blank</option>
          <option value="pt-br">PT-BR template</option>
          <option value="en">EN template</option>
        </select>
        <Button
          type="button"
          size="sm"
          onClick={onCreate}
          className="h-8 cursor-pointer gap-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200"
        >
          <Plus size={13} /> Create layout
        </Button>
      </div>
    </section>
  );
}
