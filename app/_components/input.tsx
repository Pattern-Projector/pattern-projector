import { ChangeEvent, LegacyRef, ReactElement } from "react";

/**
 * Controlled labelled text input
 * @param handleChange - Function that handles change to input
 * @param id - Global html attribute that must be unique to the document
 * @param inputTestId - Input ID used for testing
 * @param label - Input label visible to the user
 * @param name - Name submitted with the form
 * @param value - Input value
 */
export default function Input({
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
}) {
  return (
    <div className={`${className} flex flex-col`}>
      <label
        className="text-sm font-medium text-gray-500 dark:text-white ml-1"
        htmlFor={id}
      >
        {label}
      </label>
      <input
        min={min}
        type={type ? type : "text"}
        className={`${inputClassName} p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-black dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-800 dark:focus:border-blue-800`}
        id={id}
        data-test-id={inputTestId}
        name={name}
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e)}
        required
        value={value}
        ref={inputRef}
      />
    </div>
  );
}
