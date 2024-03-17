import { EdgeInsets } from "@/_lib/edge-insets";
import { ChangeEvent, Dispatch, SetStateAction } from "react";
import InlineInput from "./inline-input";
import { useTranslations } from "next-intl";
import { allowInteger } from "@/_lib/remove-non-digits";
import { validPageRange } from "@/_lib/get-page-numbers";

export default function StitchMenu({
  setShowStitchMenu,
  setColumnCount,
  setEdgeInsets,
  setPageRange,
  columnCount,
  edgeInsets,
  pageRange,
  pageCount,
  className,
}: {
  setShowStitchMenu: Dispatch<SetStateAction<boolean>>;
  setColumnCount: Dispatch<SetStateAction<string>>;
  setEdgeInsets: Dispatch<SetStateAction<EdgeInsets>>;
  setPageRange: Dispatch<SetStateAction<string>>;
  columnCount: string;
  edgeInsets: EdgeInsets;
  pageRange: string;
  pageCount: number;
  className: string | undefined;
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

  function handlePageRangeChange(e: ChangeEvent<HTMLInputElement>) {
    const range = validPageRange(e.target.value, pageRange);
    setPageRange(range);
  }

  function handleEdgeInsetChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const n = value == "" ? "" : allowInteger(value);
    if (name.localeCompare("horizontal") === 0) {
      setEdgeInsets({
        ...edgeInsets,
        horizontal: n,
      });
    } else if (name.localeCompare("vertical") === 0) {
      setEdgeInsets({
        ...edgeInsets,
        vertical: n,
      });
    }
  }

  return (
    <menu
      className={`flex flex-col gap-2 ${className} bg-white border border-gray-200 rounded-lg absolute p-2`}
    >
      <InlineInput
        type="number"
        className="flex relative justify-end"
        inputClassName="w-12 !text-left"
        handleChange={handleColumnCountChange}
        label={t("columnCount")}
        value={columnCount}
      />
      <InlineInput
        className="flex relative justify-end"
        inputClassName="!w-20 !text-left"
        handleChange={handlePageRangeChange}
        label={t("pageRange")}
        value={pageRange}
      />
      <InlineInput
        type="number"
        className="flex relative justify-end"
        inputClassName="w-12 !text-left"
        handleChange={handleEdgeInsetChange}
        label={t("horizontal")}
        name="horizontal"
        value={String(edgeInsets.horizontal)}
      />
      <InlineInput
        type="number"
        className="flex relative justify-end"
        inputClassName="w-12 !text-left"
        handleChange={handleEdgeInsetChange}
        label={t("vertical")}
        name="vertical"
        value={String(edgeInsets.vertical)}
      />
    </menu>
  );
}
