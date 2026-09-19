import { type HTMLAttributes, type ReactNode, type Ref } from "react";
import { type KeySize } from "../utils/boardConfig";

interface KeyboardRowProps {
  row: string[];
  rowIndex: number;
  unitFor: (key: string) => number;
  keySizeFor: (rowIndex: number, keyIndex: number) => KeySize;
  renderKey: (
    key: string,
    rowIndex: number,
    keyIndex: number,
    span: number,
    size: KeySize,
  ) => ReactNode;
  className?: string;
  totalColumns?: number;
  rowProps?: HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> };
}

const rowMetrics = (
  row: string[],
  rowIndex: number,
  unitFor: (key: string) => number,
  keySizeFor: (rowIndex: number, keyIndex: number) => KeySize,
) => {
  const sizes = row.map((_, index) => keySizeFor(rowIndex, index));
  const spans = row.map((key, index) =>
    Math.max(1, Math.round(unitFor(key) * 4 * sizes[index].width)),
  );
  return {
    sizes,
    spans,
    totalColumns: Math.max(
      spans.reduce((sum, span) => sum + span, 0),
      1,
    ),
  };
};

export const KeyboardRow = ({
  row,
  rowIndex,
  unitFor,
  keySizeFor,
  renderKey,
  className = "grid w-full min-h-0 flex-1 gap-0.5",
  totalColumns,
  rowProps,
}: KeyboardRowProps) => {
  const metrics = rowMetrics(row, rowIndex, unitFor, keySizeFor);

  return (
    <div
      {...rowProps}
      className={className}
      style={{
        gridTemplateColumns: `repeat(${totalColumns ?? metrics.totalColumns}, minmax(0, 1fr))`,
      }}
    >
      {row.map((key, keyIndex) =>
        renderKey(
          key,
          rowIndex,
          keyIndex,
          metrics.spans[keyIndex],
          metrics.sizes[keyIndex],
        ),
      )}
    </div>
  );
};

interface KeyboardGridProps extends Omit<KeyboardRowProps, "row" | "rowIndex"> {
  rows: string[][];
  className?: string;
  alignRows?: boolean;
  getRowProps?: (
    rowIndex: number,
    row: string[],
  ) => HTMLAttributes<HTMLDivElement>;
  renderRow?: (
    rowIndex: number,
    row: string[],
    content: ReactNode,
  ) => ReactNode;
}

export const KeyboardGrid = ({
  rows,
  unitFor,
  keySizeFor,
  renderKey,
  renderRow,
  getRowProps,
  alignRows = false,
  className = "flex min-h-0 w-full flex-1 flex-col gap-1",
}: KeyboardGridProps) => {
  const totalColumns = alignRows
    ? Math.max(
        ...rows.map(
          (row, rowIndex) =>
            rowMetrics(row, rowIndex, unitFor, keySizeFor).totalColumns,
        ),
        1,
      )
    : undefined;

  return (
    <div className={className}>
      {rows.map((row, rowIndex) => {
        const content = (
          <KeyboardRow
            key={rowIndex}
            row={row}
            rowIndex={rowIndex}
            unitFor={unitFor}
            keySizeFor={keySizeFor}
            renderKey={renderKey}
            totalColumns={totalColumns}
            rowProps={getRowProps?.(rowIndex, row)}
          />
        );
        return renderRow ? renderRow(rowIndex, row, content) : content;
      })}
    </div>
  );
};
