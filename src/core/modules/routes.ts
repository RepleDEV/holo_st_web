import express from "express";
import path from "path";
import Client from "./tcp/client";

export function redirect(req: express.Request, res: express.Response): void {
    res.redirect("/");
}

export function streams(client: Client): (req: express.Request, res: express.Response) => void {
    return (req: express.Request, res: express.Response): void => {
        const minimize = (req.query.minimize === "true" || req.query.minimize === "1")

        if (client.streamList) {
            res.json(minimize ? client.streamList.exportMinimized() : client.streamList.export());
        } else {
            res.status(404).json("Streams not found. Sorry.");
        }
    }
}

export function home(req: express.Request, res: express.Response): void {
    res.sendFile(path.resolve("./res/index.html"));
}
