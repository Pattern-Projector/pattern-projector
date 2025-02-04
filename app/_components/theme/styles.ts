export enum ButtonStyle {
  OUTLINE = "outline",
  FILLED = "filled",
}

export function getButtonStyleClasses(style: ButtonStyle) {
  return style === ButtonStyle.OUTLINE
    ? `flex gap-2 items-center hover:text-white dark:hover:text-white border border-2 border-solid focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center`
    : `flex gap-2 items-center text-white focus:ring-4 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none`;
}

export const sideMenuStyles = `flex flex-col gap-2 p-2 w-64 items-start bg-white dark:bg-black border-b border-r border-gray-200 dark:border-gray-700`;
