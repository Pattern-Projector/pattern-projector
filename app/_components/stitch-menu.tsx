import { EdgeInsets } from "@/_lib/edge-insets";
import { ChangeEvent, Dispatch, SetStateAction } from "react";
import InlineInput from "./inline-input";
import { useTranslations } from "next-intl";
import { allowInteger } from "@/_lib/remove-non-digits";
import { validPageRange } from "@/_lib/get-page-numbers";

export default function StitchMenu({
  setColumnCount,
  setEdgeInsets,
  setPageRange,
  columnCount,
  edgeInsets,
  pageRange,
  pageCount,
  className,
}: {
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
    if (name.localeCompare("top") === 0) {
      setEdgeInsets({
        ...edgeInsets,
        top: n,
      });
    } else if (name.localeCompare("right") === 0) {
      setEdgeInsets({
        ...edgeInsets,
        right: n,
      });
    } else if (name.localeCompare("bottom") === 0) {
      setEdgeInsets({
        ...edgeInsets,
        bottom: n,
      });
    } else if (name.localeCompare("left") === 0) {
      setEdgeInsets({
        ...edgeInsets,
        left: n,
      });
    }
  }

  return (
    <menu
      className={`flex flex-col gap-2 ${className} bg-white border border-gray-200 rounded-lg absolute top-16 z-30 "`}
    >
      <InlineInput
        className="flex relative justify-end"
        inputClassName="w-12"
        handleChange={handleColumnCountChange}
        label={t("columnCount")}
        value={columnCount}
      />
      <InlineInput
        className="flex relative justify-end"
        inputClassName="w-20"
        handleChange={handlePageRangeChange}
        label={t("pageRange")}
        value={pageRange}
      />
      <InlineInput
        className="flex relative justify-end"
        inputClassName="w-12"
        handleChange={handleEdgeInsetChange}
        label={t("top")}
        name="top"
        value={String(edgeInsets.top)}
      />
      <InlineInput
        className="flex relative justify-end"
        inputClassName="w-12"
        handleChange={handleEdgeInsetChange}
        label={t("right")}
        name="right"
        value={String(edgeInsets.right)}
      />
      <InlineInput
        className="flex relative justify-end"
        inputClassName="w-12"
        handleChange={handleEdgeInsetChange}
        label={t("bottom")}
        name="bottom"
        value={String(edgeInsets.bottom)}
      />
      <InlineInput
        className="flex relative justify-end"
        inputClassName="w-12"
        handleChange={handleEdgeInsetChange}
        label={t("left")}
        name="left"
        value={String(edgeInsets.left)}
      />
    </menu>
  );
}
