"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from "next-intl";

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
      <select onChange={handleLanguageChange} value={locale} aria-label={ariaLabel}>
        <option value="de">{flags.de} {t("german")}</option>
        <option value="da">{flags.dk} {t("danish")}</option>
        <option value="nl">{flags.nl} {t("dutch")}</option>
        <option value="en">{flags.us} {t("english")}</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;
