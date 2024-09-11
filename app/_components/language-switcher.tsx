"use client";

import { useRouter, usePathname } from "next/navigation";
import { DropdownIconButton } from "./buttons/dropdown-icon-button";
import LanguageIcon from "@/_icons/language-icon";

export default function LanguageSwitcher({ ariaLabel }: { ariaLabel: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.substr(1, 2);

  const handleLanguageChange = (value: string) => {
    router.push(value);
  };

  // Unicode escape sequences for flag emojis
  // Language names are not translated because we want them to be the same always, regardless of the current language.
  const locale_data = {
    da: { flag: "\uD83C\uDDE9\uD83C\uDDF0", name: "Dansk" }, // DK flag for Danish
    de: { flag: "\uD83C\uDDE9\uD83C\uDDEA", name: "Deutsch" }, // DE flag for German
    en: { flag: "\uD83C\uDDFA\uD83C\uDDF8", name: "English" }, // US flag for English
    es: { flag: "\uD83c\uDDEA\uD83C\uDDF8", name: "Español" }, // ES flag for Spanish
    fr: { flag: "\uD83C\uDDEB\uD83C\uDDF7", name: "Français" }, // FR flag for French,
    nl: { flag: "\uD83C\uDDF3\uD83C\uDDF1", name: "Nederlands" }, // NL flag for Dutch
    it: { flag: "\uD83C\uDDEE\uD83C\uDDF9", name: "Italiano" }, // IT flag for Italian
    cs: { flag: "\uD83C\uDDE8\uD83C\uDDF7", name: "Čeština" }, // CZ flag for Czech
    sv: { flag: "\uD83C\uDDF8\uD83C\uDDEA", name: "Svenska" }, // SE flag for Swedish
  };

  return (
    <DropdownIconButton
      dropdownClassName="w-[160px] right-0 p-0"
      description={ariaLabel}
      icon={<LanguageIcon ariaLabel={ariaLabel} />}
      options={Object.entries(locale_data).map(([key, { flag, name }]) => ({
        value: key,
        text: flag + " " + name,
      }))}
      setSelection={handleLanguageChange}
      selection={locale}
    />
  );
}
