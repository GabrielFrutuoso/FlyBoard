import {
  ArrowBigUp,
  Delete,
  Space,
  CornerDownLeft,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  ChevronsUp,
  ChevronsDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { type MouseEvent, type ReactNode, useEffect, useRef } from "react";
import { getMacroIcon, type MacroIconId } from "../utils/macroIcons";
import {
  DEFAULT_KEY_LABEL_SIZE,
  DEFAULT_KEY_RADIUS,
  MAX_KEY_GAP,
  type KeySize,
  type LayoutAppearance,
} from "../utils/boardConfig";
import { surfaceStyle } from "../utils/boardConfig";

interface KeyProps {
  label: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  onRepeat?: () => void;
  repeatable?: boolean;
  onContextMenu?: (event: MouseEvent<HTMLButtonElement>) => void;
  span?: number;
  className?: string;
  isActive?: boolean;
  isPressed?: boolean;
  isAvailable?: boolean;
  appearance?: LayoutAppearance;
  transparency?: number;
  macroIcon?: MacroIconId;
  macroName?: string;
  size?: KeySize;
  labelColor?: string;
  borderColor?: string;
  borderTransparency?: number;
  backgroundColor?: string;
  keyRadius?: number;
  keyGap?: number;
  keyLabelSize?: number;
}

const ICON_SIZE = "1.25em";

const createAudioPlayer = () => {
  const audio = new Audio(`${import.meta.env.BASE_URL}key%20sound.mp3`);
  audio.volume = 0.2;
  return {
    play: () => {
      audio.currentTime = 0;
      void audio.play().catch(() => undefined);
    },
  };
};

const audioPlayer = createAudioPlayer();

const KEY_ICON_MAP: Record<string, ReactNode> = {
  Shift: <ArrowBigUp size={ICON_SIZE} />,
  SHIFT: <ArrowBigUp size={ICON_SIZE} />,
  Backspace: <Delete size={ICON_SIZE} />,
  Space: <Space size={ICON_SIZE} />,
  Enter: <CornerDownLeft size={ICON_SIZE} />,
  Tab: <ArrowRight size={ICON_SIZE} />,
  Up: <ArrowUp size={ICON_SIZE} />,
  Down: <ArrowDown size={ICON_SIZE} />,
  Left: <ArrowLeft size={ICON_SIZE} />,
  Right: <ArrowRight size={ICON_SIZE} />,
  PageUp: <ChevronsUp size={ICON_SIZE} />,
  PageDown: <ChevronsDown size={ICON_SIZE} />,
  Insert: "Ins",
  Delete: <Delete size={ICON_SIZE} />,
  Home: "Home",
  End: "End",
};

const getKeyIcon = (label: string): ReactNode => KEY_ICON_MAP[label] ?? null;

const getButtonStyles = (
  isPressed: boolean,
  isActive: boolean,
  isAvailable: boolean,
  appearance: LayoutAppearance,
  pressed: boolean,
): string => {
  const baseStyles =
    "relative isolate flex h-full min-w-0 items-center justify-center overflow-hidden rounded-xs border border-zinc-800 text-zinc-200 transition-[color,background-color,filter,box-shadow] hover:text-zinc-100";
  const stateStyles =
    appearance === "solid"
      ? isPressed || isActive
        ? "bg-zinc-700 hover:bg-zinc-700"
        : "bg-zinc-900 hover:bg-zinc-700"
      : pressed
        ? "brightness-125"
        : "";
  const availabilityStyles = isAvailable
    ? ""
    : `opacity-35 ${appearance === "solid" ? "hover:bg-zinc-900 hover:text-zinc-500" : ""}`;
  return `${baseStyles} ${stateStyles} ${availabilityStyles}`;
};

export const Key = ({
  label,
  onClick,
  onRepeat,
  repeatable = false,
  onContextMenu,
  span = 4,
  className = "",
  isActive = false,
  isPressed = false,
  isAvailable = true,
  appearance = "solid",
  transparency,
  macroIcon,
  macroName,
  size = { width: 1, height: 1 },
  labelColor,
  borderColor,
  borderTransparency = 0,
  backgroundColor,
  keyRadius = DEFAULT_KEY_RADIUS,
  keyGap = 2,
  keyLabelSize = DEFAULT_KEY_LABEL_SIZE,
}: KeyProps) => {
  const repeatDelay = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const suppressPointerClick = useRef(false);

  const clearRepeat = () => {
    if (repeatDelay.current !== null) clearTimeout(repeatDelay.current);
    if (repeatInterval.current !== null) clearInterval(repeatInterval.current);
    repeatDelay.current = null;
    repeatInterval.current = null;
  };

  useEffect(() => clearRepeat, []);

  const keyGapSize = Math.min(MAX_KEY_GAP, Math.max(0, keyGap));
  const MacroIcon = getMacroIcon(macroIcon);
  const icon = MacroIcon ? <MacroIcon size={ICON_SIZE} /> : getKeyIcon(label);
  const buttonStyles = getButtonStyles(
    isPressed,
    isActive,
    isAvailable,
    appearance,
    isPressed || isActive,
  );
  const customSurface =
    appearance !== "solid" ||
    backgroundColor !== undefined ||
    transparency !== undefined;
  const appearanceStyle = customSurface
    ? surfaceStyle({ appearance, backgroundColor, transparency }, "#18181b")
    : {};
  const surfaceBorderColor =
    appearance === "transparent" ? "rgb(255 255 255 / 16%)" : undefined;
  const normalizedBorderTransparency = Math.min(
    100,
    Math.max(0, borderTransparency),
  );
  const baseBorderColor = borderColor ?? surfaceBorderColor ?? "#27272a";
  const resolvedBorderColor =
    normalizedBorderTransparency > 0
      ? `color-mix(in srgb, ${baseBorderColor} ${100 - normalizedBorderTransparency}%, transparent)`
      : (borderColor ?? surfaceBorderColor);
  const activeCustomColorStyles =
    backgroundColor && isActive ? "brightness-125" : "";
  const showHoverHighlight =
    isAvailable && (appearance !== "solid" || backgroundColor !== undefined);

  return (
    <Button
      variant="outline"
      size="xs"
      className={`${buttonStyles} ${activeCustomColorStyles} ${className}`}
      style={{
        gridColumn: `span ${span}`,
        justifySelf: "center",
        width: `calc(100% - ${keyGapSize}px)`,
        height: `${size.height * 100}%`,
        marginInline: "auto",
        borderRadius: `${keyRadius}px`,
        fontSize: `${keyLabelSize}px`,
        ...appearanceStyle,
        borderColor: resolvedBorderColor,
        ...(labelColor ? { color: labelColor } : {}),
      }}
      onMouseDown={(event) => {
        event.preventDefault();
        audioPlayer.play();
      }}
      onPointerDown={(event) => {
        if (!repeatable || !onRepeat || event.button !== 0 || !event.isPrimary)
          return;

        clearRepeat();
        suppressPointerClick.current = true;
        onRepeat();
        event.currentTarget.setPointerCapture(event.pointerId);
        repeatDelay.current = setTimeout(() => {
          repeatInterval.current = setInterval(onRepeat, 50);
        }, 500);
      }}
      onPointerUp={clearRepeat}
      onPointerCancel={() => {
        clearRepeat();
        suppressPointerClick.current = false;
      }}
      onLostPointerCapture={clearRepeat}
      onContextMenu={onContextMenu}
      onClick={(event) => {
        if (event.detail > 0 && suppressPointerClick.current) {
          suppressPointerClick.current = false;
          return;
        }
        onClick(event);
      }}
      title={macroName ?? label}
      aria-label={macroName ?? label}
    >
      {showHoverHighlight && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-white/10 transition-opacity ${
            isActive
              ? "opacity-100"
              : "opacity-0 group-hover/button:opacity-100"
          }`}
        />
      )}
      <span className="relative z-10">{icon ?? label}</span>
    </Button>
  );
};
