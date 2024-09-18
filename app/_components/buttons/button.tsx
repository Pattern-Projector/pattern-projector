import { ButtonColor, getColorClasses } from "@/_components/theme/colors";
import { ButtonStyle, getButtonStyleClasses } from "@/_components/theme/styles";
import Link from "next/link";
import { MouseEventHandler } from "react";

export function Button({
  children,
  style = ButtonStyle.OUTLINE,
  color = ButtonColor.PURPLE,
  className,
  onClick,
  href,
}: {
  children: any;
  color?: ButtonColor;
  style?: ButtonStyle;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  href?: string;
}) {
  const classes = `flex gap-2 items-center ${getButtonStyleClasses(style)} ${getColorClasses(color, style)} ${className || ""}`;

  return href ? (
    <Link className={classes} href={href}>
      {children}
    </Link>
  ) : (
    <button type="button" className={classes} onClick={onClick}>
      {children}
    </button>
  );
}
