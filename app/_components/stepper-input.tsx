import { ChangeEvent, LegacyRef, ReactElement } from "react";
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
  className,
  inputClassName,
  handleChange,
  id,
  inputTestId,
  label,
  name,
  value,
  min,
  type,
  inputRef,
  onStep,
}: {
  className?: string | undefined;
  inputClassName?: string | undefined;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  id?: string;
  inputTestId?: string;
  label?: string | ReactElement;
  name?: string;
  value: string;
  type?: string;
  min?: string;
  inputRef?: LegacyRef<HTMLInputElement> | undefined;
  onStep: (increment: number) => void;
}) {
  return (
    <div className={`flex items-center ${className}`}>
      <label
        className="text-sm font-medium text-gray-500 dark:text-white mr-1"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative items-center">
        <button
          type="button"
          name={name}
          className="absolute top-0 left-0 h-full flex items-center"
          onClick={() => onStep(-1)}
        >
          <StepDownIcon ariaLabel="test" />
        </button>
        <input
          min={min}
          type={type ? type : "text"}
          className={`${inputClassName} text-center p-2.5 text-gray-900 text-sm focus:outline-none dark:bg-black dark:placeholder-gray-400 dark:text-white`}
          id={id}
          data-test-id={inputTestId}
          name={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e)}
          required
          value={value}
          ref={inputRef}
        />
        <button
          type="button"
          name={name}
          className="absolute top-0 right-0 h-full flex items-center"
          onClick={() => onStep(1)}
        >
          <StepUpIcon ariaLabel="test" />
        </button>
      </div>
    </div>
  );
}
