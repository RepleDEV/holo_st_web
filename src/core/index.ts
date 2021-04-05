import express from "express";
import path from "path";
import puppeteer from "puppeteer";

import * as routes from "./modules/routes";
import { StreamList } from "./modules/stream_list";
import { list_streams } from "./modules/list_streams";
import { init } from "./modules/listeners";
import { get_html } from "./modules/holo_st/modules/get_html";

const app = express();
const PORT = process.env.PORT || 9106;

const streamList = new StreamList();

(async () => {
    console.log("Starting server.");
    app.listen(PORT, () => {
        console.log("App Started!");
    });

    console.log("Caching streams...");

    await list_streams(streamList);
    console.log("Finished caching streams.");

    console.log("Initializing listeners.");
    init(streamList);
    console.log("Finished initializing listeners");

    // Routes
    app.use("/public", express.static(path.resolve("./public")));
    app.get("/", routes.home);
    app.get("/streams", routes.streams(streamList));

    // 404 redirect. ALWAYS KEEP THIS AT THE BACK. (things will go wrong~)
    app.use(routes.redirect);
})();
