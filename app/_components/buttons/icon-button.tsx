import { ButtonColor, IconButtonStateClass } from "@/_components/theme/colors";
import { ButtonStyle } from "@/_components/theme/styles";
import { MouseEventHandler } from "react";

export function IconButton({
  children,
  color = IconButtonStateClass.DEFAULT,
  disabled,
  className,
  onClick,
  href,
  name,
  active,
}: {
  children: any;
  color?: IconButtonStateClass;
  disabled?: boolean;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  href?: string;
  name?: string;
  active?: boolean;
}) {
  // Placeholder for multiple color options in the future
  // Add other options to IconButtonColor in theme/styles.ts and
  // implement logic here
  let colorClasses = `hover:bg-gray-300 focus:ring-blue-300 ${IconButtonStateClass.DEFAULT}`;
  if (disabled) {
    colorClasses = IconButtonStateClass.DISABLED;
  } else if (active) {
    colorClasses = IconButtonStateClass.ACTIVE;
  }

  const defaultClasses =
    "bg-white cursor-pointer focus:ring-4 focus:outline-none rounded-full";

  return href ? (
    <a
      className={`${defaultClasses} ${colorClasses} ${className || ""}`}
      href={href}
    >
      {children}
    </a>
  ) : (
    <button
      type="button"
      name={name}
      className={`${defaultClasses} ${colorClasses} ${className || ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
