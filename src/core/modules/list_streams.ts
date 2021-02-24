import logUpdate from "log-update";

import * as holo_st from "./holo_st";

import { StreamList } from "./stream_list";
import { Streams } from "../globals";

export async function list_streams(streamList: StreamList): Promise<Streams> {
    console.log("Checking for ongoing streams...");

    const streams = streamList.exportMinimized();

    // Optimization purposes :)

    let filter: string[] = [];
    for (let i = 0;i < streams.ongoingStreams.length;i++) {
        const ongoingStream = streams.ongoingStreams[i];

        filter.push(ongoingStream.channelId);
    }

    const ongoingStreams = await holo_st.get_all_ongoing_streams(filter, (s, i) => {
        logUpdate(`Checked ${i + 1}.`);
    });
    ongoingStreams.forEach((x) => streamList.addOngoingStream(x));

    logUpdate.done();
    console.log("Finished checking for ongoing streams.")
    console.log("Checking for upcoming streams...");

    const upcomingStreams = await holo_st.get_all_upcoming_streams([], (s, i) => {
        logUpdate(`Checked ${i+1}.`);
    });
    upcomingStreams.forEach((x) => streamList.addUpcomingStream(x));

    logUpdate.done();
    console.log("Finished checking for upcoming streams.");

    return streamList.export();
};