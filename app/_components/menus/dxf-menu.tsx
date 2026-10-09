import { Dispatch, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ButtonStyle, sideMenuStyles } from "@/_components/theme/styles";
import { Button } from "@/_components/buttons/button";
import StepperInput from "@/_components/stepper-input";
import InlineSelect from "@/_components/inline-select";
import removeNonDigits from "@/_lib/remove-non-digits";
import { Layers } from "@/_lib/layers";
import { LayerAction } from "@/_reducers/layersReducer";
import { Theme, themeFilter } from "@/_lib/display-settings";
import {
  DashStyle,
  DxfElement,
  DxfStyles,
  ElementStyle,
  dashArray,
  dxfElements,
  groupId,
  sizedElements,
} from "@/_lib/dxf/dxf-styles";
import { DxfWatcher, WatchStatus } from "@/_hooks/use-dxf-watcher";

export interface LoadedDxfInfo {
  name: string;
  loadedAt: number;
  pieceCount: number;
  widthMm: number;
  heightMm: number;
}

const checkboxClasses =
  "w-4 h-4 accent-purple-600 rounded focus:ring-blue-500 dark:focus:ring-blue-800";
const sectionTitleClasses =
  "flex items-center justify-between w-full border-b border-gray-200 dark:border-gray-700 p-2";
const hintClasses = "text-xs text-gray-500 dark:text-gray-400";

export default function DxfMenu({
  watcher,
  loaded,
  styles,
  setStyles,
  onResetStyles,
  pack,
  setPack,
  layers,
  dispatchLayerAction,
  theme,
}: {
  watcher: DxfWatcher;
  loaded: LoadedDxfInfo | null;
  styles: DxfStyles;
  setStyles: (styles: DxfStyles) => void;
  onResetStyles: () => void;
  pack: boolean;
  setPack: (pack: boolean) => void;
  layers: Layers;
  dispatchLayerAction: Dispatch<LayerAction>;
  theme: Theme;
}) {
  const t = useTranslations("DxfMenu");

  const watching = watcher.status === WatchStatus.Watching;
  const statusText = {
    [WatchStatus.Unsupported]: t("statusUnsupported"),
    [WatchStatus.Off]: t("statusOff"),
    [WatchStatus.NeedsPermission]: t("statusNeedsPermission"),
    [WatchStatus.Watching]: t("statusWatching"),
    [WatchStatus.FolderMissing]: t("statusFolderMissing"),
  }[watcher.status];

  const updateStyle = (element: DxfElement, change: Partial<ElementStyle>) =>
    setStyles({ ...styles, [element]: { ...styles[element], ...change } });

  return (
    <menu
      className={`${sideMenuStyles} !w-72 h-[calc(100vh-8rem)] overflow-y-auto scrollbar text-sm font-medium`}
    >
      <div className={sectionTitleClasses}>
        <h1>{t("title")}</h1>
      </div>

      {/* Folder watcher */}
      <section className="w-full flex flex-col gap-2 px-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className={checkboxClasses}
            checked={watching}
            disabled={watcher.status === WatchStatus.Unsupported}
            onChange={(e) =>
              e.target.checked ? watcher.start() : watcher.stop()
            }
          />
          {t("watchFolder")}
        </label>
        {watcher.status !== WatchStatus.Unsupported && (
          <div className="flex items-center justify-between gap-2 w-full">
            <span
              className="truncate text-gray-700 dark:text-gray-300"
              title={watcher.folderName ?? undefined}
            >
              {watcher.folderName ?? t("noFolder")}
            </span>
            <Button
              style={ButtonStyle.OUTLINE}
              className="!px-3 !py-1.5 shrink-0"
              onClick={() => watcher.chooseFolder()}
            >
              {watcher.folderName ? t("changeFolder") : t("chooseFolder")}
            </Button>
          </div>
        )}
        <p className={hintClasses}>{statusText}</p>
        {watcher.folderName && (
          <Button
            style={ButtonStyle.OUTLINE}
            className="!px-3 !py-1.5"
            onClick={() => watcher.loadLatest()}
          >
            {t("loadLatest")}
          </Button>
        )}
        {loaded && (
          <p className={hintClasses} data-test-id="dxf-loaded">
            {t("loaded", {
              name: loaded.name,
              time: new Date(loaded.loadedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
            })}
            <br />
            {t("pieces", {
              count: loaded.pieceCount,
              width: (loaded.widthMm / 10).toFixed(0),
              height: (loaded.heightMm / 10).toFixed(0),
            })}
          </p>
        )}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className={checkboxClasses}
            checked={pack}
            onChange={(e) => setPack(e.target.checked)}
          />
          {t("packPieces")}
        </label>
      </section>

      {/* Line styles */}
      <div className={sectionTitleClasses}>
        <h1>{t("lineStyles")}</h1>
        <Button
          style={ButtonStyle.OUTLINE}
          className="!px-3 !py-1.5"
          onClick={onResetStyles}
        >
          {t("reset")}
        </Button>
      </div>
      <p className={`${hintClasses} px-2`}>{t("themeNote")}</p>

      <ul className="w-full flex flex-col">
        {dxfElements.map((element) => {
          const layer = layers[groupId(element)];
          const style = styles[element];
          const sized = sizedElements[element];
          const name = t(`elements.${element}`);
          return (
            <li
              key={element}
              className="w-full flex flex-col gap-1 px-2 py-2 border-b border-gray-200 dark:border-gray-700"
              data-test-id={`dxf-style-${element}`}
            >
              <div className="flex items-center gap-2 w-full">
                <input
                  id={`dxf-visible-${element}`}
                  type="checkbox"
                  className={checkboxClasses}
                  aria-label={t("visible", { element: name })}
                  checked={layer?.visible ?? false}
                  disabled={!layer}
                  onChange={() =>
                    dispatchLayerAction({
                      type: "toggle-layer",
                      key: groupId(element),
                    })
                  }
                />
                <label
                  htmlFor={`dxf-visible-${element}`}
                  className={`flex-1 truncate ${layer ? "" : "text-gray-400 dark:text-gray-600"}`}
                  title={layer ? undefined : t("notInFile")}
                >
                  {name}
                </label>
                <StylePreview element={element} style={style} theme={theme} />
                <input
                  type="color"
                  aria-label={`${name} ${t("color")}`}
                  className="w-8 h-8 p-0.5 shrink-0 bg-white dark:bg-black border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  value={style.color}
                  onChange={(e) =>
                    updateStyle(element, { color: e.target.value })
                  }
                />
              </div>
              {element !== DxfElement.Labels && (
                <div className="flex items-end gap-1">
                  <MmStepper
                    label={t("width")}
                    name={`dxf-width-${element}`}
                    value={style.width}
                    step={0.1}
                    min={0.05}
                    max={10}
                    onChange={(width) => updateStyle(element, { width })}
                  />
                  <InlineSelect
                    className="!items-start"
                    id={`dxf-dash-${element}`}
                    name={`dxf-dash-${element}`}
                    value={style.dash}
                    handleChange={(e) =>
                      updateStyle(element, {
                        dash: e.target.value as DashStyle,
                      })
                    }
                    options={Object.values(DashStyle).map((d) => ({
                      value: d,
                      label: t(`dash.${d}`),
                    }))}
                  />
                </div>
              )}
              {sized && (
                <div className="flex">
                  <MmStepper
                    label={t(
                      sized === "depth"
                        ? "depth"
                        : sized === "radius"
                          ? "radius"
                          : "textSize",
                    )}
                    name={`dxf-size-${element}`}
                    value={style.size ?? 0}
                    step={sized === "radius" ? 0.5 : 1}
                    min={0.5}
                    max={sized === "textSize" ? 100 : 30}
                    onChange={(size) => updateStyle(element, { size })}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </menu>
  );
}

/** Stepper for a millimetre value that lets the user type decimals freely. */
function MmStepper({
  label,
  name,
  value,
  step,
  min,
  max,
  onChange,
}: {
  label: string;
  name: string;
  value: number;
  step: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => {
    if (Number(text) !== value) setText(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <StepperInput
      inputClassName="w-12"
      label={label}
      name={name}
      value={text}
      step={step}
      handleChange={(e) => {
        const next = removeNonDigits(e.target.value, text);
        setText(next);
        const v = Number(next);
        if (next !== "" && Number.isFinite(v) && v >= min && v <= max) {
          onChange(v);
        }
      }}
      onStep={(delta) => {
        const v = clamp(Math.round((value + delta) * 100) / 100);
        setText(String(v));
        onChange(v);
      }}
    />
  );
}

/** Short sample of the line as it will be projected, including the theme's colour filter. */
function StylePreview({
  element,
  style,
  theme,
}: {
  element: DxfElement;
  style: ElementStyle;
  theme: Theme;
}) {
  return (
    <span
      className="shrink-0 bg-white rounded border border-gray-300 dark:border-gray-600"
      style={{ filter: themeFilter(theme) }}
      aria-hidden
    >
      <svg width="40" height="22" viewBox="0 0 40 22">
        {element === DxfElement.Labels ? (
          <text
            x="20"
            y="15"
            textAnchor="middle"
            fontSize="12"
            fontFamily="sans-serif"
            fill={style.color}
          >
            Aa
          </text>
        ) : (
          <line
            x1="4"
            y1="11"
            x2="36"
            y2="11"
            stroke={style.color}
            strokeWidth={Math.min(6, Math.max(0.75, style.width * 3))}
            strokeDasharray={dashArray(style.dash, style.width)}
            strokeLinecap="round"
          />
        )}
      </svg>
    </span>
  );
}
