const webpack = require("webpack");

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      return {
        ...webpackConfig,
        entry: {
          main: [
            env === "development" &&
              require.resolve("react-dev-utils/webpackHotDevClient"),
            paths.appIndexJs,
          ].filter(Boolean),
          background: "./src/background.js",
          content: "./src/content.js",
          page: "./src/page.js",
          notification: "./src/notification.js",
        },
        output: {
          ...webpackConfig.output,
          filename: "[name].js",
        },
        optimization: {
          ...webpackConfig.optimization,
          runtimeChunk: false,
        },
        resolve: {
          ...webpackConfig.resolve,
          fallback: {
            stream: require.resolve("stream-browserify"),
          },
        },
        plugins: [
          ...webpackConfig.plugins,
          new webpack.ProvidePlugin({
            process: "process/browser.js",
          }),
        ],
      };
    },
  },
};
