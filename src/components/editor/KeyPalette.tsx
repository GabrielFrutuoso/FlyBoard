import { useDraggable } from "@dnd-kit/core";
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
  "mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500";
const chip =
  "cursor-grab rounded-sm border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-700 active:cursor-grabbing";

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
      <div className="flex flex-wrap gap-1">{children}</div>
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
    data: { key: dragKey },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onPick(dragKey)}
      className={className}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      title="Click to add, or drag onto a row"
      {...listeners}
      {...attributes}
    >
      {label}
    </button>
  );
}

export function KeyPalette({ macros = [], onPick }: KeyPaletteProps) {
  const renderKey = (key: string, label = key, className = chip) => (
    <PaletteChip
      key={`${label}-${key}`}
      dragKey={key}
      label={label}
      className={className}
      onPick={onPick}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      <PaletteSection title="Characters">
        {PALETTE_CHAR_KEYS.map((key) => renderKey(key))}
      </PaletteSection>
      <PaletteSection title="Named keys">
        {PALETTE_NAMED_KEYS.map((key) => renderKey(key))}
      </PaletteSection>
      <PaletteSection title="Modifiers">
        {PALETTE_MODIFIERS.map((key) => renderKey(key))}
      </PaletteSection>
      {macros.length > 0 && (
        <PaletteSection title="Macros">
          {macros.map((macro) =>
            renderKey(
              macroKey(macro.id),
              `⚡ ${macro.name}`,
              `${chip} border-amber-700 bg-amber-950 text-amber-100 hover:bg-amber-900`,
            ),
          )}
        </PaletteSection>
      )}
    </div>
  );
}
