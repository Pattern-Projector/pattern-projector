export default function PatternPieceIcon({ ariaLabel }: { ariaLabel: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24px"
      viewBox="0 0 24 24"
      width="24px"
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
      aria-label={ariaLabel}
    >
      {/* cut line */}
      <path d="M6 3h12l3 18H3z" strokeWidth="2" />
      {/* sew line */}
      <path
        d="M7.7 6h8.6l2.2 12.5h-13z"
        strokeWidth="1.2"
        strokeDasharray="2 1.6"
      />
      {/* notch */}
      <path d="M12 21v-2" strokeWidth="2" />
    </svg>
  );
}
