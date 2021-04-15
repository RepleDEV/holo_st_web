import express from "express";
import path from "path";
import compression from "compression";

import * as routes from "./modules/routes";
import Client from "./modules/tcp/client";

const app = express();
app.use(compression())

const client = new Client();

const PORT = process.env.PORT || 9106;

(async () => {
    console.log("Starting app.");
    console.log("Connecting to server");
    await client.connect({ retryDelay: 250, maxRetries: -1 });
    console.log("Connected to server");

    // Routes
    app.use("/public", express.static(path.resolve("./public")));
    app.get("/", routes.home);
    app.get("/streams", routes.streams(client));

    // 404 redirect.
    app.use(routes.redirect); //! DO NOT MOVE

    app.listen(PORT, () => {
        console.log("App Started!");
    });
})();
