import React, { ReactElement } from "react";

export default function Tooltip({
  children,
  className,
  description,
  visible = false,
  disabled = false,
  top = false,
}: {
  children: ReactElement;
  className?: string | undefined;
  description: string;
  visible?: boolean;
  disabled?: boolean;
  top?: boolean;
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
          {top ? (
            <>
              <div className="bg-gray-800 absolute bottom-[60px] left-1/2 w-3 h-3 -translate-x-1/2 rotate-45"></div>
              <span className="absolute bottom-16 p-2 text-xs leading-4 text-white bg-gray-800 rounded text-center">
                {description}
              </span>
            </>
          ) : (
            <>
              <div className="w-3 h-3 -mb-2 rotate-45 bg-gray-800"></div>
              <span className="relative p-2 text-xs leading-4 text-white bg-gray-800 rounded text-center">
                {description}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
