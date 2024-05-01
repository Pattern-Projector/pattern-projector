import { ChangeEvent } from "react";
import InlineInput from "./inline-input";
import { useTranslations } from "next-intl";
import { IconButton } from "./buttons/icon-button";
import CloseIcon from "@/_icons/close-icon";

export default function MoreToolsMenu({
  className,
  setShowMenu,
  scale,
  handleScaleChange,
}: {
  className?: string;
  setShowMenu: (showMenu: boolean) => void;
  scale: number;
  handleScaleChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  const t = useTranslations("MoreToolsMenu");

  return (
    <menu
      className={`${className} flex justify-between absolute left-0 w-full z-30 transition-all duration-700 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-700 p-2`}
    >
      <InlineInput
        className="relative flex flex-col"
        inputClassName="w-28"
        handleChange={handleScaleChange}
        id="scale"
        label={t("scale")}
        name="scale"
        value={(scale * 100).toFixed(0)}
        labelRight={"%"}
        type="number"
        min="0"
      />

      <IconButton onClick={() => setShowMenu(false)}>
        <CloseIcon ariaLabel="close" />
      </IconButton>
    </menu>
  );
}
