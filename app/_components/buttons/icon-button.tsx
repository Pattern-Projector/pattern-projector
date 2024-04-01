import { IconButtonStateClass } from "@/_components/theme/colors";
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
  let colorClasses = `hover:bg-gray-300 focus:ring-blue-300 dark:hover:bg-gray-700 dark:focus:ring-blue-800 ${IconButtonStateClass.DEFAULT}`;
  if (disabled) {
    colorClasses = IconButtonStateClass.DISABLED;
  } else if (active) {
    colorClasses = IconButtonStateClass.ACTIVE;
  }

  const defaultClasses =
    "transition-all duration-100 bg-white dark:bg-black cursor-pointer focus:ring-4 focus:outline-none rounded-full p-2.5";

  return href ? (
    <a
      className={`${className || ""} ${defaultClasses} ${colorClasses}`}
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
