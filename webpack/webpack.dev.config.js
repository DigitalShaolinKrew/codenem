const webpack = require( 'webpack' )
const path = require( 'path' )
const eslintFriendlyFormatter = require( 'eslint-friendly-formatter' )
const CopyWebpackPlugin = require( 'copy-webpack-plugin' )

module.exports = {
  cache: true,
  context: path.resolve( __dirname, '..' ),
  devtool: 'eval',
  entry: {
    app: [
      'gsap',
      './src/scripts/app.js'
    ]
  },
  output: {
    path: __dirname,
    publicPath: '/',
    filename: 'app.bundle.js',
    pathinfo: true
  },
  resolve: {
    modules: [
      path.resolve( __dirname, '..', 'src' ),
      'node_modules'
    ],
    extensions: [
      '.js',
      '.jsx',
      '.json'
    ]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        enforce: 'pre',
        use: [ {
          loader: 'eslint-loader',
          options: {
            parser: 'babel-eslint',
            formatter: eslintFriendlyFormatter
          }
        } ]
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          cacheDirectory: true
        }
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader'
          },
          {
            loader: 'sass-loader'
          }
        ]
      },
      {
        test: /node_modules/,
        loader: 'ify-loader'
      }
    ]
  },
  devServer: {
    contentBase: path.join( __dirname, 'static' ),
    compress: false,
    port: 3000,
    stats: 'verbose',
    historyApiFallback: true,
    host: '0.0.0.0'
  },
  plugins: [
    new webpack.ProvidePlugin( {
      'React': 'react',
      'ReactDOM': 'react-dom'
    } ),
    new CopyWebpackPlugin( [ { from: 'static' } ], { ignore: [ '.DS_Store', '.keep' ] } )
  ]
}
