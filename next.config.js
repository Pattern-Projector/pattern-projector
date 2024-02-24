const withPWA = require('next-pwa')({
  dest: 'public'
})
const createNextIntlPlugin = require('next-intl/plugin');
 
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    
    return config;
  }
}

module.exports = withPWA(withNextIntl(nextConfig))
