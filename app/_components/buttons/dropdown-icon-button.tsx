import React, { useState, useRef } from "react";
import { IconButton } from "@/_components/buttons/icon-button";
import Tooltip from "@/_components/tooltip/tooltip";
import { visible } from "@/_components/theme/css-functions";
import CheckIcon from "@/_icons/check-icon";
import useOnClickOutside from "@/_hooks/use-on-click-outside";

export function DropdownIconButton<T>({
  icon,
  selection,
  setSelection,
  description,
  options,
  className,
  dropdownClassName,
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
      <Tooltip description={description} disabled={isOpen}>
        <IconButton
          onClick={handleClick}
          aria-haspopup="true"
          aria-expanded={isOpen}
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
