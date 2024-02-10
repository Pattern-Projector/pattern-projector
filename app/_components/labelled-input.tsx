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
  handleChange,
  id,
  inputTestId,
  label,
  name,
  value,
}: {
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  id: string;
  inputTestId: string;
  label: string;
  name: string;
  value: string;
}) {
  return (
    <>
      <label className="font-bold text-white" htmlFor={id}>
        {label}
      </label>
      <input
        className="appearance-none border-2 rounded py-2 px-4 leading-tight bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-indigo-500 focus:border-indigo-500"
        id={id}
        data-test-id={inputTestId}
        name={name}
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e)}
        required
        value={value}
      />
    </>
  );
}