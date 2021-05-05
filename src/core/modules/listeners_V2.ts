import _ from "lodash";
import { convert_to_ongoing_stream } from "./convert_streams";
import { get_next_minute } from "./get_next_minute";
import { Channels, UpcomingStream, YoutubeVideoListResponse } from "./holo_st/globals";
import { get_channels } from "./holo_st/modules/get_channels";
import { get_stream_info } from "./holo_st/modules/get_stream_info";
import { list_streams } from "./list_streams";
import { StreamList } from "./stream_list";

// eslint-disable-next-line prefer-const
let listeners: string[] = []

let streamList: StreamList | null = null;
let channels: Channels | null = null;

async function check_stream(id: string): Promise<[boolean, YoutubeVideoListResponse]> {
    const streamInfo = await get_stream_info(id);

    return [!(
        streamInfo.items.length === 0 || 
        streamInfo.items[0].snippet.liveBroadcastContent !== "live"), streamInfo];
}

async function ongoing_stream_listener_callback(): Promise<void> {
    const { ongoingStreams } = streamList;

    for (let i = 0;i < ongoingStreams.length;i++) {
        const { streamId } = ongoingStreams[i];

        const [isStreaming] = await check_stream(streamId);

        if (!isStreaming) {
            streamList.removeOngoingStream(streamId);
        }
    }
}

function start_ongoing_stream_listeners(): void {
    // Start timer that executes the ongoing_stream_listener_callback() function
    // Every 15th minute after the start of the hour.
    setTimeout(() => {
        ongoing_stream_listener_callback().then(() => {
            start_ongoing_stream_listeners();
        });
    }, get_next_minute(15) - Date.now());
}

async function upcoming_stream_listener_callback(upcomingStream: UpcomingStream) {
    const [isStreaming, streamInfo] = await check_stream(upcomingStream.streamId);

    if (isStreaming) {
        streamList.addOngoingStream(convert_to_ongoing_stream(streamInfo, channels));

        _.remove(listeners, upcomingStream.streamId);
    } else {
        let time = get_next_minute(5);
        // If it's an hour past the scheduled start time
        if (Date.now() <= upcomingStream.scheduledStartTime + 1000 * 60**2) {
            // Start checking every 15 minutes (to save API quota)
            time += 1000 * 60 * 10; // Add 10 minutes to the time
        }

        add_upcoming_stream_listener(upcomingStream, time);
    }
}

function add_upcoming_stream_listener(upcomingStream: UpcomingStream, time: number) {
    const { streamId } = upcomingStream;

    // If there is already a listener for the stream, don't add a new one.
    if (listeners.includes(streamId)) {
        return;
    }

    listeners.push(streamId);

    setTimeout(() => {
        upcoming_stream_listener_callback(upcomingStream);
    }, time - Date.now());
}

// I couldn't find an easy optimization for upcoming stream listeners so,
// it still uses the old method.
function start_upcoming_stream_listeners(): void {
    const { upcomingStreams } = streamList;

    for (let i = 0;i < upcomingStreams.length;i++) {
        const upcomingStream = upcomingStreams[i];
        // If upcoming stream starts within the next 2 hours, add the listener.
        if (upcomingStream.scheduledStartTime <= get_next_minute(60*2)) {
            // Add 2 minutes to the scheduledStartTime to compensate the fact that
            // Streams don't start EXACTLY at their scheduled start time.
            add_upcoming_stream_listener(upcomingStream, upcomingStream.scheduledStartTime + 1000 * 60 * 2);
        }
    }
}

function stream_refresh_callback(): void {
    list_streams(streamList).then(() => {
        start_stream_refresh_timer();

        start_upcoming_stream_listeners();
    });
}

function start_stream_refresh_timer(): void {
    setTimeout(() => {
        stream_refresh_callback();
    }, get_next_minute(60) - Date.now());
}

export default async function start(streamList_: StreamList): Promise<void> {
    channels = await get_channels();
    streamList = streamList_;

    start_ongoing_stream_listeners();
    start_upcoming_stream_listeners();
    start_stream_refresh_timer();
}