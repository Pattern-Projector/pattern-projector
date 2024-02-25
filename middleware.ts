import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'de', 'da'],
 
  // Used when no locale matches
  defaultLocale: 'en'
});
 
export const config = {
  // Match only internationalized pathnames
  // Match /calibrate for people who saved a link to /calibrate before internationalization was added
  matcher: ['/', '/(de|en|da)/:path*', '/calibrate']
};