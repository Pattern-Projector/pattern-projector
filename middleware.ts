import createMiddleware from "next-intl/middleware";

export const locales = ["en", "de", "da", "nl", "fr", "es", "it", "cs"];

export default createMiddleware({
  // A list of all locales that are supported
  locales: locales,

  // Used when no locale matches
  defaultLocale: "en",
});

export const config = {
  // Match only internationalized pathnames
  // Match /calibrate for people who saved a link to /calibrate before internationalization was added
  matcher: ["/", "/(da|de|en|nl|fr|es|it|cs)/:path*", "/calibrate"],
};
