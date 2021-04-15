const path = require('path');

module.exports = {
    entry: {
        "lib": {
            import: path.join(__dirname, 'index.ts'),
            // import: "../src/main/editor/basic-editor.tsx",
            library: {
                name: "LibWorker",
                type: 'umd'
            }
        }
    },
    output: {
        // path: path.join(__dirname, 'target', 'classes', 'com', 'almworks', 'dyoma', 'crm',
        //     'jsreports', 'js'),
        // filename: '[name].js'
    },
    externals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        'axios': 'axios',
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
};
