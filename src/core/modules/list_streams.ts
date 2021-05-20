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
        }
    );
    logUpdate.done();

    // Check if the ongoingStreams property on the streamList already has contents inside.
    if (streamList.ongoingStreams.length) {
        // TODO: This method also removes any membership ongoing stream that has started.
        // TODO: Add membershipOnly property to Streams and fix this.

        // Check streamList ongoingStreams array if there are any streams that are not present
        // in the ongoingStreams array from the get_all_streams function

        // This checks for mistakes when the stream listener fails to
        // remove a stream that has already ended.
        const delStreams = streamList.ongoingStreams.filter((stream) => {
            for (let i = 0; i < ongoingStreams.length; i++) {
                const ongoingStream = ongoingStreams[i];

                // Check if the stream is in the ongoingStream array by checking their respective streamIds.
                if (ongoingStream.streamId === stream.streamId) return false;
            }
            return true;
        });

        // Next, loop over all the faulty streams and remove them from the streamList ongoingStreams array
        delStreams.forEach((stream) => {
            streamList.removeOngoingStream(stream.streamId);
        });
    }

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
