import { ChangeEvent, useState } from "react";

/**
 * Controlled labelled text input
 * @param defaultValue - Sets the initial value for the input
 * @param id - Global html attribute that must be unique to the document
 * @param label - Input label visible to the user
 * @param name - Name submitted with the form
 */
export default function LabelledInput({
  defaultValue,
  id,
  label,
  modifyValue,
  name,
}: {
  defaultValue: string;
  id: string;
  label: string;
  modifyValue: (s: string) => string;
  name: string;
}) {
  const [value, setValue] = useState(defaultValue);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const v = modifyValue(e.target.value);
    console.log(`MODIFY!!!`);
    setValue(v);
  }

  return (
    <>
      <label className="font-bold text-white" htmlFor={id}>
        {label}
      </label>
      <input
        className="appearance-none border-2 rounded py-2 px-4 leading-tight bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-indigo-500 focus:border-indigo-500"
        id={id}
        name={name}
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e)}
        required
        value={value}
      />
    </>
  );
}
