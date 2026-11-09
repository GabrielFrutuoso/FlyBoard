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
    keyGap: number,
  ) => ReactNode;
  className?: string;
  keyGap?: number;
  totalColumns?: number;
  preserveProportions?: boolean;
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
  keyGap = 2,
  totalColumns,
  preserveProportions = false,
  rowProps,
}: KeyboardRowProps) => {
  const metrics = rowMetrics(row, rowIndex, unitFor, keySizeFor);
  const gridColumns = preserveProportions
    ? metrics.totalColumns
    : (totalColumns ?? metrics.totalColumns);

  return (
    <div
      {...rowProps}
      className={className}
      style={{
        width:
          preserveProportions && totalColumns
            ? `${(metrics.totalColumns / totalColumns) * 100}%`
            : "100%",
        marginInline: preserveProportions ? "auto" : undefined,
        gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
        columnGap: 0,
        rowGap: 0,
      }}
    >
      {row.map((key, keyIndex) =>
        renderKey(
          key,
          rowIndex,
          keyIndex,
          metrics.spans[keyIndex],
          metrics.sizes[keyIndex],
          keyGap,
        ),
      )}
    </div>
  );
};

interface KeyboardGridProps extends Omit<
  KeyboardRowProps,
  "row" | "rowIndex" | "totalColumns" | "preserveProportions"
> {
  rows: string[][];
  className?: string;
  preserveProportions?: boolean;
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
  keyGap = 2,
  preserveProportions = false,
  className = "flex min-h-0 w-full flex-1 flex-col gap-1",
}: KeyboardGridProps) => {
  const totalColumns = preserveProportions
    ? Math.max(
        ...rows.map(
          (row, rowIndex) =>
            rowMetrics(row, rowIndex, unitFor, keySizeFor).totalColumns,
        ),
        1,
      )
    : undefined;

  return (
    <div className={className} style={{ gap: `${keyGap}px` }}>
      {rows.map((row, rowIndex) => {
        const content = (
          <KeyboardRow
            key={rowIndex}
            row={row}
            rowIndex={rowIndex}
            unitFor={unitFor}
            keySizeFor={keySizeFor}
            renderKey={renderKey}
            keyGap={keyGap}
            totalColumns={totalColumns}
            preserveProportions={preserveProportions}
            rowProps={getRowProps?.(rowIndex, row)}
          />
        );
        return renderRow ? renderRow(rowIndex, row, content) : content;
      })}
    </div>
  );
};
