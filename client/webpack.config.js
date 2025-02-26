const HtmlWebpackPlugin = require("html-webpack-plugin");
const WebpackPwaManifest = require("webpack-pwa-manifest");
const path = require("path");
const webpack = require("webpack"); // Add webpack for DefinePlugin

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
      clean: true, // Cleans 'dist' folder before rebuilding
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
      // Copy src-sw.js to output directory
      {
        apply: (compiler) => {
          compiler.hooks.afterEmit.tap("CopyServiceWorker", (compilation) => {
            // Copy service worker file to dist
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
          aggregateTimeout: 200, // Wait 200ms before triggering a rebuild
          poll: 1000, // Poll every 1 second instead of continuous watching
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
