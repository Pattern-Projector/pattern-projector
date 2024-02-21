import { ChangeEvent } from "react";

/**
 * Controlled labelled text input
 * @param handleChange - Function that handles change to input
 * @param id - Global html attribute that must be unique to the document
 * @param inputTestId - Input ID used for testing
 * @param label - Input label visible to the user
 * @param name - Name submitted with the form
 * @param value - Input value
 */
export default function InlineInput({
  className,
  handleChange,
  id,
  inputTestId,
  label,
  labelRight,
  name,
  value,
}: {
  className: string | undefined;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  id: string;
  inputTestId: string;
  label: string;
  labelRight: string | null;
  name: string;
  value: string;
}) {
  return (
    <div className={className + " relative flex flex-col justify-center items-center"}>
      <label className="text-sm font-medium text-gray-500 mb-2 absolute left-2 top-0 h-full flex items-center"
             htmlFor={id}>
        {label}
      </label>
      <input
        className="py-2.5 pl-6 pr-7 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-4 focus:outline-none focus:ring-blue-300 w-20 text-right"
        id={id}
        data-test-id={inputTestId}
        name={name}
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e)}
        required
        value={value}
      />
      <label className="text-sm text-gray-500 mb-2 absolute right-2 top-0 h-full flex items-center" htmlFor={id}>
        {labelRight}
      </label>
    </div>
  );
}
