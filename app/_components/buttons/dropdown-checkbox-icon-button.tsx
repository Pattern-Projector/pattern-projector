import React, { useState, useRef, useEffect } from 'react';
import { IconButton } from '@/_components/buttons/icon-button';
import Tooltip from "@/_components/tooltip/tooltip";
import { visible } from "@/_components/theme/css-functions";

export function DropdownCheckboxIconButton({
  description,
  icon,
  disabledIcon,
  disableOptionKey,
  options,
  setSelectedOptions,
  className,
}: {
  description: string;
  icon: React.ReactNode;
  disabledIcon: React.ReactNode;
  disableOptionKey: string;
  options: {[key:string]:{
    icon: React.ReactNode;
    text: string;
    selected: boolean;
  }};
  setSelectedOptions: (options: { [key: string]: boolean }) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const dropdownClasses = "absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [containerRef]);

  const updateOption = (key: string): void => {
		const updatedOptions = {
			...options,
			[key]: {
				...options[key],
				selected: !options[key].selected,
			},
		};

		setSelectedOptions(
			Object.fromEntries(
				Object.entries(updatedOptions).map(([key, option]) => [key, option.selected])
			)
		);
  }
	
	const disabled = options[disableOptionKey].selected;

  return (
    <div
      className={`relative inline-block ${className || ""}`}
      ref={containerRef}
    >
      <Tooltip
        description={description}
        tooltipVisible={!isOpen}
      >
        <IconButton
          onClick={handleClick}
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          {disabled ? disabledIcon : icon } 
        </IconButton>
      </Tooltip>
      <div
        className={`${dropdownClasses} ${visible(isOpen)}`}
        tabIndex={-1}
        role="menu"
      >
        {Object.entries(options).map(([key, option]) => (
          <button
            key={String(key)}
            className={`flex cursor-pointer items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 rounded-md`}
            role="menuitem"
            tabIndex={0}
						onClick={() => updateOption(key)}
						disabled = {disabled && key != disableOptionKey}
          >
            <span className="mr-3">{option.icon}</span>
						<input
							tabIndex={-1}
							type="checkbox"
							checked={option.selected}
							className="form-checkbox accent-purple-600 h-4 w-4 mr-3"
							disabled = {disabled && key != disableOptionKey}
						/>
            <span className="select-none">{option.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
