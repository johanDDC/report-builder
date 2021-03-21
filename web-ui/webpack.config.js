const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        "server": path.join(__dirname, 'src', 'main', 'index.tsx'),
        "worker.execution": path.join(__dirname, 'src', 'main', 'worker.js')
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
        '@reduxjs/toolkit': 'RTK',
        '@monaco-editor/loader': 'monaco_loader',
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)?$/,
                loader: 'ts-loader',
                exclude: /node_modules/
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
