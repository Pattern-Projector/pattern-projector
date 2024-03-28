export default function FlipHorizontalIcon({
  ariaLabel,
}: {
  ariaLabel: string;
}) {
  return (
    <svg
      aria-label={ariaLabel}
      xmlns="http://www.w3.org/2000/svg"
      height="24"
      viewBox="0 -960 960 960"
      width="24"
      fill="currentColor"
    >
      <path
        d="m 120,-600 v -160 q 0,-33 23.5,-56.5 Q 167,-840 200,-840 h 560 q 33,0 56.5,23.5 23.5,23.5 23.5,56.5 v 160 H 760 V -760 H 200 v 160 z m -80,80 h 880 v 80 H 40 Z m 80,160 h 80 v 80 h -80 z m 640,0 h 80 v 80 h -80 z m -640,160 h 80 v 80 q -33,0 -56.5,-23.5 Q 120,-167 120,-200 Z m 160,0 h 80 v 80 h -80 z m 160,0 h 80 v 80 h -80 z m 160,0 h 80 v 80 h -80 z m 160,0 h 80 q 0,33 -23.5,56.5 Q 793,-120 760,-120 Z"
        id="path1"
      />
    </svg>
  );
}
