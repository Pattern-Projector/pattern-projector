import removeNonDigits from "@/_lib/remove-non-digits";

test("'abc' -> ''", () => {
  expect(removeNonDigits("abc")).toEqual("");
});

test("'1a23bc' -> '123'", () => {
  expect(removeNonDigits("1a23bc")).toEqual("123");
});

test("'123' -> '123'", () => {
  expect(removeNonDigits("123")).toEqual("123");
});

test("'' -> ''", () => {
  expect(removeNonDigits("")).toEqual("");
});
