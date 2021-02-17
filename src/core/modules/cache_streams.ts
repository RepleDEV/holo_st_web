import logUpdate from "log-update";
import moment from "moment";

import * as holo_st from "./holo_st/";

import { StreamList } from "./stream_list";

export async function list_streams(streamList: StreamList): Promise<void> {
    console.log("Checking for ongoing streams...");
    await holo_st.get_all_ongoing_streams((s, i) => {
        logUpdate(`Checked ${i + 1}.`);

        s.forEach((x) => streamList.addOngoingStream(x));
    });
    logUpdate.done();
    console.log("Finished checking for ongoing streams.")

    console.log("Checking for upcoming streams...");
    await holo_st.get_all_upcoming_streams((s, i) => {
        logUpdate(`Checked ${i+1}.`);
        
        s.forEach((x) => streamList.addUpcomingStream(x));
    });
    logUpdate.done();
    console.log("Finished checking for upcoming streams.");
};