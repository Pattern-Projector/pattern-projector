import { ChangeEvent, ReactElement, useState } from "react";
import StepDownIcon from "@/_icons/step-down-icon";
import StepUpIcon from "@/_icons/step-up-icon";

/**
 * Controlled labelled text input
 * @param handleChange - Function that handles change to input
 * @param id - Global html attribute that must be unique to the document
 * @param inputTestId - Input ID used for testing
 * @param label - Input label visible to the user
 * @param name - Name submitted with the form
 * @param value - Input value
 */
export default function StepperInput({
  inputClassName,
  handleChange,
  label,
  name,
  value,
  onStep,
  step = 1,
}: {
  inputClassName?: string | undefined;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  label?: string | ReactElement;
  name?: string;
  value: string;
  onStep: (increment: number) => void;
  step?: number;
}) {
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  function handleStep(step: number) {
    onStep(step);
    let fires = 0;
    const id = setInterval(() => {
      if (++fires > 3) {
        onStep(step);
      }
    }, 100);
    setIntervalId(id);
  }

  function handleButtonRelease() {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  }

  const buttonClassName =
    "dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 p-2.5 h-11 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 focus:outline-none user-select-none";
  const inputClass =
    "rounded-none h-11 p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm focus:ring-4 focus:outline-none focus:ring-blue-300 w-12 text-center dark:bg-black dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-800 dark:focus:border-blue-800";

  return (
    <div className="flex flex-col">
      <label
        style={{ WebkitUserSelect: "none", userSelect: "none" }}
        className="text-sm font-medium text-gray-900 dark:text-white ml-1 user-select-none"
        htmlFor={name}
      >
        {label}
      </label>
      <div className="flex items-center justify-center">
        <button
          style={{ WebkitUserSelect: "none", userSelect: "none" }}
          className={`${buttonClassName} rounded-s-lg`}
          onPointerDown={() => handleStep(-step)}
          onPointerUp={handleButtonRelease}
          onPointerLeave={handleButtonRelease}
        >
          <StepDownIcon ariaLabel="decrement" />
        </button>
        <input
          onChange={handleChange}
          inputMode="numeric"
          value={value}
          name={name}
          id={name}
          className={`${inputClassName} ${inputClass}`}
        />
        <button
          style={{ WebkitUserSelect: "none", userSelect: "none" }}
          className={`${buttonClassName} rounded-e-lg`}
          onPointerDown={() => handleStep(step)}
          onPointerUp={handleButtonRelease}
          onPointerLeave={handleButtonRelease}
        >
          <StepUpIcon ariaLabel="increment" />
        </button>
      </div>
    </div>
  );
}
