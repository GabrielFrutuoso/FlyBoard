import { Plus, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";

interface RowControlsProps {
  hasRows: boolean;
  selectedRow: number;
  onAddRow: () => void;
  onRemoveRow: (rowIndex: number) => void;
}

export function RowControls({
  hasRows,
  selectedRow,
  onAddRow,
  onRemoveRow,
}: RowControlsProps) {
  if (!hasRows) {
    return (
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onAddRow}
        className="mt-1 h-auto w-fit cursor-pointer gap-1 px-2 py-1 text-xs text-zinc-300"
      >
        <Plus size={12} /> Add row
      </Button>
    );
  }

  return (
    <div className="mt-1 flex items-center gap-1">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onAddRow}
        className="mt-1 h-auto w-fit cursor-pointer gap-1 px-2 py-1 text-xs text-zinc-300"
      >
        <Plus size={12} /> Add row
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => onRemoveRow(selectedRow)}
        className="h-auto w-fit cursor-pointer gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-200"
      >
        <Trash2 size={12} /> Remove row {selectedRow + 1}
      </Button>
    </div>
  );
}
