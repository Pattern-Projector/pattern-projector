import { ChangeEvent } from "react";

/**
 * Controlled labelled text input
 * @param defaultValue - Sets the initial value for the input
 * @param id - Global html attribute that must be unique to the document
 * @param name - Name submitted with the form
 */
export default function FileInput({
  accept,
  className,
  handleChange,
  id,
}: {
  accept: string;
  className: string | undefined;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  id: string;
}) {
  return (
    <input
      accept={accept}
      className={className}
      id={id}
      onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e)}
      type="file"
    />
  );
}
