/**
 * Allows floating point numbers to be input
 * @param newString - string to remove non digits from
 * @param oldString - previous string
 * @param allowNegative - boolean to permit negative numbers or not
 * @returns - a new floating point number string
 */
export default function allowFloat(
  newString: string,
  oldString: string,
  allowNegative: boolean = false,
): string {
  let num = newString.replace(/[^.\d]/g, "");
  const decimalCount = (num.match(/\./g) || []).length;
  if (num.localeCompare(".") === 0) {
    return "0.";
  }
  if (decimalCount > 1) {
    return oldString;
  }

  if (allowNegative && newString.charAt(0) === "-") {
    return `-${num}`;
  }

  return num;
}

export function allowInteger(
  s: string,
  allowNegative: boolean = false,
): string {
  const digitsOnly: string = s.replace(/\D/g, "");
  if (!allowNegative) {
    return digitsOnly;
  }
  return s.charAt(0) === "-" ? `-${digitsOnly}` : digitsOnly;
}
