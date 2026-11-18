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
        className="editor-secondary-button h-auto w-fit cursor-pointer gap-1.5"
      >
        <Plus size={12} /> Add row
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onAddRow}
        className="editor-secondary-button h-auto w-fit cursor-pointer gap-1.5"
      >
        <Plus size={12} /> Add row
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => onRemoveRow(selectedRow)}
        className="editor-secondary-button h-auto w-fit cursor-pointer gap-1.5 text-red-300 hover:text-red-200"
      >
        <Trash2 size={12} /> Remove row {selectedRow + 1}
      </Button>
    </div>
  );
}
