import React, { useMemo } from "react";
import { visible } from "@/_components/theme/css-functions";
import { decimalToString } from "@/_lib/remove-non-digits";

export default function ModifiersBanner({
  patternScale,
}: {
  patternScale?: number;
}) {
  const hidden = useMemo(() => {
    if (!patternScale || patternScale === 1) {
      return true;
    }
    return false;
  }, [patternScale]);

  const text = useMemo(() => {
    if (patternScale && patternScale !== 1) {
      return `${decimalToString(patternScale * 100, 1)}%`;
    }
  }, [patternScale]);

  return (
    <div
      className={`${visible(!hidden)} h-6 bg-amber-700 w-full text-center font-bold opacity-80`}
    >
      {text}
    </div>
  );
}
