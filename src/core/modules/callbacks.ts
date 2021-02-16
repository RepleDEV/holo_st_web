import express from "express";
import path from "path";

import { Cache } from "./cache";

export function redirect(req: express.Request, res: express.Response): void {
    res.redirect("/");
}

export function streams(cache: Cache): (req: express.Request, res: express.Response) => void {
    return function(req: express.Request, res: express.Response): void {
        if (req.query.minimize === "true" || req.query.minimize === "1") {
            cache.readFile("minimizedstreamcache.json").then((data) => {
                res.json(JSON.parse(data));
            });
        } else {
            res.sendFile(path.resolve("./cache/streamcache.json"));
        }
    }
}

export function home(req: express.Request, res: express.Response): void {
    res.sendFile(path.resolve("./res/index.html"));
}