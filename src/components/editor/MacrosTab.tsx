import {
  ArrowDown,
  ArrowUp,
  CirclePlus,
  Keyboard,
  Play,
  Plus,
  Sparkles,
  Trash2,
  Type,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { isModifier } from "../../keys";
import { describeStep, type BoardsFile } from "../../utils/boardConfig";
import { MACRO_ICON_OPTIONS } from "../../utils/macroIcons";
import { Button } from "../ui/button";
import { KeyPalette } from "./KeyPalette";
import { useMacroEditor } from "./hooks/useMacroEditor";

interface MacrosTabProps {
  boards: BoardsFile;
  onChange: (boards: BoardsFile) => void;
}

const smallIconButton =
  "editor-icon-button cursor-pointer";

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
    <div className="flex min-h-0 flex-1 bg-black/10">
      <aside className="flex w-56 shrink-0 flex-col border-r border-white/7 bg-zinc-950/35 p-3">
        <div className="mb-3">
          <p className="editor-eyebrow">Automation</p>
          <h2 className="mt-1 text-sm font-semibold text-zinc-100">
            Your macros
          </h2>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
            Chain shortcuts and text into one key.
          </p>
        </div>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
          {boards.macros.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 px-3 py-5 text-center">
              <WandSparkles className="mx-auto text-zinc-600" size={20} />
              <p className="mt-2 text-[11px] text-zinc-400">No macros yet</p>
              <p className="mt-1 text-[9px] leading-relaxed text-zinc-600">
                Create your first action below.
              </p>
            </div>
          )}
          {boards.macros.map((macro) => (
            <button
              key={macro.id}
              type="button"
              onClick={() => selectMacro(macro.id)}
              className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl border px-2.5 py-2.5 text-left transition ${
                selected?.id === macro.id
                  ? "border-amber-300/20 bg-amber-300/10 text-zinc-100"
                  : "border-transparent text-zinc-400 hover:border-white/6 hover:bg-white/4 hover:text-zinc-200"
              }`}
            >
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                  selected?.id === macro.id
                    ? "bg-amber-300 text-zinc-950"
                    : "bg-zinc-800/80 text-zinc-500"
                }`}
              >
                <Zap size={14} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">
                  {macro.name}
                </span>
                <span className="mt-0.5 block text-[9px] text-zinc-500">
                  {macro.steps.length}{" "}
                  {macro.steps.length === 1 ? "step" : "steps"}
                </span>
              </span>
            </button>
          ))}
        </div>
        <div className="mt-3 rounded-xl border border-white/7 bg-black/15 p-3">
          <label className="text-[10px] font-medium text-zinc-300">
            New macro
          </label>
          <div className="mt-2 flex gap-1.5">
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") addMacro();
              }}
              placeholder="e.g. Paste email"
              className="editor-input min-w-0"
            />
            <Button
              type="button"
              size="icon"
              onClick={addMacro}
              className="size-8 cursor-pointer rounded-lg bg-amber-300 text-zinc-950 hover:bg-amber-200"
              title="Create macro"
              aria-label="Create macro"
            >
              <Plus size={14} />
            </Button>
          </div>
        </div>
      </aside>

      {!selected ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-sm text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-200 ring-1 ring-amber-300/15">
              <Sparkles size={24} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-zinc-100">
              Turn repetitive actions into one key
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              Create a macro, add shortcuts or text in the order they should
              run, then place it on any layout.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center gap-3 border-b border-white/7 px-5 py-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-300 text-zinc-950">
              <Zap size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <input
                value={selected.name}
                onChange={(event) =>
                  updateMacro((macro) => ({
                    ...macro,
                    name: event.target.value,
                  }))
                }
                className="editor-title-input max-w-80"
                aria-label="Macro name"
              />
              <p className="mt-0.5 text-[9px] text-zinc-500">
                Runs from top to bottom
              </p>
            </div>
            {testError && (
              <span
                className="max-w-56 truncate text-[10px] text-red-300"
                title={testError}
              >
                {testError}
              </span>
            )}
            <div
              className="flex items-center gap-0.5 rounded-lg border border-white/7 bg-black/15 p-1"
              aria-label="Macro icon"
            >
              <button
                type="button"
                onClick={() =>
                  updateMacro((macro) => ({ ...macro, icon: undefined }))
                }
                className={`${smallIconButton} ${
                  selected.icon ? "" : "bg-white/10 text-zinc-100"
                }`}
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
                  className={`${smallIconButton} ${
                    selected.icon === id ? "bg-white/10 text-zinc-100" : ""
                  }`}
                  title={label}
                  aria-label={label}
                >
                  <Icon size={12} />
                </button>
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={testMacro}
              disabled={selected.steps.length === 0}
              className="h-8 cursor-pointer gap-1.5 rounded-lg border-white/7 bg-white/6 text-zinc-200"
              title="Run the steps once, in order"
            >
              <Play size={13} /> Test
            </Button>
            <button
              type="button"
              onClick={deleteMacro}
              className={`${smallIconButton} hover:bg-red-500/15 hover:text-red-300`}
              title="Delete macro (also removes it from all layouts)"
              aria-label="Delete macro"
            >
              <Trash2 size={13} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <section className="mx-auto max-w-5xl">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="editor-eyebrow">Sequence</p>
                  <h3 className="mt-1 text-sm font-semibold text-zinc-100">
                    What should happen?
                  </h3>
                </div>
                <span className="rounded-full border border-white/7 bg-white/3 px-2.5 py-1 text-[9px] text-zinc-500">
                  {selected.steps.length}{" "}
                  {selected.steps.length === 1 ? "action" : "actions"}
                </span>
              </div>

              {selected.steps.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-6 py-8 text-center">
                  <CirclePlus className="mx-auto text-zinc-600" size={24} />
                  <p className="mt-3 text-xs font-medium text-zinc-300">
                    Your sequence is empty
                  </p>
                  <p className="mt-1 text-[10px] text-zinc-500">
                    Add a keyboard shortcut or typed text from the builder
                    below.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selected.steps.map((step, index) => (
                    <div
                      key={index}
                      className="group flex items-center gap-3 rounded-xl border border-white/7 bg-zinc-900/55 p-2.5"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[10px] font-semibold text-zinc-500">
                        {index + 1}
                      </span>
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                          step.type === "keys"
                            ? "bg-sky-300/10 text-sky-300"
                            : "bg-violet-300/10 text-violet-300"
                        }`}
                      >
                        {step.type === "keys" ? (
                          <Keyboard size={15} />
                        ) : (
                          <Type size={15} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] uppercase tracking-wider text-zinc-600">
                          {step.type === "keys"
                            ? "Keyboard shortcut"
                            : "Type text"}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-zinc-200">
                          {describeStep(step)}
                        </p>
                      </div>
                      <div className="flex items-center opacity-70 transition group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => moveStep(index, -1)}
                          disabled={index === 0}
                          className={`${smallIconButton} disabled:opacity-30`}
                          title="Move up"
                          aria-label="Move step up"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStep(index, 1)}
                          disabled={index === selected.steps.length - 1}
                          className={`${smallIconButton} disabled:opacity-30`}
                          title="Move down"
                          aria-label="Move step down"
                        >
                          <ArrowDown size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeStep(index)}
                          className={`${smallIconButton} hover:bg-red-500/15 hover:text-red-300`}
                          title="Remove step"
                          aria-label="Remove step"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="h-[43%] min-h-64 shrink-0 border-t border-white/7 bg-zinc-950/40 p-4">
            <div className="mx-auto flex h-full max-w-5xl flex-col gap-3">
              <div className="grid shrink-0 gap-3 lg:grid-cols-[1.2fr_1fr]">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Keyboard size={13} className="text-sky-300" />
                    <span className="text-[10px] font-semibold text-zinc-300">
                      Build a shortcut
                    </span>
                    <span className="text-[9px] text-zinc-600">
                      Pick modifiers, then one final key
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex min-h-9 min-w-0 flex-1 flex-wrap items-center gap-1.5 rounded-lg border border-white/8 bg-black/20 px-2.5 py-1.5">
                      {combo.length === 0 ? (
                        <span className="text-[10px] text-zinc-600">
                          Choose keys below…
                        </span>
                      ) : (
                        combo.map((key, index) => (
                          <span
                            key={`${key}-${index}`}
                            className={`rounded-md px-2 py-1 text-[10px] font-medium ${
                              isModifier(key)
                                ? "bg-white/8 text-zinc-200"
                                : "bg-sky-300 text-zinc-950"
                            }`}
                          >
                            {key}
                          </span>
                        ))
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={clearCombo}
                      className={smallIconButton}
                      title="Clear shortcut"
                      aria-label="Clear shortcut"
                    >
                      <Trash2 size={12} />
                    </button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!comboReady}
                      onClick={addKeysStep}
                      className="h-9 cursor-pointer rounded-lg bg-sky-300 px-3 text-zinc-950 hover:bg-sky-200"
                    >
                      Add shortcut
                    </Button>
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Type size={13} className="text-violet-300" />
                    <span className="text-[10px] font-semibold text-zinc-300">
                      Type something
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && text) addTextStep();
                      }}
                      placeholder="user@example.com"
                      className="editor-input min-w-0 flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={!text}
                      onClick={addTextStep}
                      className="h-9 cursor-pointer rounded-lg bg-violet-300 px-3 text-zinc-950 hover:bg-violet-200"
                    >
                      Add text
                    </Button>
                  </div>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden">
                <KeyPalette onPick={pickKey} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MacrosTab;
