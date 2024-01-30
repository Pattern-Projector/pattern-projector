import React, { MutableRefObject } from "react";

import FullScreenButton from "./full-screen-button";

describe("<FullScreenButton />", () => {
  it("Active handle should have minimize svg", () => {
    const handle = {
      active: true, // Specifies if attached element is currently full screen.
      enter: cy.stub(), // Requests this element to go full screen.
      exit: cy.stub(), // Requests this element to exit full screen.
      node: {} as MutableRefObject<null>, // The attached DOM node
    };

    cy.mount(<FullScreenButton handle={handle} />);

    cy.get('[data-test-id="minimize"]').should(
      "have.attr",
      "aria-label",
      "minimize"
    );
  });

  it("Inactive handle should have maximize svg", () => {
    const handle = {
      active: false, // Specifies if attached element is currently full screen.
      enter: cy.stub(), // Requests this element to go full screen.
      exit: cy.stub(), // Requests this element to exit full screen.
      node: {} as MutableRefObject<null>, // The attached DOM node
    };

    cy.mount(<FullScreenButton handle={handle} />);

    cy.get('[data-test-id="maximize"]').should(
      "have.attr",
      "aria-label",
      "maximize"
    );
  });
});
