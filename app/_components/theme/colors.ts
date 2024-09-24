import { ButtonStyle } from "./styles";

export enum ButtonColor {
  BLUE = "blue",
  GRAY = "gray",
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
    case ButtonColor.GRAY: {
      return style === ButtonStyle.OUTLINE
        ? "text-black border-gray-700 hover:bg-gray-800 focus:ring-gray-300 dark:border-gray-500 dark:text-gray-500 dark:hover:bg-gray-500 dark:focus:ring-gray-800"
        : "bg-black hover:bg-gray-800 focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800";
    }
    case ButtonColor.PURPLE: {
      return style === ButtonStyle.OUTLINE
        ? "text-purple-700 border-purple-700 hover:bg-purple-800 focus:ring-purple-300 dark:border-purple-500 dark:text-purple-500 dark:hover:bg-purple-500 dark:focus:ring-purple-800"
        : "bg-purple-700 hover:bg-purple-800 focus:ring-purple-300 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-800";
    }
  }
}
