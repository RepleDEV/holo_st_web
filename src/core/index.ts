import express from "express";
import path from "path";
import compression from "compression";

import * as routes from "./modules/routes";

const app = express();
app.use(compression())

const PORT = process.env.PORT || 9106;

(async () => {
    console.log("Starting app.");

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
