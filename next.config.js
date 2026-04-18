const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ignore pptxgenjs in browser bundle - it requires node: modules
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^pptxgenjs$/,
        })
      );

      // Suppress UnhandledSchemeError for node: protocol
      config.ignoreWarnings = (config.ignoreWarnings || []).concat([
        (warning) => {
          if (warning.message?.includes('UnhandledSchemeError') ||
              warning.message?.includes('node:')) {
            return true;
          }
          return false;
        },
      ]);
    }
    return config;
  },
};

module.exports = nextConfig;
