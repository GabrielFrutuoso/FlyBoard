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
import { type ReactNode } from "react";

interface KeyProps {
  label: string;
  onClick: () => void;
  span?: number;
  className?: string;
  isActive?: boolean;
  isPressed?: boolean;
  isAvailable?: boolean;
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
};

const getKeyIcon = (label: string): ReactNode => KEY_ICON_MAP[label] ?? null;

const getButtonStyles = (
  isPressed: boolean,
  isActive: boolean,
  isAvailable: boolean,
): string => {
  const baseStyles =
    "flex h-full min-w-0 items-center justify-center overflow-hidden rounded-xs border border-zinc-800 text-zinc-200 transition-colors hover:bg-zinc-700 hover:text-zinc-100";
  const stateStyles = isPressed || isActive ? "bg-zinc-700" : "bg-zinc-900";
  const availabilityStyles = isAvailable
    ? ""
    : "opacity-35 hover:bg-zinc-900 hover:text-zinc-500";
  return `${baseStyles} ${stateStyles} ${availabilityStyles}`;
};

export const Key = ({
  label,
  onClick,
  span = 4,
  className = "",
  isActive = false,
  isPressed = false,
  isAvailable = true,
}: KeyProps) => {
  const icon = getKeyIcon(label);
  const buttonStyles = getButtonStyles(isPressed, isActive, isAvailable);

  return (
    <Button
      variant="outline"
      size="xs"
      className={`${buttonStyles} ${className}`}
      style={{ gridColumn: `span ${span}` }}
      onMouseDown={(event) => {
        event.preventDefault();
        audioPlayer.play();
      }}
      onClick={onClick}
      title={label}
    >
      {icon ? icon : label}
    </Button>
  );
};
