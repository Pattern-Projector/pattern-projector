import React, { ReactElement } from "react";

export default function Tooltip({
  children,
  description,
}: {
  children: ReactElement;
  description: string;
}) {
  return (
    <div className="relative flex flex-col items-center group">
      {children}
      <div
        className={`absolute top-7 flex flex-col items-center hidden mt-6 group-hover:flex`}
      >
        <div className="w-3 h-3 -mb-2 rotate-45 bg-gray-800"></div>
        <span className="relative z-10 p-2 text-xs leading-4 text-white bg-gray-800 rounded text-center">
          {description}
        </span>
      </div>
    </div>
  );
}
