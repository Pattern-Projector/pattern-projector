import LabelledRadioInput from "@/_components/labelled-radio-input";
import { expect, test } from "@playwright/experimental-ct-react";

test("contain text 'Inches'", async ({ mount }) => {
  const component = await mount(
    <LabelledRadioInput
      defaultChecked={true}
      handleChange={() => {}}
      id="inches"
      label="Inches"
      name="unit"
    />
  );
  await expect(component).toContainText("Inches");
});

test("to be checked by default", async ({ mount }) => {
  const component = await mount(
    <LabelledRadioInput
      defaultChecked={true}
      handleChange={() => {}}
      id="inches"
      label="Inches"
      name="unit"
    />
  );
  const locator = component.getByRole("radio", { name: "inches" });
  await expect(locator).toBeChecked();
});
