import express from "express";
import path from "path";
import { StreamList } from "./stream_list";

let streamList: StreamList | null = null;

export function setStreamList(streamList_: StreamList): void {
    streamList = streamList_;
}

export function redirect(req: express.Request, res: express.Response): void {
    res.redirect("/");
}

export function streams(req: express.Request, res: express.Response): void {
    const minimize =
        req.query.minimize === "true" || req.query.minimize === "1";
    const specificId = (req.query.id || "").toString();

    if (streamList) {
        if (specificId) {
            const upcomingStream = streamList.getUpcomingStream(specificId);
            // The && is for: if upcomingStream is NOT undefined (found the stream already)
            // loop through the ongoingStreams array
            const ongoingStream = upcomingStream && streamList.getOngoingStream(specificId);

            if (upcomingStream) {
                res.json(minimize ? StreamList.minimizeUpcomingStream(upcomingStream) : upcomingStream);
            } else if (ongoingStream) {
                res.json(minimize ? StreamList.minimizeOngoingStream(ongoingStream) : ongoingStream);
            } else {
                res.status(404).json("Streams not found. Sorry.");        
            }
        } else {
            res.json(minimize ? streamList.exportMinimized() : streamList.export());
        }
    } else {
        res.status(404).json("Streams not found. Sorry.");
    }
}

export function home(req: express.Request, res: express.Response): void {
    res.sendFile(path.resolve("./res/index.html"));
}
