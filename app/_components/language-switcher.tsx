"use client";

import { useRouter, usePathname } from 'next/navigation';
import InlineSelect from "@/_components/inline-select";

interface LanguageSwitcherProps {
  ariaLabel?: string;
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ ariaLabel, className }) => {
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.substr(1, 2)

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(e.target.value)
  };

  // Unicode escape sequences for flag emojis
  // Language names are not translated because we want them to be the same always, regardless of the current language.
  const locale_data = {
    'de': { 'flag': '\uD83C\uDDE9\uD83C\uDDEA', 'name': "Deutsch" },  // DE flag for German
    'da': { 'flag': '\uD83C\uDDE9\uD83C\uDDF0', 'name': "Danish" },  // DK flag for Danish
    'nl': { 'flag': '\uD83C\uDDF3\uD83C\uDDF1', 'name': "Nederlands" },  // NL flag for Dutch
    'en': { 'flag': '\uD83C\uDDFA\uD83C\uDDF8', 'name': "English" }  // US flag for English
  };

  return (
    <div className={className}>
      <InlineSelect
        handleChange={(e) => handleLanguageChange(e)}
        id="change_language"
        name="change_language"
        value={locale}
        options={Object.entries(locale_data).map(([key, {flag, name}]) => ({
          value: key,
          label: flag + " " + name
        }))}
      />
    </div>
  );
};

export default LanguageSwitcher;
