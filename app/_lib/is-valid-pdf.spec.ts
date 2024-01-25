import isValidPDF from "@/_lib/is-valid-pdf";

test("PDF type application/pdf -> true", () => {
  const file = new File(["foo"], "foo.txt", {
    type: "application/pdf",
  });
  expect(isValidPDF(file)).toBeTruthy();
});

test("PDF type '' but .pdf extension -> true", () => {
  const file = new File(["foo"], "foo.pdf", {
    type: "",
  });
  expect(isValidPDF(file)).toBeTruthy();
});

test("PDF type '' and .txt extension -> false", () => {
  const file = new File(["foo"], "foo.txt", {
    type: "",
  });
  expect(isValidPDF(file)).toBeFalsy();
});

test("PDF type 'text/plain' but .pdf extension -> false", () => {
  const file = new File(["foo"], "foo.pdf", {
    type: "text/plain",
  });
  expect(isValidPDF(file)).toBeFalsy();
});
