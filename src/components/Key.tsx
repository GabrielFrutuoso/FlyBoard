import {
  ArrowBigUp,
  Delete,
  Space,
  CornerDownLeft,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface KeyProps {
  label: string;
  onClick: () => void;
  /** Relative width within its row. */
  units?: number;
  className?: string;
  isActive?: boolean;
  isPressed?: boolean;
}

// Sized in em so icons track the container's fluid font size.
const ICON_SIZE = "1.25em";
const keySound = new Audio(`${import.meta.env.BASE_URL}key%20sound.mp3`);

const playKeySound = () => {
  keySound.volume = 0.2;
  keySound.currentTime = 0;
  void keySound.play().catch(() => undefined);
};

const getKeyIcon = (label: string) => {
  switch (label) {
    case "Shift":
    case "SHIFT":
      return <ArrowBigUp size={ICON_SIZE} />;
    case "Backspace":
      return <Delete size={ICON_SIZE} />;
    case "Space":
      return <Space size={ICON_SIZE} />;
    case "Enter":
      return <CornerDownLeft size={ICON_SIZE} />;
    case "Tab":
      return "TAB";
    case "Up":
      return <ArrowUp size={ICON_SIZE} />;
    case "Down":
      return <ArrowDown size={ICON_SIZE} />;
    case "Left":
      return <ArrowLeft size={ICON_SIZE} />;
    case "Right":
      return <ArrowRight size={ICON_SIZE} />;
    default:
      return null;
  }
};

export const Key = ({
  label,
  onClick,
  units = 1,
  className = "",
  isActive = false,
  isPressed = false,
}: KeyProps) => {
  const icon = getKeyIcon(label);

  return (
    <Button
      variant="outline"
      size="xs"
      className={`flex h-full min-w-0 shrink basis-0 items-center justify-center overflow-hidden rounded-xs border border-zinc-800 text-zinc-200 transition-colors hover:bg-zinc-700 hover:text-zinc-100 ${className} ${
        isPressed ? "bg-zinc-700" : isActive ? "bg-zinc-700" : "bg-zinc-900"
      }`}
      style={{ flexGrow: units }}
      onMouseDown={(event) => {
        event.preventDefault();
        playKeySound();
      }}
      onClick={onClick}
      title={label}
    >
      {icon ? icon : label}
    </Button>
  );
};
