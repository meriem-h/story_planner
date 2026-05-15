const rules = require('./webpack.rules');

rules.push({
  test: /\.css$/,
  use: [
    { loader: 'style-loader' },
    { loader: 'css-loader' },
    { loader: 'postcss-loader' },
  ],
});

rules.push({
  test: /\.jsx?$/,
  use: {
    loader: 'babel-loader',
    options: {
      presets: ['@babel/preset-react'],
    },
  },
  exclude: /node_modules/,
});

module.exports = {
  entry: './src/renderer.jsx',
  module: {
    rules,
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
};