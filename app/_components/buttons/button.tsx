import { ButtonColor } from "@/_components/theme/colors";
import { ButtonStyle } from "@/_components/theme/styles";
import { MouseEventHandler } from "react";

export function Button({
  children,
  color = ButtonColor.GREY,
  style = ButtonStyle.OUTLINE,
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
  const filledColors = {
    red: {
      bg: "red-600",
      hoverBG: "red-500",
    },
    gray: {
      bg: "gray-300",
      hoverBG: "gray-200",
    },
    purple: {
      bg: "purple-500",
      hoverBG: "purple-400",
    },
  };

  const outlineColors = {
    red: {
      text: "red-700",
      ring: "red-600",
      hoverBG: "red-50",
    },
    gray: {
      text: "gray-900",
      ring: "gray-300",
      hoverBG: "gray-50",
    },
    purple: {
      text: "purple-800",
      ring: "purple-700",
      hoverBG: "purple-100",
    },
  };
  function getOutlineStyle(color: ButtonColor) {
    return `text-${outlineColors[color].text} bg-white ring-${outlineColors[color].ring} hover:bg-${outlineColors[color].hoverBG} ring-1 ring-inset`;
  }

  function getFilledStyle(color: ButtonColor) {
    return `text-white bg-${filledColors[color].bg} hover:bg-${filledColors[color].hoverBG}`;
  }

  const defaultClasses =
    "mt-3 inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm sm:mt-0 sm:w-auto";
  const styleClasses =
    style === ButtonStyle.OUTLINE
      ? getOutlineStyle(color)
      : getFilledStyle(color);

  return href ? (
    <a
      className={`${defaultClasses} ${styleClasses} ${className || ""}`}
      href={href}
    >
      {children}
    </a>
  ) : (
    <button
      type="button"
      className={`${defaultClasses} ${styleClasses} ${className || ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
