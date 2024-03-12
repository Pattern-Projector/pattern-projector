/**
 * Globally removes non digits from a string while allowing decimal numbers
 * @param newString - string to remove non digits from
 * @param oldString - previous string
 * @returns - a new string with only digits or decimals in the order they appear in s
 */
export default function removeNonDigits(newString: string, oldString: string): string {
  const num = newString.replace(/[^.\d]/g, "");
  const decimalCount = (num.match(/\./g) || []).length;
  if (decimalCount > 1) {
    return oldString;
  } else {
    return num;
  }
}

export function allowInteger(s: string): string {
  return s.replace(/\D/g, "");
}
