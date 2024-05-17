import React, { ReactElement } from "react";

export default function Tooltip({
  children,
  className,
  description,
  visible = false,
  disabled = false,
}: {
  children: ReactElement;
  className?: string | undefined;
  description: string;
  visible?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className={`${className ?? ""} relative flex flex-col items-center group `}
    >
      {children}
      {!disabled && (
        <div
          className={`absolute top-7 flex-col items-center mt-6 group-hover:flex ${visible ? "flex" : "hidden"}`}
        >
          <div className="w-3 h-3 -mb-2 rotate-45 bg-gray-800"></div>
          <span className="relative p-2 text-xs leading-4 text-white bg-gray-800 rounded text-center">
            {description}
          </span>
        </div>
      )}
    </div>
  );
}
