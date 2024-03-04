import { OPS } from "pdfjs-dist";
import fill = OPS.fill;

export default function ArrowForwardIcon({
  ariaLabel,
  fill = "currentColor",
}: {
  ariaLabel: string;
  fill?: string;
}) {
  return (
    <svg
      aria-label={ariaLabel}
      xmlns="http://www.w3.org/2000/svg"
      height="24"
      viewBox="0 -960 960 960"
      width="24"
      fill={fill}
    >
      <path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z" />
    </svg>
  );
}
