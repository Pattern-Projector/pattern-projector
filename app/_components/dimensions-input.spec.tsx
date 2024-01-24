import DimensionsInput from "@/_components/dimensions-input";
import { expect, test } from "@playwright/experimental-ct-react";

test("contain text 'Width'", async ({ mount }) => {
  const component = await mount(
    <DimensionsInput
      handleHeightChange={() => {}}
      handleWidthChange={() => {}}
      handleUnitChange={() => {}}
      height="5"
      width="5"
    />
  );
  await expect(component).toContainText("Width");
});

test("contain text 'Height'", async ({ mount }) => {
  const component = await mount(
    <DimensionsInput
      handleHeightChange={() => {}}
      handleWidthChange={() => {}}
      handleUnitChange={() => {}}
      height="5"
      width="5"
    />
  );
  await expect(component).toContainText("Height");
});

test("contain text 'Inches'", async ({ mount }) => {
  const component = await mount(
    <DimensionsInput
      handleHeightChange={() => {}}
      handleWidthChange={() => {}}
      handleUnitChange={() => {}}
      height="5"
      width="5"
    />
  );
  await expect(component).toContainText("Inches");
});

test("contain text 'Centimetres'", async ({ mount }) => {
  const component = await mount(
    <DimensionsInput
      handleHeightChange={() => {}}
      handleWidthChange={() => {}}
      handleUnitChange={() => {}}
      height="5"
      width="5"
    />
  );
  await expect(component).toContainText("Centimetres");
});

test("inches is checked", async ({ mount }) => {
  const component = await mount(
    <DimensionsInput
      handleHeightChange={() => {}}
      handleWidthChange={() => {}}
      handleUnitChange={() => {}}
      height="5"
      width="5"
    />
  );
  const locator = component.getByRole("radio", { name: "inches" });
  await expect(locator).toBeChecked();
});

test("enter width '7'", async ({ mount }) => {
  const component = await mount(
    <DimensionsInput
      handleHeightChange={() => {}}
      handleWidthChange={() => {}}
      handleUnitChange={() => {}}
      height=""
      width=""
    />
  );
  const locator = component.getByRole("textbox", { name: "width" });
  await locator.fill("7");
  await expect(locator).toHaveValue("7");
});

test("cannot enter 'a'", async ({ mount }) => {
  const component = await mount(
    <DimensionsInput
      handleHeightChange={() => {}}
      handleWidthChange={() => {}}
      handleUnitChange={() => {}}
      height=""
      width=""
    />
  );
  const locator = component.getByRole("textbox", { name: "width" });
  await locator.fill("a");
  await expect(locator).toHaveValue("");
});
