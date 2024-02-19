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
export default function LabelledInput({
  className,
  handleChange,
  id,
  inputTestId,
  label,
  name,
  value,
}: {
  className: string | undefined;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  id: string;
  inputTestId: string;
  label: string;
  name: string;
  value: string;
}) {
  return (
    <div className={className}>
      <label className="text-sm font-medium text-black mb-2" htmlFor={id}>
        {label}
      </label>
      <input
        className="p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-4 focus:outline-none focus:ring-blue-300 w-20"
        id={id}
        data-test-id={inputTestId}
        name={name}
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e)}
        required
        value={value}
      />
    </div>
  );
}
