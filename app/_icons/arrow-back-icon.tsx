export default function ArrowBackIcon({
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
      <path d="M640-80 240-480l400-400 71 71-329 329 329 329-71 71Z" />
    </svg>
  );
}
