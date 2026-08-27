import {
  ArrowBigUp,
  Delete,
  Space,
  CornerDownLeft,
  ArrowRightToLine,
} from "lucide-react";

interface KeyProps {
  label: string;
  onClick: () => void;
  className?: string;
  isActive?: boolean;
}

const getKeyIcon = (label: string) => {
  switch (label) {
    case "Shift":
    case "SHIFT":
      return <ArrowBigUp size={18} />;
    case "Backspace":
      return <Delete size={18} />;
    case "Space":
      return <Space size={18} />;
    case "Enter":
      return <CornerDownLeft size={18} />;
    case "Tab":
      return <ArrowRightToLine size={18} />;
    default:
      return null;
  }
};

export const Key = ({
  label,
  onClick,
  className = "",
  isActive = false,
}: KeyProps) => {
  const icon = getKeyIcon(label);

  return (
    <button
      className={`flex items-center justify-center text-white transition-colors rounded-md border border-zinc-800 ${className} ${
        isActive ? "bg-zinc-700" : ""
      }`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {icon ? icon : label}
    </button>
  );
};
