import express from "express";
import path from "path";

import * as callbacks from "./modules/callbacks";
import { StreamList } from "./modules/stream_list";
import { list_streams } from "./modules/cache_streams";

const app = express();
const PORT = 9106;

const streamList = new StreamList();

(async () => {
    console.log("Starting server.");
    console.log("Caching streams...")

    // This takes... A few minutes :D
    await list_streams(streamList);
    console.log("Finished caching streams.");

    app.use("/public", express.static(path.resolve("./public")));
    app.get("/", callbacks.home);
    app.get("/streams", callbacks.streams(streamList));

    // 404 redirect. ALWAYS KEEP THIS AT THE BACK. (things will go wrong~)
    app.use(callbacks.redirect);

    console.log("Starting server.");
    app.listen(PORT, () => {
        console.log("App Started!");
    });
})();
