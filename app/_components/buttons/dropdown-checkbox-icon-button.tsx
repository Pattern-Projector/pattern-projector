import React, { useState, useRef, useEffect } from "react";
import { IconButton } from "@/_components/buttons/icon-button";
import Tooltip from "@/_components/tooltip/tooltip";
import { visible } from "@/_components/theme/css-functions";

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

  const updateOption = (key: keyof T, value: boolean | number): void => {
    const updatedOptions = {
      ...options,
      [key]: value,
    };

    setSelectedOptions(updatedOptions);
  };

  const disabled = options[disableOptionKey];

  return (
    <div
      className={`relative inline-block ${className || ""}`}
      ref={containerRef}
    >
      <Tooltip description={description} tooltipVisible={!isOpen}>
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
          const isBoolean = typeof value === "boolean";
          const isNumber = typeof value === "number";
          const inputId = `checkbox-${key}`;

          const handleKeyDown = (
            event: React.KeyboardEvent<HTMLLabelElement>,
          ) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (isBoolean) {
                updateOption(key as keyof T, !options[key as keyof T]);
              }
            }
          };

          return (
            <label
              key={String(key)}
              htmlFor={inputId}
              className={`flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 rounded-md cursor-pointer space-x-3`}
              role="menuitem"
              tabIndex={0}
              onKeyDown={
                disabled && key !== disableOptionKey ? undefined : handleKeyDown
              }
            >
              {isBoolean && (option as BooleanOption).icon && (
                <span>{(option as BooleanOption).icon}</span>
              )}
              {isNumber && (option as NumberOption).icon && (
                <span>{(option as NumberOption).icon}</span>
              )}
              {isBoolean && (
                <input
                  id={inputId}
                  type="checkbox"
                  checked={value as boolean}
                  className="form-checkbox cursor-pointer accent-purple-600 h-4 w-4"
                  onChange={() =>
                    updateOption(key as keyof T, !options[key as keyof T])
                  }
                  disabled={disabled && key !== disableOptionKey}
                  tabIndex={-1}
                />
              )}
              {isNumber && (
                <input
                  id={inputId}
                  type="number"
                  value={value as number}
                  min={(option as NumberOption).min}
                  max={(option as NumberOption).max}
                  className={`w-16 h-8 px-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-4 focus:outline-none focus:ring-blue-300 text-right dark:bg-black dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-800 dark:focus:border-blue-800`}
                  onChange={(e) =>
                    updateOption(key as keyof T, parseInt(e.target.value, 10))
                  }
                  disabled={disabled && key !== disableOptionKey}
                />
              )}
              <span className="select-none flex-grow">
                {(option as BooleanOption | NumberOption).text}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
