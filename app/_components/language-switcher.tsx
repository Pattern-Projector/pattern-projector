"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from "next-intl";
import InlineSelect from "@/_components/inline-select";

interface LanguageSwitcherProps {
  ariaLabel?: string;
  className?: string; 
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ ariaLabel, className }) => {
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.substr(1, 2)
  const t = useTranslations("HomePage");

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(e.target.value)
  };

  // Unicode escape sequences for flag emojis
  const flags = {
    de: '\uD83C\uDDE9\uD83C\uDDEA', // DE flag for German
    dk: '\uD83C\uDDE9\uD83C\uDDF0', // DK flag for Danish
    nl: '\uD83C\uDDF3\uD83C\uDDF1',  // NL flag for Dutch
    us: '\uD83C\uDDFA\uD83C\uDDF8'  // US flag for English
  };

  return (
    <div className={className}>
      <InlineSelect
        handleChange={(e) => handleLanguageChange(e)}
        id="change_language"
        name="change_language"
        value={locale}
        options={[
          { value: "de", label: t("german") },
          { value: "da", label: t("danish") },
          { value: "nl", label: t("dutch") },
          { value: "en", label: t("english") },
        ]}
      />
    </div>
  );
};

export default LanguageSwitcher;
