export default function removeNonDigits(
  newString: string,
  oldString: string,
  max?: number,
): string {
  const num = newString.replace(/[^.\d]/g, "");
  const decimalCount = (num.match(/\./g) || []).length;
  if (num.localeCompare(".") === 0) {
    return "0.";
  }
  if (decimalCount > 1 || (max !== undefined && parseFloat(num) > max)) {
    return oldString;
  } else {
    return num;
  }
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
