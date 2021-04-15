const path = require('path');

module.exports = {
    entry: {
        "lib": {
            import: path.join(__dirname, 'index.ts'),
            library: {
                name: "LibWorker",
                type: 'umd'
            }
        }
    },
    output: {},
    module: {
        rules: [
            {
                test: /\.(ts)?$/,
                loader: 'ts-loader',
                exclude: /node_modules/
            },
        ]
    },
    resolve: {
        extensions: [
            '.ts',
            '.js'
        ]
    },
};
