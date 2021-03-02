const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        "server": path.join(__dirname, 'src', 'main', 'index.tsx')
    },
    output: {
        path: path.join(__dirname, 'target', 'classes', 'com', 'almworks', 'dyoma', 'crm',
            'jsreports', 'js'),
        filename: '[name].js'
    },
    externals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        'babel__core': 'Babel',
        'react-bootstrap': 'ReactBootstrap',
        'react-table': 'ReactTable',
        'axios': 'axios',
        'react-router-dom': 'ReactRouterDOM',
        'lodash': '_',
        'redux': 'Redux',
        'react-redux': 'ReactRedux',
        '@reduxjs/toolkit': 'RTK'
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)?$/,
                loader: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.css-resource$/,
                use: [
                    'raw-loader'
                ]
            },
            {
                test: /\.svg$/,
                use: 'url-loader'
            },
            {
                test: /\.png$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            mimetype: 'image/png'
                        }
                    }
                ]
            },
            {
                test: /\.ttf$/,
                use: ['file-loader']
            },
        ]
    },
    resolve: {
        extensions: [
            '.tsx',
            '.ts',
            '.js'
        ]
    },
    plugins: [
        new CopyPlugin([
            {from: './src/main/index.html', to: '../'},
            {from: './src/main/alm-crm.css', to: '../resources'}
        ]),
    ]
};
