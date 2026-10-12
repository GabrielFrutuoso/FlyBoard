import {
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { DropTarget } from "./types";

type RowDragData = { type: "row"; rowIndex: number };
type ActiveDragData = RowDragData | { key: string };

const isRowDragData = (data: ActiveDragData | undefined): data is RowDragData =>
  !!data && "type" in data && data.type === "row";

type OverDropData = {
  rowIndex: number;
  keyIndex?: number;
  isRowEnd?: boolean;
};

/** Small grip button used to pick up and reorder a whole row. */
export function RowDragHandle({ rowIndex }: { rowIndex: number }) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `row-handle:${rowIndex}`,
    data: { type: "row", rowIndex },
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      className="flex w-4 shrink-0 cursor-grab items-center justify-center rounded-sm text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300 active:cursor-grabbing"
      title="Drag to reorder row"
      {...listeners}
      {...attributes}
    >
      <GripVertical size={12} />
    </button>
  );
}

/** Droppable wrapper for a whole row: append-key target, row-reorder target, and (when editable) a drag handle. */
export function RowSlot({
  rowIndex,
  isLastRow,
  editable,
  rowDropTarget,
  draggingRowIndex,
  children,
}: {
  rowIndex: number;
  isLastRow: boolean;
  editable: boolean;
  rowDropTarget: number | null;
  draggingRowIndex: number | null;
  children: ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id: `row:${rowIndex}`,
    data: { rowIndex, isRowEnd: true },
  });
  const showBefore = rowDropTarget === rowIndex;
  const showAfter = isLastRow && rowDropTarget === rowIndex + 1;

  return (
    <div className="relative flex min-h-0 flex-1 items-stretch gap-1">
      {showBefore && (
        <div className="absolute inset-x-0 -top-0.5 z-10 h-0.5 rounded-full bg-sky-400" />
      )}
      {editable && <RowDragHandle rowIndex={rowIndex} />}
      <div
        ref={setNodeRef}
        className="flex min-h-0 w-full flex-1"
        style={{ opacity: draggingRowIndex === rowIndex ? 0.4 : 1 }}
      >
        {children}
      </div>
      {showAfter && (
        <div className="absolute inset-x-0 -bottom-0.5 z-10 h-0.5 rounded-full bg-sky-400" />
      )}
    </div>
  );
}

/** Droppable wrapper for a single key, split into before/after insertion halves via dropTarget. */
export function KeySlot({
  rowIndex,
  keyIndex,
  span,
  isRowEnd,
  dropTarget,
  children,
}: {
  rowIndex: number;
  keyIndex: number;
  span: number;
  isRowEnd: boolean;
  dropTarget: DropTarget | null;
  children: ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id: `key:${rowIndex}:${keyIndex}`,
    data: { rowIndex, keyIndex },
  });
  const showBefore =
    dropTarget?.rowIndex === rowIndex && dropTarget.index === keyIndex;
  const showAfter =
    isRowEnd &&
    dropTarget?.rowIndex === rowIndex &&
    dropTarget.index === keyIndex + 1;

  return (
    <div
      ref={setNodeRef}
      className="relative h-full min-w-0"
      style={{ gridColumn: `span ${span}` }}
    >
      {showBefore && (
        <div className="absolute inset-y-0 -left-0.5 z-10 w-0.5 rounded-full bg-sky-400" />
      )}
      {children}
      {showAfter && (
        <div className="absolute inset-y-0 -right-0.5 z-10 w-0.5 rounded-full bg-sky-400" />
      )}
    </div>
  );
}

interface UseLayoutDragAndDropOptions {
  rows: string[][];
  labelFor: (key: string) => string;
  onInsertKey: (key: string, rowIndex: number, insertIndex: number) => void;
  onMoveRow: (fromIndex: number, insertBeforeIndex: number) => void;
}

/** Drives dnd-kit drag state for both palette-to-grid key insertion and row reordering. */
export function useLayoutDragAndDrop({
  rows,
  labelFor,
  onInsertKey,
  onMoveRow,
}: UseLayoutDragAndDropOptions) {
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [rowDropTarget, setRowDropTarget] = useState<number | null>(null);
  const [draggingRowIndex, setDraggingRowIndex] = useState<number | null>(null);
  const [activeDragLabel, setActiveDragLabel] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const resetDragState = () => {
    setDropTarget(null);
    setRowDropTarget(null);
    setDraggingRowIndex(null);
    setActiveDragLabel(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as ActiveDragData | undefined;
    if (isRowDragData(data)) {
      setDraggingRowIndex(data.rowIndex);
      setActiveDragLabel(`Row ${data.rowIndex + 1}`);
      return;
    }
    setActiveDragLabel(data?.key ? labelFor(data.key) : null);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { active, over } = event;
    const activeData = active.data.current as ActiveDragData | undefined;
    if (!over) {
      setDropTarget(null);
      setRowDropTarget(null);
      return;
    }
    const overData = over.data.current as OverDropData | undefined;
    if (!overData) {
      setDropTarget(null);
      setRowDropTarget(null);
      return;
    }

    if (isRowDragData(activeData)) {
      const activeRect = active.rect.current.translated;
      const overRect = over.rect;
      const pointerY = activeRect
        ? activeRect.top + activeRect.height / 2
        : overRect.top;
      const before = pointerY < overRect.top + overRect.height / 2;
      setRowDropTarget(before ? overData.rowIndex : overData.rowIndex + 1);
      setDropTarget(null);
      return;
    }

    setRowDropTarget(null);
    if (overData.isRowEnd || overData.keyIndex === undefined) {
      const row = rows[overData.rowIndex] ?? [];
      setDropTarget({ rowIndex: overData.rowIndex, index: row.length });
      return;
    }
    const activeRect = active.rect.current.translated;
    const overRect = over.rect;
    const pointerX = activeRect
      ? activeRect.left + activeRect.width / 2
      : overRect.left;
    const before = pointerX < overRect.left + overRect.width / 2;
    setDropTarget({
      rowIndex: overData.rowIndex,
      index: before ? overData.keyIndex : overData.keyIndex + 1,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const data = event.active.data.current as ActiveDragData | undefined;
    if (isRowDragData(data)) {
      if (rowDropTarget !== null) onMoveRow(data.rowIndex, rowDropTarget);
    } else if (data?.key && dropTarget) {
      onInsertKey(data.key, dropTarget.rowIndex, dropTarget.index);
    }
    resetDragState();
  };

  const handleDragCancel = () => resetDragState();

  return {
    dropTarget,
    rowDropTarget,
    draggingRowIndex,
    activeDragLabel,
    sensors,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
  };
}
