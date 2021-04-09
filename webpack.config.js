const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const path = require("path");
const rootPath = path.resolve();

function config_factory(target) {
    const BROWSER = {
        entry: path.join(rootPath, "./src/app/index.ts"),
        output: {
            filename: "webpack.js",
            path: path.join(rootPath, "./public/webpack"),
        },
        resolve: {
            extensions: [".ts", ".js"],
            mainFields: ["main", "module", "browser"],
        },
        target: "web",
        module: {
            rules: [
                {
                    test: /\.scss$/,
                    use: [
                        process.env.NODE_ENV === "production" ? MiniCssExtractPlugin.loader : "style-loader",
                        "css-loader", 
                        "sass-loader"
                    ],
                },
                {
                    test: /\.ts$/,
                    use: ["ts-loader"],
                },
            ],
        },
        plugins: [new MiniCssExtractPlugin({
            filename: "[name].css"
        })]
    };

    const WEBPROCESS = {
        entry: path.join(rootPath, "./src/core/index.ts"),
        output: {
            filename: "webprocess.js",
            path: path.join(rootPath, "./out/"),
        },
        resolve: {
            extensions: [".ts", ".js"],
            mainFields: ["main", "module", "browser"],
        },
        target: "node",
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: ["ts-loader"],
                },
            ],
        },
        externals: [
            require("webpack-node-externals")({ allowlist: ["jquery", "fs"] }),
        ],
    };

    const WORKER = {
        entry: path.join(rootPath, "./src/core/worker.ts"),
        output: {
            filename: "worker.js",
            path: path.join(rootPath, "./out/"),
        },
        resolve: {
            extensions: [".ts", ".js"],
            mainFields: ["main", "module", "browser"],
        },
        target: "node",
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: ["ts-loader"],
                },
            ],
        },
        externals: [
            require("webpack-node-externals")({ allowlist: ["jquery", "fs"] }),
        ],
    }

    if (target === "BROWSER") {
        return BROWSER;
    } else if (target === "WEBPROCESS") {
        return WEBPROCESS;
    } else if (target === "WORKER") {
        return WORKER;
    } else {
        return [BROWSER, WEBPROCESS, WORKER];
    }
}

function webpack_config(env) {
    env = env || {};

    return config_factory(env.TARGET);
}

module.exports = webpack_config;
