import { ChangeEvent } from "react";
import {SelectOption} from "@/_lib/select-option";

/**
 * Controlled labelled text input
 * @param handleChange - Function that handles change to input
 * @param id - Global html attribute that must be unique to the document
 * @param inputTestId - Input ID used for testing
 * @param label - Input label visible to the user
 * @param name - Name submitted with the form
 * @param value - Input value
 */
export default function InlineSelect({
  className,
  handleChange,
  id,
  name,
  value,
  options,
}: {
  className?: string;
  handleChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  id: string;
  inputTestId: string;
  name: string;
  value: string;
  options: SelectOption[];
}) {
  return (
    <div className={className + " relative flex flex-col justify-center items-center"}>
      <select
        className="py-2.5 px-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-4 focus:outline-none focus:ring-blue-300 w-20"
        id={id}
        name={name}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => handleChange(e)}
        required
        value={value}
      >
        {options.map((o, i) => (
          <option key={i} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
