export default function RotateToHorizontalIcon({
  ariaLabel,
  className,
}: {
  ariaLabel: string;
  className?: string;
}) {
  return (
    <svg
      className={className}
      aria-label={ariaLabel}
      width="24"
      height="24"
      version="1.1"
      viewBox="0 -960 960 960"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      stroke="currentColor"
    >
      <path d="m621-321-160-160 56-56 64 64v-7c0-66.667-23.5-123.33-70.5-170s-104.17-70-171.5-70c-17.333 0-34.333 2-51 6s-33 10-49 18l-60-60c25.333-14.667 51.333-25.667 78-33s54-11 82-11c89.333 0 165.33 31 228 93s94 137.67 94 227v7l64-64 56 56z" />
      <path d="m179-187.12h602" strokeWidth="83.761" />
    </svg>
  );
}
