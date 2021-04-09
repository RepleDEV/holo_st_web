import { init } from "./modules/listeners";
import { list_streams } from "./modules/list_streams";
import { StreamList } from "./modules/stream_list";

import express from "express";

const streamList = new StreamList();
const app = express();

let finished = false;

(async () => {
    app.get("/", (req, res) => {
        if (!finished) {
            return res.send("404. Data has not been initialized. Try again later").status(404);
        }

        if (req.query.minimize === "true" || req.query.minimize === "1") {
            res.json(streamList.exportMinimized());
        } else {
            res.json(streamList.export());
        }
    });

    app.listen(9107);

    await list_streams(streamList);
    init(streamList);
    finished = true;
})();