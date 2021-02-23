import express from "express";
import path from "path";

import * as callbacks from "./modules/callbacks";
import { StreamList } from "./modules/stream_list";
import { list_streams } from "./modules/list_streams";
import { Streams } from "./globals";
import { init } from "./modules/listeners"

import { promises as fs } from "fs";

const app = express();
const PORT = 9106;

const streamList = new StreamList();

(async () => {
    console.log("Caching streams...");

    // Dev purposes only
    // const streamListImport: Streams = JSON.parse(
    //     await fs.readFile(path.resolve("./dev/streamlist.min.json"), {
    //         encoding: "utf-8",
    //     })
    // );
    // streamList.importStreams(streamListImport);
    await list_streams(streamList); // It is not recommended to remove this line thanks <3
    console.log("Finished caching streams.");

    console.log("Initializing listeners.");
    init(streamList);
    console.log("Finished initializing listeners");

    // Routes
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
