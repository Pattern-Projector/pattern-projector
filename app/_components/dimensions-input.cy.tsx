import React from "react";

import DimensionsInput from "./dimensions-input";

describe("<DimensionsInput />", () => {
  it("Inches radio input should be checked", () => {
    cy.mount(
      <DimensionsInput
        handleHeightChange={() => {}}
        handleWidthChange={() => {}}
        height="5"
        width="5"
      />
    );

    cy.get('[data-test-id="inches"]').should("be.checked");
  });
});
