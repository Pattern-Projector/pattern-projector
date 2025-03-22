export default function removeNonDigits(
  newString: string,
  oldString: string,
): string {
  const num = newString.replace(/[^.\d]/g, "");
  const decimalCount = (num.match(/\./g) || []).length;
  if (num.localeCompare(".") === 0) {
    return "0.";
  }
  if (decimalCount > 1) {
    return oldString;
  } else {
    return num;
  }
}

export function roundTo(num: number, decimalDigits: number) {
  const factor = 10 ** decimalDigits; // Takes 10^num
  return Math.round(num * factor) / factor;
}

export function decimalToString(num: number, decimalDigits: number) {
  const roundedNum = roundTo(num, decimalDigits);
  if (Number.isInteger(roundedNum)) {
    return num.toFixed(0);
  }
  return num.toFixed(decimalDigits);
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
