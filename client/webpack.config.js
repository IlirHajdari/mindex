const HtmlWebpackPlugin = require("html-webpack-plugin");
const WebpackPwaManifest = require("webpack-pwa-manifest");
const path = require("path");
const webpack = require("webpack");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    mode: isProduction ? "production" : "development",
    entry: {
      main: "./src/js/index.js",
      install: "./src/js/install.js",
      app: "./src/js/app.js",
    },
    output: {
      filename: "[name].bundle.js",
      path: path.resolve(__dirname, "dist"),
      publicPath: "/",
      clean: true,
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify(
          isProduction ? "production" : "development"
        ),
      }),
      new HtmlWebpackPlugin({
        template: "./index.html",
        title: "Mini Index PWA",
        favicon: "./src/images/logo.png",
      }),
      new WebpackPwaManifest({
        fingerprints: false,
        inject: true,
        name: "Mini Index",
        short_name: "MiniIndex",
        description: "A file and email indexing PWA!",
        background_color: "#1c1c1c",
        theme_color: "#007acc",
        start_url: "/",
        publicPath: "/",
        icons: [
          {
            src: path.resolve("src/images/logo.png"),
            sizes: [96, 128, 192, 256, 384, 512],
            destination: path.join("assets", "icons"),
          },
        ],
        includeDirectory: true,
      }),
      {
        apply: (compiler) => {
          compiler.hooks.afterEmit.tap("CopyServiceWorker", (compilation) => {
            require("fs").copyFileSync(
              path.resolve(__dirname, "src-sw.js"),
              path.resolve(__dirname, "dist", "src-sw.js")
            );
          });
        },
      },
    ],
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.m?js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"],
            },
          },
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: "asset/resource",
        },
        // ✅ Fix for PDF.js Web Worker
        {
          test: /pdf\.worker\.(mjs|js)$/,
          type: "asset/resource",
          generator: {
            filename: "pdf.worker.js", // Ensure Webpack outputs the worker as a separate file
          },
        },
      ],
    },
    devServer: {
      static: {
        directory: path.join(__dirname, "./"),
      },
      compress: true,
      port: 3001,
      open: true,
      hot: false,
      liveReload: false,
      historyApiFallback: true,
      watchFiles: {
        options: {
          aggregateTimeout: 200,
          poll: 1000,
        },
      },
      client: {
        logging: "warn",
        overlay: false,
      },
    },
    devtool: isProduction ? false : "source-map",
    performance: {
      hints: isProduction ? "warning" : false,
    },
    resolve: {
      extensions: [".js", ".json"],
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
};
