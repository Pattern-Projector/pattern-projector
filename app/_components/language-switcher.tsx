"use client";

import { useRouter, usePathname } from "next/navigation";
import { DropdownIconButton } from "./buttons/dropdown-icon-button";
import LanguageIcon from "@/_icons/language-icon";
import { localeData } from "middleware";

export default function LanguageSwitcher({ ariaLabel }: { ariaLabel: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.substr(1, 2);

  const handleLanguageChange = (value: string) => {
    router.push(value);
  };

  return (
    <DropdownIconButton
      dropdownClassName="right-0 w-fill z-50"
      description={ariaLabel}
      icon={<LanguageIcon ariaLabel={ariaLabel} />}
      options={Object.entries(localeData)
        .sort()
        .map(([locale, language]) => ({
          value: locale,
          text: language,
        }))}
      setSelection={handleLanguageChange}
      selection={locale}
    />
  );
}
