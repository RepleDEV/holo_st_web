import express from "express";
import path from "path";
import compression from "compression";
import axios from "axios";

import * as routes from "./modules/routes";
import { StreamList } from "./modules/stream_list";
import { list_streams } from "./modules/list_streams";
import { init } from "./modules/listeners";
import startListeners from "./modules/listeners_V2";

const app = express();
app.use(compression());

const streamList = new StreamList();

const PORT = process.env.PORT || 9106;

function checkStreamsCallback() {
    // init(streamList);
    startListeners(streamList);
    console.log("Finished checking streams!");
    routes.setStreamList(streamList);
}

function checkStreamsProduction() {
    list_streams(streamList).then(checkStreamsCallback);
}
function checkStreamsDev() {
    axios
        .get("https://holo-st-dev.herokuapp.com/streams")
        .then(({ data }) => {
            streamList.importStreams(data);
            checkStreamsCallback();
        })
        .catch(() => {
            console.log(
                "Unable to reach hosted server. Checking using production method."
            );
            checkStreamsProduction();
        });
}

(async () => {
    console.log("Starting app.");

    console.log("Checking streams.");
    if (process.argv.includes("override")) {
        console.log("Override argument detected. Using production method.");
        checkStreamsProduction();
    } else if (process.env.NODE_ENV === "production") {
        checkStreamsProduction();
    } else {
        console.log("Development build detected. Using alternate method.");
        checkStreamsDev();
    }

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
