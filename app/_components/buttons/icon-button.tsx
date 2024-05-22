import { IconButtonStateClass } from "@/_components/theme/colors";
import { MouseEventHandler, PointerEventHandler } from "react";

export function IconButton({
  children,
  disabled,
  className,
  onClick,
  href,
  name,
  active,
  onPointerDown,
  onPointerUp,
  style,
  border,
}: {
  children: any;
  disabled?: boolean;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  href?: string;
  name?: string;
  active?: boolean;
  onPointerDown?: PointerEventHandler<HTMLButtonElement>;
  onPointerUp?: PointerEventHandler<HTMLButtonElement>;
  style?: React.CSSProperties;
  border?: boolean;
}) {
  // Placeholder for multiple color options in the future
  // Add other options to IconButtonColor in theme/styles.ts and
  // implement logic here
  let colorClasses = `hover:bg-gray-300 focus:ring-blue-300 dark:hover:bg-gray-700 dark:focus:ring-blue-800 ${IconButtonStateClass.DEFAULT}`;
  if (disabled) {
    colorClasses = IconButtonStateClass.DISABLED;
  } else if (active) {
    colorClasses = IconButtonStateClass.ACTIVE;
  }

  const defaultClasses =
    "bg-white dark:bg-black cursor-pointer focus:ring-4 focus:outline-none rounded-full p-2.5";

  const borderClasses =
    border && disabled
      ? "border border-2 border-gray-400 dark:border-gray-600"
      : "border border-2 border-black dark:border-white";

  return href ? (
    <a
      className={`${className || ""} ${defaultClasses} ${colorClasses} ${border && borderClasses}`}
      href={href}
    >
      {children}
    </a>
  ) : (
    <button
      type="button"
      name={name}
      className={`${defaultClasses} ${colorClasses} ${className || ""} ${border && borderClasses}`}
      onClick={onClick}
      disabled={disabled}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={style}
    >
      {children}
    </button>
  );
}
