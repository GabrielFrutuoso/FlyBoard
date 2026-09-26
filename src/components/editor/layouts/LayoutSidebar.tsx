import { Plus } from "lucide-react";
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
    <aside className="flex w-44 shrink-0 flex-col gap-1 border-r border-zinc-800 p-2">
      <h2 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        Layouts
      </h2>
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        {layouts.map((layout) => (
          <button
            key={layout.id}
            type="button"
            onClick={() => onSelect(layout.id)}
            className={`cursor-pointer rounded-sm px-2 py-1 text-left text-xs ${
              layout.id === selectedId
                ? "bg-zinc-700 text-zinc-100"
                : "text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            {layout.name}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-1 border-t border-zinc-800 pt-2">
        <input
          value={newName}
          onChange={(event) => onNewNameChange(event.target.value)}
          placeholder="New layout name"
          className="rounded-sm border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-sky-600"
        />
        <select
          value={template}
          onChange={(event) => onTemplateChange(event.target.value)}
          className="cursor-pointer rounded-sm border border-zinc-700 bg-zinc-900 px-1 py-1 text-xs text-zinc-300 outline-none"
        >
          <option value="blank">Blank</option>
          <option value="pt-br">PT-BR template</option>
          <option value="en">EN template</option>
        </select>
        <Button
          type="button"
          size="sm"
          onClick={onCreate}
          className="h-auto cursor-pointer gap-1 px-2 py-1 text-xs"
        >
          <Plus size={12} /> Create
        </Button>
      </div>
    </aside>
  );
}
