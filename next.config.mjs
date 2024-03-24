import withSerwistInit from "@serwist/next";
import createNextIntlPlugin from 'next-intl/plugin';
      
const withSerwist = withSerwistInit({
    swSrc: "app/sw.ts",
    swDest: "public/sw.js",
    cacheOnFrontEndNav: true,
});
 
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    
    return config;
  }
}

export default withNextIntl(withSerwist(nextConfig))
