export default function debounce<T extends Function>(
  fn: T,
  waitMilliseconds: number,
) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), waitMilliseconds);
  };
}
