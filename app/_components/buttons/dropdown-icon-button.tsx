import React, { useState, useRef, useEffect } from "react";
import { IconButton } from "@/_components/buttons/icon-button";
import Tooltip from "@/_components/tooltip/tooltip";
import { visible } from "@/_components/theme/css-functions";

export function DropdownIconButton<T>({
  selection,
  setSelection,
  description,
  options,
  className,
}: {
  selection: T;
  setSelection: (value: T) => void;
  description: string;
  options: {
    icon: React.ReactNode;
    text: string;
    value: T;
  }[];
  className?: string;
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

  const selectedOption = options.find((option) => option.value === selection);

  const dropdownClasses =
    "absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [containerRef]);

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
          {selectedOption?.icon}
        </IconButton>
      </Tooltip>
      <div
        className={`${dropdownClasses} ${visible(isOpen)}`}
        tabIndex={-1}
        role="menu"
      >
        {options.map((option, index) => (
          <button
            key={String(option.value)}
            id={`option-${index}`}
            className={`flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 rounded-md`}
            onClick={() => handleOptionClick(option.value)}
            role="menuitem"
            tabIndex={0}
          >
            <span className="mr-2">{option.icon}</span>
            <span>{option.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
