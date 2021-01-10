const path = require("path");

module.exports = {
  entry: { main: path.resolve(__dirname, "client", "main.js") },
  output: {
    path: path.resolve(__dirname, "public", "js"),
  },
  mode: "production",
  devtool: "source-map",
  module: {
    rules: [
      {
        loader: "babel-loader",
        test: /\.js$/,
        exclude: /node_modules/,
      },
      {
        loader: "worker-loader",
        test: /workers\/.+?\.js$/,
      },
    ],
  },
};
