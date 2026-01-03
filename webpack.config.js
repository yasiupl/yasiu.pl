const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');
const WorkboxPlugin = require('workbox-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
    entry: ['./src/app.js', './src/style.scss'],
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        clean: true
    },
    devServer: {
        static: path.join(__dirname, 'dist'),
        compress: true,
        port: 8080
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "src/static", to: "" },
            ],
        }),
        new MiniCssExtractPlugin({
            filename: 'style.css'
        }),
        new HtmlWebpackPlugin({
            hash: true,
            title: 'yasiu.pl',
            template: './src/index.html',
            filename: './index.html',
            favicon: './src/favicon.ico'
        }),
        new WebpackPwaManifest({
            fingerprints: false,
            name: 'yasiu.pl',
            short_name: 'yasiu.pl',
            description: 'yasiu.pl homepage',
            background_color: '#FF4F00',
            theme_color: '#FF4F00',
            start_url: '/?utm_source=a2hs',
            display: 'standalone',
            ios: {
                'apple-mobile-web-app-status-bar-style': 'black'
            },
            icons: [{
                    src: path.resolve('src/static/assets/icon.png'),
                    destination: './icons/',
                    sizes: [96, 128, 192, 256, 384, 512],
                    ios: true
                },
                {
                    src: path.resolve('src/static/assets/icon.png'),
                    destination: './icons/',
                    size: 512,
                    ios: 'startup'
                }
            ]
        }),
        new WorkboxPlugin.GenerateSW({
            runtimeCaching: [{
                urlPattern: /.*/,
                handler: 'StaleWhileRevalidate',}]
          })
    ],
    module: {
        rules: [{
                test: /\.s[ac]ss$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader',
                ],
            },
            {
                test: /\.(jpe?g|gif|png|svg|woff|ttf|wav|mp3)$/,
                type: 'asset/resource'
            }
        ]
    }
}
