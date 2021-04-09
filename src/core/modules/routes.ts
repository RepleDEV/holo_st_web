import express from "express";
import path from "path";
import axios from "axios";

export function redirect(req: express.Request, res: express.Response): void {
    res.redirect("/");
}

export function streams(req: express.Request, res: express.Response): void {
    const minimize = (req.query.minimize === "true" || req.query.minimize === "1")
    // Shorthand for: if minimize, add "minimize" to the parameters.
    axios.get("http://localhost:9107", minimize ? { params: { minimize: 1 }} : undefined)
        .then(({data}) => res.json(data))
        .catch((err) => {
            res.send("Worker has not started yet!").status(404);
        });
}

export function home(req: express.Request, res: express.Response): void {
    res.sendFile(path.resolve("./res/index.html"));
}
