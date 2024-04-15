import React, { ReactElement } from "react";

export default function Tooltip({
  children,
  className,
  description,
  tooltipVisible,
}: {
  children: ReactElement;
  className?: string | undefined;
  description: string;
  tooltipVisible?: boolean | undefined;
}) {
  return (
    <div
      className={
        "relative flex flex-col items-center group " + (className || "")
      }
    >
      {children}
      <div
        className={`absolute top-7 flex-col items-center mt-6 group-hover:flex ${tooltipVisible ? "flex" : "hidden"}`}
      >
        <div className="w-3 h-3 -mb-2 rotate-45 bg-gray-800"></div>
        <span className="relative z-10 p-2 text-xs leading-4 text-white bg-gray-800 rounded text-center">
          {description}
        </span>
      </div>
    </div>
  );
}
