export default function FlipVerticalOffIcon({
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
      fill="#000"
    >
      <path
        d="m 600,-840 h 160 q 33,0 56.5,23.5 23.5,23.5 23.5,56.5 v 560 q 0,33 -23.5,56.5 Q 793,-120 760,-120 H 600 v -80 H 760 V -760 H 600 Z m -80,-80 v 880 h -80 v -880 z m -160,80 v 80 h -80 v -80 z m 0,640 v 80 h -80 v -80 z M 200,-840 v 80 h -80 q 0,-33 23.5,-56.5 Q 167,-840 200,-840 Z m 0,160 v 80 h -80 v -80 z m 0,160 v 80 h -80 v -80 z m 0,160 v 80 h -80 v -80 z m 0,160 v 80 q -33,0 -56.5,-23.5 Q 120,-167 120,-200 Z"
        id="path1"
      />
    </svg>
  );
}
