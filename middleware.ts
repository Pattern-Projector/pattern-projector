import createMiddleware from "next-intl/middleware";

// Language names are not translated because we want them to be the same always, regardless of the current language.
// *** IMPORTANT *** Add  new languages to the localeData and matcher in the config below
export const localeData = {
  cs: "Čeština",
  da: "Dansk",
  de: "Deutsch",
  en: "English",
  es: "Español",
  fi: "Suomi",
  fr: "Français",
  hu: "Magyar",
  it: "Italiano",
  "nb-NO": "Norwegian Bokmål", // Needs to be in format nb-NO instead of nb_NO for next-intl to recognize it
  nl: "Nederlands",
  "pt-BR": "Português (Brasil)",
  sl: "Slovenščina",
  sv: "Svenska",
  ta: "தமிழ்",
  "zh-Hans": "简体中文",
};

export const locales = Object.keys(localeData);

export default createMiddleware({
  // A list of all locales that are supported
  locales: locales,

  // Used when no locale matches
  defaultLocale: "en",
});

export const config = {
  // Match only internationalized pathnames
  // Match /calibrate for people who saved a link to /calibrate before internationalization was added
  // *** IMPORTANT *** New language codes must be added here as well as in the localeData above
  matcher: [
    "/",
    "/(cs|da|de|en|es|fi|fr|hu|it|nb-NO|nl|pt-BR|sl|sv|ta|zh-Hans)/:path*",
    "/calibrate",
  ],
};
