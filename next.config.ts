import type { NextConfig } from "next";
import type { Configuration as WebpackConfig } from "webpack";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  webpack: (config: WebpackConfig) => {
    // Ignore the node-pre-gyp HTML file
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /node-pre-gyp[/\\]lib[/\\]util[/\\]nw-pre-gyp[/\\]index\.html$/,
      use: 'ignore-loader',
    });
    
    return config;
  },
};

export default nextConfig;
