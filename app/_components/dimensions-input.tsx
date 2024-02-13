import { ChangeEvent } from "react";

import LabelledInput from "./labelled-input";

/**
 * A component for inputing the width and height of the user's selected rectangle from the cutting mat in inches
 * @param handleHeightChange - Controls height input
 * @param handleWidthChange - Controls width input
 * @param height - Height of calibration space in inches
 * @param width - Width of calibration space in inches
 */
export default function DimensionsInput({
  handleHeightChange,
  handleWidthChange,
  height,
  width,
}: {
  handleHeightChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleWidthChange: (e: ChangeEvent<HTMLInputElement>) => void;
  height: string;
  width: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
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
    </div>
  );
}
