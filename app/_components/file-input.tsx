import { ChangeEvent } from "react";

/**
 * Controlled labelled text input
 * @param defaultValue - Sets the initial value for the input
 * @param id - Global html attribute that must be unique to the document
 * @param name - Name submitted with the form
 */
export default function FileInput({
  accept,
  handleChange,
  id,
}: {
  accept: string;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  id: string;
}) {
  return (
    <input
      accept={accept}
      className="z-10 appearance-none border-2 rounded py-2 px-4 leading-tight bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-indigo-500 focus:border-indigo-500"
      id={id}
      onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e)}
      type="file"
    />
  );
}
