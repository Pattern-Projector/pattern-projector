enum ButtonColor {
  GREY = "gray",
  RED = "red",
  PURPLE = "purple",
}

enum IconButtonStateClass {
  DEFAULT = "",
  ACTIVE = "!bg-purple-600 text-white dark:bg-purple-500 dark:text-white hover:bg-purple-700 focus:ring-purple-800 dark:hover:bg-purple-800 dark:focus:ring-purple-800",
  DISABLED = "text-gray-400 dark:text-gray-600 cursor-not-allowed",
}

enum CornerColorHex {
  TOPLEFT = "#9333ea",
  TOPRIGHT = "#3b82f6",
  BOTTOMRIGHT = "#65a30d",
  BOTTOMLEFT = "#c2410c",
}

export { ButtonColor, CornerColorHex, IconButtonStateClass };
