import logUpdate from "log-update";

import * as holo_st from "./holo_st";

import { StreamList } from "./stream_list";
import { Streams } from "../globals";
import moment from "moment";

export async function list_streams(streamList: StreamList): Promise<Streams> {
    const streams = streamList.exportMinimized();

    let t = Date.now();

    let filter: string[] = [];

    if (!streams.ongoingStreams.length || !streams.upcomingStreams.length) {
        console.log("Checking for ongoing streams...");

        const ongoingStreams = await holo_st.get_all_ongoing_streams(filter, (s, i) => {
            logUpdate(`Checked ${i + 1}.`);
        });
        ongoingStreams.forEach((x) => streamList.addOngoingStream(x));

        logUpdate.done();
        console.log(`Finished checking for ongoing streams. Time to finish: ${Date.now() - t}ms.`);
    }
    console.log("Checking for upcoming streams...");

    // Refresh time & filter
    t = Date.now();
    filter = [];

    // If an upcoming stream is starting in less than 1 hour, filter that channel.
    for (let i = 0;i < streams.upcomingStreams.length;i++) {
        const upcomingStream = streams.upcomingStreams[i];
        
        const oneHour = 1000 * 60 * 60;
        if (Date.now() - +moment(upcomingStream.scheduledStartTime) < oneHour) {
            filter.push(upcomingStream.channelId);
        }
    }

    const upcomingStreams = await holo_st.get_all_upcoming_streams(filter, (s, i) => {
        logUpdate(`Checked ${i+1}.`);
    });
    upcomingStreams.forEach((x) => streamList.addUpcomingStream(x));

    logUpdate.done();
    console.log(`Finished checking for upcoming streams. Time to finish: ${Date.now() - t}ms`);

    return streamList.export();
};