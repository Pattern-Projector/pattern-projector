import React, { useState, useRef } from "react";
import { IconButton } from "@/_components/buttons/icon-button";
import Tooltip from "@/_components/tooltip/tooltip";
import { visible } from "@/_components/theme/css-functions";
import useOnClickOutside from "@/_hooks/use-on-click-outside";

type BooleanOption = {
  icon: React.ReactNode;
  text: string;
};

type NumberOption = {
  icon?: React.ReactNode;
  text: string;
  min: number;
  max: number;
};

type OptionSettings<T> = {
  [K in keyof T]?: T[K] extends boolean ? BooleanOption : NumberOption;
};

export function DropdownCheckboxIconButton<T>({
  description,
  icon,
  disabledIcon,
  disableOptionKey,
  options,
  optionSettings,
  setSelectedOptions,
  className,
}: {
  description: string;
  icon: React.ReactNode;
  disabledIcon: React.ReactNode;
  disableOptionKey: keyof T;
  options: T;
  optionSettings: OptionSettings<T>;
  setSelectedOptions: (options: T) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const dropdownClasses =
    "absolute left-0 mt-2 min-w-max bg-white dark:bg-gray-800 rounded-md shadow-lg z-10";

  useOnClickOutside(containerRef, () => setIsOpen(false));

  const updateOption = (key: keyof T, value: boolean): void => {
    const updatedOptions = {
      ...options,
      [key]: value,
    };

    setSelectedOptions(updatedOptions);
  };

  const disabled = options[disableOptionKey];
  const labelClassName = `flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 rounded-md cursor-pointer space-x-3`;

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
          {disabled ? disabledIcon : icon}
        </IconButton>
      </Tooltip>
      <div
        className={`${dropdownClasses} ${visible(isOpen)}`}
        tabIndex={-1}
        role="menu"
      >
        {Object.entries(optionSettings).map(([key, option]) => {
          const value = options[key as keyof T];
          const inputId = `checkbox-${key}`;
          const isDisabled = disabled && key !== disableOptionKey;
          return (
            <label
              key={String(key)}
              htmlFor={inputId}
              className={labelClassName}
              role="menuitem"
              tabIndex={isDisabled ? -1 : 0}
              onKeyDown={(e) => {
                if (isDisabled) return;
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  updateOption(key as keyof T, !options[key as keyof T]);
                }
              }}
            >
              {(option as BooleanOption).icon && (
                <span>{(option as BooleanOption).icon}</span>
              )}
              <input
                id={inputId}
                type="checkbox"
                checked={value as boolean}
                className="form-checkbox cursor-pointer accent-purple-600 h-4 w-4"
                onChange={() =>
                  updateOption(key as keyof T, !options[key as keyof T])
                }
                disabled={isDisabled}
                tabIndex={-1}
              />
              <span className="select-none flex-grow">
                {(option as BooleanOption).text}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
