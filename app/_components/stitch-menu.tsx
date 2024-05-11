import { EdgeInsets } from "@/_lib/interfaces/edge-insets";
import { ChangeEvent, Dispatch, SetStateAction } from "react";
import { useTranslations } from "next-intl";
import { allowInteger } from "@/_lib/remove-non-digits";
import Input from "@/_components/input";
import { IconButton } from "@/_components/buttons/icon-button";
import CloseIcon from "@/_icons/close-icon";
import StepperInput from "@/_components/stepper-input";

export default function StitchMenu({
  setColumnCount,
  setEdgeInsets,
  setPageRange,
  columnCount,
  edgeInsets,
  pageRange,
  pageCount,
  className,
  showMenu,
  setShowMenu,
}: {
  setColumnCount: Dispatch<SetStateAction<string>>;
  setEdgeInsets: Dispatch<SetStateAction<EdgeInsets>>;
  setPageRange: Dispatch<SetStateAction<string>>;
  columnCount: string;
  edgeInsets: EdgeInsets;
  pageRange: string;
  pageCount: number;
  className?: string;
  showMenu: boolean;
  setShowMenu: (showMenu: boolean) => void;
}) {
  const t = useTranslations("StitchMenu");

  function handleColumnCountChange(e: ChangeEvent<HTMLInputElement>) {
    const count = Number(allowInteger(e.target.value));
    if (count > 0 && count <= pageCount) {
      setColumnCount(String(count));
    } else if (e.target.value == "") {
      setColumnCount("");
    }
  }

  function handleIncrement(
    increment: number,
    currVal: string,
    setterFunc: (newValue: string) => void,
  ) {
    if (typeof setterFunc === "function") {
      const numberVal = Number(allowInteger(currVal));
      setterFunc((numberVal + increment).toString());
    }
  }

  function handlePageRangeChange(e: ChangeEvent<HTMLInputElement>) {
    const { value } = e.target;
    setPageRange(value);
  }

  function handleEdgeInsetChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const n = value == "" ? "" : allowInteger(value);
    updateEdgeInset(n, name);
  }

  function updateEdgeInset(edgeInset: string, name: string) {
    if (name.localeCompare("horizontal") === 0) {
      setEdgeInsets({
        ...edgeInsets,
        horizontal: edgeInset,
      });
    } else if (name.localeCompare("vertical") === 0) {
      setEdgeInsets({
        ...edgeInsets,
        vertical: edgeInset,
      });
    }
  }

  return (
    <menu
      className={`flex justify-between ${showMenu ? "top-16" : "-top-60"} absolute left-0 w-full z-20 transition-all duration-700 ${className} bg-white dark:bg-black border-b border-gray-200 dark:border-gray-700 p-2`}
    >
      <div className="flex gap-2">
        <StepperInput
          inputClassName="w-20"
          handleChange={handleColumnCountChange}
          label={t("columnCount")}
          value={columnCount}
          onStep={(increment: number) =>
            handleIncrement(increment, columnCount, setColumnCount)
          }
        />
        <div className="ml-3">
          <Input
            inputClassName="w-36"
            handleChange={handlePageRangeChange}
            label={t("pageRange")}
            value={pageRange}
          />
        </div>
        <div className="ml-3">
          <StepperInput
            inputClassName="w-20"
            handleChange={handleEdgeInsetChange}
            label={t("horizontal")}
            name="horizontal"
            value={String(edgeInsets.horizontal || 0)}
            onStep={(increment: number) =>
              handleIncrement(
                increment,
                String(edgeInsets.horizontal || 0),
                (value: string) => updateEdgeInset(value, "horizontal"),
              )
            }
          />
        </div>
        <div className="ml-3">
          <StepperInput
            inputClassName="w-20"
            handleChange={handleEdgeInsetChange}
            label={t("vertical")}
            name="vertical"
            value={String(edgeInsets.vertical || 0)}
            onStep={(increment: number) =>
              handleIncrement(
                increment,
                String(edgeInsets.vertical || 0),
                (value: string) => updateEdgeInset(value, "vertical"),
              )
            }
          />
        </div>
      </div>
      <IconButton onClick={() => setShowMenu(false)}>
        <CloseIcon ariaLabel="close" />
      </IconButton>
    </menu>
  );
}
