/**
 * Created by Administrator on 2017/2/17 0017.
 */
var webpack = require('webpack');

var webpackConfig = {
    plugins: [
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoErrorsPlugin()
    ],
    entry: {
        'index': [
            // For old browsers
            'eventsource-polyfill',
            'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000',
            './test/index.jsx']
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                loader: 'babel'
            }
        ],
    },
    output: {
        publicPath: '/',
        path: '/',
        name: "index.js"
    }
}

module.exports = webpackConfig;