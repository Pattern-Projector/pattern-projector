import { ChangeEvent } from "react";

import { Unit } from "@/_lib/unit";

import LabelledInput from "./labelled-input";
import LabelledRadioInput from "./labelled-radio-input";

/**
 * A component for inputing the width and height of the user's selected rectangle from the cutting mat in either inches or centimetres
 */
export default function DimensionsInput({
  handleHeightChange,
  handleWidthChange,
  handleUnitChange,
  height,
  width,
}: {
  handleHeightChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleWidthChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleUnitChange: (e: ChangeEvent<HTMLInputElement>) => void;
  height: string;
  width: string;
}) {
  return (
    <>
      <LabelledInput
        handleChange={handleWidthChange}
        id="width"
        inputTestId="width"
        label="Width"
        name="width"
        value={width}
      />

      <LabelledInput
        handleChange={handleHeightChange}
        id="height"
        inputTestId="height"
        label="Height"
        name="height"
        value={height}
      />

      <fieldset className="bg-gray-700 rounded">
        <LabelledRadioInput
          handleChange={handleUnitChange}
          defaultChecked={true}
          id={Unit.Inches}
          inputTestId="inches"
          label="Inches"
          name="unit"
        />
        <LabelledRadioInput
          handleChange={handleUnitChange}
          id={Unit.Centimetres}
          inputTestId="centimetres"
          label="Centimetres"
          name="unit"
        />
      </fieldset>
    </>
  );
}
