import { ArrowDown, ArrowUp, Play, Plus, Trash2, X } from "lucide-react";
import { isModifier } from "../../keys";
import { describeStep, type BoardsFile } from "../../utils/boardConfig";
import { Button } from "../ui/button";
import { KeyPalette } from "./KeyPalette";
import { MACRO_ICON_OPTIONS } from "../../utils/macroIcons";
import { useMacroEditor } from "./hooks/useMacroEditor";

interface MacrosTabProps {
  boards: BoardsFile;
  onChange: (boards: BoardsFile) => void;
}

const smallIconButton =
  "cursor-pointer rounded-sm p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100";

const MacrosTab = ({ boards, onChange }: MacrosTabProps) => {
  const {
    selected,
    combo,
    comboReady,
    text,
    setText,
    newName,
    setNewName,
    testError,
    selectMacro,
    addMacro,
    deleteMacro,
    pickKey,
    clearCombo,
    addKeysStep,
    addTextStep,
    moveStep,
    removeStep,
    testMacro,
    updateMacro,
  } = useMacroEditor(boards, onChange);

  return (
    <div className="flex min-h-0 flex-1">
      <aside className="flex w-44 shrink-0 flex-col gap-1 border-r border-zinc-800 p-2">
        <h2 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Macros
        </h2>
        <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
          {boards.macros.length === 0 && (
            <p className="px-1 text-[11px] text-zinc-600">No macros yet.</p>
          )}
          {boards.macros.map((macro) => (
            <button
              key={macro.id}
              type="button"
              onClick={() => selectMacro(macro.id)}
              className={`cursor-pointer rounded-sm px-2 py-1 text-left text-xs ${
                selected?.id === macro.id
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              {macro.name}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-1 border-t border-zinc-800 pt-2">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="New macro name"
            className="rounded-sm border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-sky-600"
          />
          <Button
            type="button"
            size="sm"
            onClick={addMacro}
            className="h-auto cursor-pointer gap-1 px-2 py-1 text-xs"
          >
            <Plus size={12} /> Create
          </Button>
        </div>
      </aside>

      {!selected ? (
        <div className="flex flex-1 items-center justify-center p-4">
          <p className="text-xs text-zinc-500">
            Create a macro on the left, then place it on a layout from the
            Layouts tab.
          </p>
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 flex-col gap-2 border-b border-zinc-800 p-2">
            <div className="flex min-w-0 items-center gap-2">
              <input
                value={selected.name}
                onChange={(event) =>
                  updateMacro((macro) => ({
                    ...macro,
                    name: event.target.value,
                  }))
                }
                className="min-w-0 flex-1 rounded-sm border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-sky-600"
                aria-label="Macro name"
              />
              <button
                type="button"
                onClick={deleteMacro}
                className={`${smallIconButton} shrink-0 hover:bg-red-900 hover:text-red-100`}
                title="Delete macro (also removes it from all layouts)"
                aria-label="Delete macro"
              >
                <Trash2 size={12} />
              </button>
              <div className="ml-auto flex shrink-0 items-center gap-2">
                {testError && (
                  <span
                    className="max-w-56 truncate text-[10px] text-red-400"
                    title={testError}
                  >
                    {testError}
                  </span>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={testMacro}
                  disabled={selected.steps.length === 0}
                  className="h-auto cursor-pointer gap-1 px-2 py-1 text-xs text-zinc-300 disabled:opacity-40"
                  title="Run the steps once, in order"
                >
                  <Play size={12} /> Test macro
                </Button>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Key icon
              </span>
              <div
                className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto"
                aria-label="Macro icon"
              >
                <button
                  type="button"
                  onClick={() =>
                    updateMacro((macro) => ({ ...macro, icon: undefined }))
                  }
                  className={`${smallIconButton} shrink-0 ${selected.icon ? "" : "bg-zinc-700 text-zinc-100"}`}
                  title="No icon"
                  aria-label="No icon"
                >
                  <X size={12} />
                </button>
                {MACRO_ICON_OPTIONS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      updateMacro((macro) => ({ ...macro, icon: id }))
                    }
                    className={`${smallIconButton} shrink-0 ${selected.icon === id ? "bg-zinc-700 text-zinc-100" : ""}`}
                    title={label}
                    aria-label={label}
                  >
                    <Icon size={12} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
            {selected.steps.length === 0 && (
              <p className="p-1 text-[11px] text-zinc-500">
                No steps yet. Build a key combo below, or add a text step.
              </p>
            )}
            {selected.steps.map((step, index) => (
              <div
                key={index}
                className="flex items-center gap-1 rounded-sm border border-zinc-800 bg-zinc-900 px-2 py-1"
              >
                <span className="w-5 text-[10px] text-zinc-500">
                  {index + 1}.
                </span>
                <span className="rounded-sm bg-zinc-800 px-1.5 py-0.5 text-[10px] uppercase text-zinc-400">
                  {step.type === "keys" ? "Keys" : "Text"}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-zinc-200">
                  {describeStep(step)}
                </span>
                <button
                  type="button"
                  onClick={() => moveStep(index, -1)}
                  className={smallIconButton}
                  title="Move up"
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => moveStep(index, 1)}
                  className={smallIconButton}
                  title="Move down"
                >
                  <ArrowDown size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className={`${smallIconButton} hover:bg-red-900 hover:text-red-100`}
                  title="Remove step"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          <div className="h-56 shrink-0 overflow-y-auto border-t border-zinc-800 p-2">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Combo
              </span>
              <div className="flex min-h-7 min-w-0 flex-1 flex-wrap items-center gap-1 rounded-sm border border-zinc-700 bg-zinc-900 px-2 py-1">
                {combo.length === 0 ? (
                  <span className="text-[11px] text-zinc-600">
                    Click keys below — modifiers first, final key last
                  </span>
                ) : (
                  combo.map((key, i) => (
                    <span
                      key={i}
                      className={`rounded-sm px-1.5 py-0.5 text-xs ${
                        isModifier(key)
                          ? "bg-zinc-700 text-zinc-100"
                          : "bg-sky-800 text-sky-100"
                      }`}
                    >
                      {key}
                    </span>
                  ))
                )}
              </div>
              <Button
                type="button"
                size="sm"
                disabled={!comboReady}
                onClick={addKeysStep}
                className="h-auto cursor-pointer px-2 py-1 text-xs disabled:opacity-40"
                title="Add the combo as a step"
              >
                Add step
              </Button>
              <button
                type="button"
                onClick={clearCombo}
                className={smallIconButton}
                title="Clear combo"
              >
                <Trash2 size={12} />
              </button>
            </div>
            <KeyPalette onPick={pickKey} />
            <div className="mt-2 flex items-center gap-2 border-t border-zinc-800 pt-2">
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder='Text step, e.g. "user@example.com"'
                className="min-w-0 flex-1 rounded-sm border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-sky-600"
              />
              <Button
                type="button"
                size="sm"
                disabled={!text}
                onClick={addTextStep}
                className="h-auto cursor-pointer px-2 py-1 text-xs disabled:opacity-40"
              >
                Add text step
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MacrosTab;
