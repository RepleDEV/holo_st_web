import logUpdate from "log-update";

import * as holo_st from "./holo_st";

import { StreamList } from "./stream_list";

export async function list_streams(
    streamList = new StreamList()
): Promise<StreamList> {
    const t = Date.now();

    console.log("Checking for streams...");

    const [ongoingStreams, upcomingStreams] = await holo_st.get_all_streams(
        (s, i) => {
            logUpdate(`Checked ${i + 1}.`);
        },
        streamList
    );
    logUpdate.done();

    streamList.importStreams({
        ongoingStreams: ongoingStreams,
        upcomingStreams: upcomingStreams,
        lastUpdated: Date.now(),
    });

    console.log(
        `Finished checking for streams. Time to finish: ${Date.now() - t}ms.`
    );

    return streamList;
}
