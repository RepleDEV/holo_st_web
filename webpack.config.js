const path = require("path");

const rootPath = path.resolve();

function config_factory(target, port) {
    const BROWSER = {
        entry: path.join(rootPath, "./src/app/index.ts"),
        output: {
            filename: "webpack.js",
            path: path.join(rootPath, "./public/webpack")
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
                    use: ["style-loader", "css-loader", "sass-loader"]
                },
                {
                    test: /\.ts$/,
                    use: ["ts-loader"]
                },
            ],
        },
    };
    
    const SERVER = {
        entry: path.join(rootPath, "./src/core/index.ts"),
        output: {
            filename: "server.js",
            path: path.join(rootPath, "./out/")
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
                    use: ["ts-loader"]
                },
            ],
        },
        externals: [require("webpack-node-externals")()]
    };

    if (target === "BROWSER") {
        return BROWSER;
    } else if (target === "SERVER") {
        return SERVER;
    } else {
        return [BROWSER, SERVER];
    }
}

function webpack_config(env) {
    env = env || {};

    return config_factory(env.TARGET, env.PORT || 9107)
}

module.exports = webpack_config;