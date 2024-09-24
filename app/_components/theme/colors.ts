import { ButtonStyle } from "./styles";

export enum ButtonColor {
  BLUE = "blue",
  GREEN = "green",
  PURPLE = "purple",
}

export enum IconButtonStateClass {
  DEFAULT = "",
  ACTIVE = "!bg-purple-600 text-white dark:bg-purple-500 dark:text-white hover:bg-purple-700 focus:ring-purple-800 dark:hover:bg-purple-800 dark:focus:ring-purple-800",
  DISABLED = "text-gray-400 dark:text-gray-600 cursor-not-allowed",
}

export function getColorClasses(
  color: ButtonColor = ButtonColor.PURPLE,
  style: ButtonStyle = ButtonStyle.OUTLINE,
) {
  switch (color) {
    case ButtonColor.BLUE: {
      return style === ButtonStyle.OUTLINE
        ? "text-blue-700 border-blue-700 hover:bg-blue-800 focus:ring-blue-300 dark:border-blue-500 dark:text-blue-500 dark:hover:bg-blue-500 dark:focus:ring-blue-800"
        : "bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800";
    }
    case ButtonColor.GREEN: {
      return style === ButtonStyle.OUTLINE
        ? "text-green-700 border-green-700 hover:bg-green-800 focus:ring-green-300 dark:border-green-500 dark:text-green-500 dark:hover:bg-green-500 dark:focus:ring-green-800"
        : "bg-green-700 hover:bg-green-800 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800";
    }
    case ButtonColor.PURPLE: {
      return style === ButtonStyle.OUTLINE
        ? "text-purple-700 border-purple-700 hover:bg-purple-800 focus:ring-purple-300 dark:border-purple-500 dark:text-purple-500 dark:hover:bg-purple-500 dark:focus:ring-purple-800"
        : "bg-purple-700 hover:bg-purple-800 focus:ring-purple-300 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-800";
    }
  }
}
