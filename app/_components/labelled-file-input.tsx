import { ChangeEvent } from "react";

/**
 * Controlled labelled text input
 * @param defaultValue - Sets the initial value for the input
 * @param id - Global html attribute that must be unique to the document
 * @param label - Input label visible to the user
 * @param name - Name submitted with the form
 */
export default function LabelledFileInput({
  accept,
  handleChange,
  id,
  inputTestId,
  label,
}: {
  accept: string;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  id: string;
  inputTestId: string;
  label: string;
}) {
  return (
    <>
      <label className="font-bold text-white" htmlFor={id}>
        {label}
      </label>{" "}
      <input
        accept={accept}
        className="z-10 appearance-none border-2 rounded py-2 px-4 leading-tight bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-indigo-500 focus:border-indigo-500"
        data-test-id={inputTestId}
        id={id}
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e)}
        type="file"
      />
    </>
  );
}
