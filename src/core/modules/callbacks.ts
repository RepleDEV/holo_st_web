import express from "express";
import path from "path";

import { Cache } from "./cache";
import { StreamCache } from "../globals.d";
import { OngoingStream, UpcomingStream } from "./holo_st/globals";

export function streams(cache: Cache): (req: express.Request, res: express.Response) => void {
    return function(req: express.Request, res: express.Response): void {
        if (req.query.minimize === "true") {
            if (cache) {
                cache.readFile("minimizedstreamcache.json").then((data) => {
                    console.log("YES");
                    res.json(JSON.parse(data));
                });
            }
        } else {
            res.sendFile(path.resolve("./cache/streamcache.json"));
        }
    }
}

export function home(req: express.Request, res: express.Response): void {
    res.sendFile(path.resolve("./res/index.html"));
}