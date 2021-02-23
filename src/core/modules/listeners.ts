import moment from "moment";

import { StreamListener } from "../globals";
import { convert_to_ongoing_stream, convert_to_upcoming_stream } from "./convert_streams";
import { get_next_minute } from "./get_next_minute";
import { OngoingStream, UpcomingStream } from "./holo_st/globals";
import { get_stream_info } from "./holo_st/modules/get_stream_info";
import { list_streams } from "./list_streams";
import { StreamList } from "./stream_list";

const listeners: StreamListener[] = [];

async function ongoingStreamCallback(id: string, cache: StreamList): Promise<void> {
    const stream_info = await get_stream_info(id);

    let isStreaming = true;
    if (stream_info.items.length > 0) {
        isStreaming = stream_info.items[0].snippet.liveBroadcastContent === "live";
    } else {
        isStreaming = false;
    }

    if (!isStreaming) {
        cache.removeOngoingStream(id);

        // Remove the listener from the listeners array;
        listeners.filter((x) => x.id === id);
    } else {
        add_ongoing_stream_listener(convert_to_ongoing_stream(stream_info), cache);
    }
}

async function upcomingStreamCallback(id: string, cache: StreamList, cycle: number): Promise<void> {
    const stream_info = await get_stream_info(id);

    const isStreaming = stream_info.items[0].snippet.liveBroadcastContent === "live";

    if (isStreaming) {
        const ongoingStream = convert_to_ongoing_stream(stream_info);

        cache.addOngoingStream(ongoingStream);
    } else {
        let time = moment();

        // Let's hope this all will be in-sync
        if (cycle == 0) {
            // 2 => 3 | 5
            time.add(3, "minutes");
        } else if (cycle == 1) {
            // 3 => 5 | 10
            time.add(5, "minutes");
        } else if (cycle <= 3) {
            // 5 => 10 * 2 | 30
            time.add(10, "minutes");
        } else if (cycle <= 5) {
            // 10 => 15 * 2 | 60
            time.add(15, "minutes");
        } else if (cycle > 5) {
            // 15 => 30 | > 60
            time.add(30, "minutes");
        }

        setTimeout(() => {
            upcomingStreamCallback(id, cache, cycle += 1);
        }, +time - Date.now());
    }
}

function stream_refresh_callback(cache: StreamList): () => void {
    return async () => {
        console.log("Refreshing streams.");
        const streams = await list_streams(cache);
        console.log("Finished refreshing streams.");
        
        add_upcoming_streams_listeners(streams.upcomingStreams, cache);
        add_ongoing_streams_listeners(streams.ongoingStreams, cache)

        setTimeout(stream_refresh_callback(cache), get_next_minute(60) - Date.now());
    };
}

function add_ongoing_streams_listeners(ongoingStreams: OngoingStream[], cache: StreamList): void {
    // Check every 15 minutes if the stream already ended.
    for (let i = 0;i < ongoingStreams.length;i++) {
        const ongoingStream = ongoingStreams[i];

        add_ongoing_stream_listener(ongoingStream, cache);
    }
}

function add_ongoing_stream_listener(ongoingStream: OngoingStream, cache: StreamList): void {
    for (let i = 0;i < listeners.length;i++) {
        const { id } = listeners[i];

        // If there's already a listener for the stream then return
        if (id === ongoingStream.streamId) {
            return;
        }
    }

    const time = moment(get_next_minute(15));

    listeners.push(
        {
            id: ongoingStream.streamId,
            time: time.toObject()
        }
    );


    setTimeout(async () => {
        await ongoingStreamCallback(ongoingStream.streamId, cache);
    }, +time - Date.now());
}

function add_upcoming_streams_listeners(upcomingStreams: UpcomingStream[], cache: StreamList): void {
    // Check every so often if the stream starts already.
    for (let i = 0;i < upcomingStreams.length;i++) {
        const upcomingStream = upcomingStreams[i];

        add_upcoming_stream_listener(upcomingStream, cache);
    }
}

function add_upcoming_stream_listener(upcomingStream: UpcomingStream, cache: StreamList): void {
    let duplicate = -1;

    for (let i = 0;i < listeners.length;i++) {
        const { id, time } = listeners[i];

        // If there's already a listener for the stream then return
        if (id === upcomingStream.streamId) {
            if (time === upcomingStream.scheduledStartTime) {
                duplicate = i;
                break;
            } else {
                return;
            }
        }
    }

    const time = moment(upcomingStream.scheduledStartTime).add(2, "minutes");
    const ms = +time - Date.now();
    // If ms (time between right now and the scheduled start time [time variable] in milliseconds)
    // is below or equals to 2 hours in milliseconds (1000 * 60 * [60 * 2])
    if (ms <= 1000 * 60 * (60 * 2)) {
        listeners.push(
            {
                id: upcomingStream.streamId,
                time: time.toObject()
            }
        );

        setTimeout(async () => {
            await upcomingStreamCallback(upcomingStream.streamId, cache, 0);
        }, ms);   
    }
}

export function init(cache: StreamList): void {
    const { ongoingStreams, upcomingStreams } = cache.export();

    add_ongoing_streams_listeners(ongoingStreams, cache);
    add_upcoming_streams_listeners(upcomingStreams, cache);
    
    listeners.forEach((listener) => {
        const { id, time } = listener;
        console.log(`Listener for id: ${id} at: ${moment(time).format("MMMM Do, HH:mm:ss")}.`);
    });

    setTimeout(stream_refresh_callback(cache), get_next_minute(60) - Date.now());
} 