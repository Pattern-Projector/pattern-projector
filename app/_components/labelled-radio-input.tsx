import { ChangeEvent } from "react";

/**
 * Labelled radio input
 * @param defaultChecked - Sets the radio input as checked or unchecked
 * @param id - Global html attribute that must be unique to the document
 * @param label - Input label visible to the user
 * @param name - Name submitted with the form
 */
export default function LabelledRadioInput({
  defaultChecked = false,
  handleChange,
  id,
  label,
  name,
}: {
  defaultChecked?: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  id: string;
  label: string;
  name: string;
}) {
  return (
    <div className="inline-flex rounded">
      <input
        className="hidden peer"
        defaultChecked={defaultChecked}
        id={id}
        name={name}
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e)}
        type="radio"
      />
      <label
        className="font-bold radio text-center self-center py-2 px-4 rounded cursor-pointer bg-gray-700 hover:bg-gray-800 peer-checked:bg-indigo-500 peer-checked:hover:bg-indigo-700"
        htmlFor={id}
      >
        {label}
      </label>
    </div>
  );
}
