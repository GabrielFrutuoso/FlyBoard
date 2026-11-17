import { useDraggable } from "@dnd-kit/core";
import { useState } from "react";
import {
  macroKey,
  PALETTE_CHAR_KEYS,
  PALETTE_MODIFIERS,
  PALETTE_NAMED_KEYS,
  type Macro,
} from "../../utils/boardConfig";

interface KeyPaletteProps {
  macros?: Macro[];
  onPick: (key: string) => void;
}

const sectionTitle =
  "mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500";
const chip =
  "flex h-8 min-w-0 cursor-grab items-center justify-center rounded-sm border border-zinc-700 bg-zinc-900 px-2 text-[10px] text-zinc-200 shadow-[inset_0_1px_0_rgb(255_255_255/4%)] transition-colors hover:border-zinc-500 hover:bg-zinc-800 active:cursor-grabbing";

function PaletteSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className={sectionTitle}>{title}</h3>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-1.5">
        {children}
      </div>
    </section>
  );
}

function PaletteChip({
  dragKey,
  label,
  className,
  onPick,
}: {
  dragKey: string;
  label: string;
  className: string;
  onPick: (key: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${dragKey}`,
    data: { type: "palette", key: dragKey },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onPick(dragKey)}
      className={className}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      title={`Click to add or drag ${label} onto the keyboard`}
      {...listeners}
      {...attributes}
    >
      <span className="truncate">{label}</span>
    </button>
  );
}

export function KeyPalette({ macros = [], onPick }: KeyPaletteProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("characters");
  const renderKey = (key: string, label = key, className = chip) => (
    <PaletteChip
      key={`${label}-${key}`}
      dragKey={key}
      label={label}
      className={className}
      onPick={onPick}
    />
  );

  const sections = [
    {
      id: "characters",
      title: "Characters",
      items: PALETTE_CHAR_KEYS.map((key) => ({ key, label: key })),
    },
    {
      id: "named",
      title: "Named keys",
      items: PALETTE_NAMED_KEYS.map((key) => ({ key, label: key })),
    },
    {
      id: "modifiers",
      title: "Modifiers",
      items: PALETTE_MODIFIERS.map((key) => ({ key, label: key })),
    },
    {
      id: "macros",
      title: "Macros",
      items: macros.map((macro) => ({
        key: macroKey(macro.id),
        label: `⚡ ${macro.name}`,
      })),
    },
  ];
  const search = query.trim().toLocaleLowerCase();
  const filteredSections = sections
    .filter((section) => category === "all" || section.id === category)
    .map((section) => ({
      ...section,
      items: section.items.filter(
        ({ key, label }) =>
          search.length === 0 ||
          key.toLocaleLowerCase().includes(search) ||
          label.toLocaleLowerCase().includes(search),
      ),
    }))
    .filter((section) => section.items.length > 0);
  const categories = [
    { id: "characters", label: "Characters" },
    { id: "named", label: "Named keys" },
    { id: "modifiers", label: "Modifiers" },
    ...(macros.length > 0 ? [{ id: "macros", label: "Macros" }] : []),
    { id: "all", label: "All" },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex min-w-0 shrink-0 items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search keys"
          aria-label="Search keys"
          className="w-52 max-w-[30%] min-w-36 rounded-sm border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-sky-600"
        />
        <div
          className="flex min-w-0 items-center gap-0.5 overflow-x-auto rounded-sm border border-zinc-800 bg-zinc-900/70 p-0.5"
          role="group"
          aria-label="Key category"
        >
          {categories.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={category === id}
              onClick={() => setCategory(id)}
              className={`shrink-0 rounded-sm px-2 py-1 text-[10px] transition-colors ${
                category === id
                  ? "bg-sky-900/70 text-sky-100 shadow-sm"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filteredSections.length > 0 ? (
          filteredSections.map((section) => (
            <PaletteSection key={section.id} title={section.title}>
              {section.items.map(({ key, label }) =>
                renderKey(
                  key,
                  label,
                  section.id === "macros"
                    ? `${chip} border-amber-700 bg-amber-950 text-amber-100 hover:bg-amber-900`
                    : chip,
                ),
              )}
            </PaletteSection>
          ))
        ) : (
          <p className="py-2 text-center text-[10px] text-zinc-500">
            No matching keys.
          </p>
        )}
      </div>
    </div>
  );
}
