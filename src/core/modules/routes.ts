import express from "express";
import path from "path";
import { StreamList } from "./stream_list";

export function redirect(req: express.Request, res: express.Response): void {
    res.redirect("/");
}

export function streams(streamList: StreamList | null): (req: express.Request, res: express.Response) => void {
    return (req: express.Request, res: express.Response): void => {
        const minimize = (req.query.minimize === "true" || req.query.minimize === "1")

        if (streamList) {
            res.json(minimize ? streamList.exportMinimized() : streamList.export());
        } else {
            res.status(404).json("Streams not found. Sorry.");
        }
    }
}

export function home(req: express.Request, res: express.Response): void {
    res.sendFile(path.resolve("./res/index.html"));
}
