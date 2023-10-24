import { FormEvent } from "react";

import removeNonDigits from "@/_lib/remove-non-digits";

import LabelledInput from "./labelled-input";
import LabelledRadioInput from "./labelled-radio-input";

/**
 * A component for inputing the width and height of the user's selected rectangle from the cutting mat in either inches or centimetres
 * @param handleSubmit - Handles the submit from the dimensions form when the user clicks 'Calibrate'
 */
export default function DimensionsInput({
  handleSubmit = (e: FormEvent) => {},
}) {
  const defaultValue = "5";
  return (
    <form
      className="flex flex-wrap items-center justify-center gap-4 m-4"
      method="post"
      onSubmit={handleSubmit}
    >
      <LabelledInput
        defaultValue={defaultValue}
        id="width"
        label="Width"
        modifyValue={removeNonDigits}
        name="width"
      />

      <LabelledInput
        defaultValue={defaultValue}
        id="height"
        label="Height"
        modifyValue={removeNonDigits}
        name="height"
      />

      <fieldset className="bg-gray-700 rounded">
        <LabelledRadioInput
          defaultChecked={true}
          id="inches"
          label="Inches"
          name="unit"
        />
        <LabelledRadioInput id="centimetres" label="Centimetres" name="unit" />
      </fieldset>

      <button
        className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
        type="submit"
      >
        Calibrate
      </button>
    </form>
  );
}
