import express from "express";
import path from "path";
import compression from "compression";

import * as routes from "./modules/routes";
import { StreamList } from "./modules/stream_list";
import { list_streams } from "./modules/list_streams";
import { init } from "./modules/listeners";

const app = express();
app.use(compression())

let streamList: StreamList | null = null;

const PORT = process.env.PORT || 9106;

(async () => {
    console.log("Starting app.");

    console.log("Checking streams.");
    list_streams(streamList || undefined).then((streams) => {
        streamList = new StreamList();
        streamList.importStreams(streams);
        init(streamList);
        console.log("Finished checking streams!");
        routes.setStreamList(streamList);
    });

    // Routes
    app.use("/public", express.static(path.resolve("./public")));
    app.get("/", routes.home);
    app.get("/streams", routes.streams);

    // 404 redirect.
    app.use(routes.redirect); //! DO NOT MOVE

    app.listen(PORT, () => {
        console.log("App Started!");
    });
})();
