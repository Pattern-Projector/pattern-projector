import LabelledInput from "@/_components/labelled-input";
import removeNonDigits from "@/_lib/remove-non-digits";
import { expect, test } from "@playwright/experimental-ct-react";

test("contain have value 'foo'", async ({ mount }) => {
  const component = await mount(
    <LabelledInput
      defaultValue={""}
      id="foo"
      label="Foo"
      modifyValue={(s) => s}
      name="foo"
    />
  );
  const locator = component.getByRole("textbox", { name: "foo" });
  console.log(locator);
  await locator.fill("foo");
  await expect(locator).toHaveValue("foo");
});
