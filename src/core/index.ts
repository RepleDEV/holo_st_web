import express from "express";
import path from "path";

import * as holo_st from "./modules/holo_st/";
import * as callbacks from "./modules/callbacks";

import { Cache } from "./modules/cache";
import { MinimizedOngoingStream, MinimizedStreamCache, MinimizedUpcomingStream, StreamCache } from "./globals";
import { OngoingStream, UpcomingStream } from "./modules/holo_st/globals";

const app = express();
const PORT = 9106;

async function cache_streams(cache: Cache): Promise<void> {
    console.log("Checking for ongoing streams...");
    const ongoing_streams = await holo_st.get_all_ongoing_streams((s, i) => {
        console.log(`Checked ${i + 1}`);
    });
    console.log("Finished checking for ongoing streams.")

    console.log("Checking for upcoming streams...");
    const upcoming_streams = await holo_st.get_all_upcoming_streams((s, i) => {
        console.log(`Checked ${i + 1}`);
    });
    console.log("Finished checking for upcoming streams.");

    const streamCache: StreamCache = {
        ongoingStreams: ongoing_streams,
        upcomingStreams: upcoming_streams,
        writtenAt: Date.now()
    };

    console.log("Writing stream cache.");
    await cache.writeFile("streamcache.json", JSON.stringify(streamCache));
    console.log("Finished writing stream cache.");

    console.log("Creating minimized version");

    const minimizedStreamCache: MinimizedStreamCache = {
        ongoingStreams: streamCache.ongoingStreams.map<MinimizedOngoingStream>((x) => {
            const res: MinimizedOngoingStream = {
                streamId: x.streamId,
                
                title: x.title,
                thumbnail: x.thumbnail,

                channelName: x.channelName,
                channelId: x.channelId,

                scheduledStartTime: x.scheduledStartTime,
                
                actualStartTime: x.actualStartTime,
                concurrentViewers: x.concurrentViewers
            }
            return res;
        }),
        upcomingStreams: streamCache.upcomingStreams.map<MinimizedUpcomingStream>((x) => {
            const res: MinimizedUpcomingStream = {
                streamId: x.streamId,
                
                title: x.title,
                thumbnail: x.thumbnail,

                channelName: x.channelName,
                channelId: x.channelId,

                scheduledStartTime: x.scheduledStartTime,
            };

            return res;
        }),
        writtenAt: Date.now()
    };
    console.log("Writing minimized stream cache.");
    await cache.writeFile("minimizedstreamcache.json", JSON.stringify(minimizedStreamCache));
    console.log("Finished writing minimized stream cache.");
};

(async () => {
    console.log("Starting server.");
    console.log("Caching streams...")

    const cache = new Cache();
    // TODO: Comment when testing. Skip waiting 2-5 minutes just to cache streams.
    // await cache_streams(cache);
    console.log("Finished caching streams.");

    app.use("/public", express.static(path.resolve("./public")));
    app.get("/", callbacks.home);
    app.get("/streams", callbacks.streams(cache));


    console.log("Starting server.");
    app.listen(PORT, () => {
        console.log("App Started!");
    });
})()
