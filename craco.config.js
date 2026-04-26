const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Fix "node:" URI scheme (used by packages like docx, pptxgenjs)
      webpackConfig.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, '');
        })
      );

      // Polyfill fallbacks for Node built-ins used by browser-incompatible packages
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        fs: false,
        https: false,
        http: false,
        path: false,
        stream: false,
        crypto: false,
        buffer: false,
        os: false,
        url: false,
        assert: false,
        util: false,
        zlib: false,
      };

      // Ensure .ts and .tsx are in resolve extensions
      const ext = webpackConfig.resolve.extensions || [];
      if (!ext.includes('.ts')) ext.unshift('.ts');
      if (!ext.includes('.tsx')) ext.unshift('.tsx');
      webpackConfig.resolve.extensions = ext;

      // Disable code splitting in dev to prevent stale-chunk errors
      if (process.env.NODE_ENV === 'development') {
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: false,
          runtimeChunk: false,
        };
      }

      return webpackConfig;
    },
  },
};
