import React, { useRef, useState } from "react";
import { IconButton } from "@/_components/buttons/icon-button";
import Tooltip from "@/_components/tooltip/tooltip";
import { visible } from "@/_components/theme/css-functions";
import CheckIcon from "@/_icons/check-icon";
import useOnClickOutside from "@/_hooks/use-on-click-outside";
import { LoadStatusEnum } from "@/_lib/load-status-enum";
import LoadingSpinner from "@/_icons/loading-spinner";

export function DropdownIconButton<T>({
  icon,
  selection,
  setSelection,
  description,
  options,
  className,
  dropdownClassName,
  loadStatus,
}: {
  icon: React.ReactNode;
  selection: T;
  setSelection: (value: T) => void;
  description: string;
  options: {
    text: string;
    value: T;
  }[];
  className?: string;
  dropdownClassName?: string;
  loadStatus?: LoadStatusEnum;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (value: T) => {
    setSelection(value);
    setIsOpen(false);
  };

  const dropdownClasses =
    "absolute mt-2 bg-white dark:bg-gray-800 rounded-md shadow-lg";

  useOnClickOutside(containerRef, () => setIsOpen(false));

  return (
    <div
      className={`relative inline-block ${className || ""}`}
      ref={containerRef}
    >
      {loadStatus === LoadStatusEnum.LOADING ? (
        <LoadingSpinner className="absolute top-3.5 m-auto left-0 right-0 h-4 w-4 z-10" />
      ) : null}
      <Tooltip
        description={description}
        disabled={isOpen || loadStatus === LoadStatusEnum.LOADING}
      >
        <IconButton
          onClick={handleClick}
          aria-haspopup="true"
          aria-expanded={isOpen}
          className={
            loadStatus === LoadStatusEnum.LOADING ? "text-gray-700" : ""
          }
        >
          {icon}
        </IconButton>
      </Tooltip>
      <div
        className={`${dropdownClassName} ${dropdownClasses} ${visible(isOpen)}`}
        tabIndex={-1}
        role="menu"
      >
        {options.map((option, index) => (
          <button
            disabled={loadStatus === LoadStatusEnum.LOADING}
            key={String(option.value)}
            id={`option-${index}`}
            className={`grid grid-cols-[20px_1fr] gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 rounded-md`}
            onClick={() => handleOptionClick(option.value)}
            role="menuitem"
            tabIndex={0}
          >
            <span>
              {selection == option.value && <CheckIcon ariaLabel="Selected" />}
            </span>
            <span>{option.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
