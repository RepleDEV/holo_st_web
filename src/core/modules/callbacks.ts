import express from "express";
import path from "path";
import { StreamList } from "./stream_list";

export function redirect(req: express.Request, res: express.Response): void {
    res.redirect("/");
}

export function streams(cache: StreamList): (req: express.Request, res: express.Response) => void {
    return function(req: express.Request, res: express.Response): void {
        if (req.query.minimize === "true" || req.query.minimize === "1") {
            res.json(cache.exportMinimized());
        } else {
            res.json(cache.export());
        }
    }
}

export function home(req: express.Request, res: express.Response): void {
    res.sendFile(path.resolve("./res/index.html"));
}