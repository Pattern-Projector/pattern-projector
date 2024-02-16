/**
 * Globally removes non digits from a string
 * @param s - string to remove non digits from
 * @returns - a new string with only digits or decimal points in the order they appear in s
 */
export default function removeNonDigits(s: string) {
  return s.replace(/[^.\d]/g, "");
}
