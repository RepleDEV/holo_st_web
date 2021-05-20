import dayjs from "dayjs";
import _ from "lodash";
import {
    convert_to_ongoing_stream,
    convert_to_upcoming_stream,
} from "./convert_streams";
import { get_next_minute } from "./get_next_minute";
import {
    Channels,
    UpcomingStream,
    YoutubeVideoListResponse,
} from "./holo_st/globals";
import { get_channels } from "./holo_st/modules/get_channels";
import { get_stream_info } from "./holo_st/modules/get_stream_info";
import { list_streams } from "./list_streams";
import { StreamList } from "./stream_list";

// eslint-disable-next-line prefer-const
let listeners: string[] = [];

let streamList: StreamList | null = null;
let channels: Channels | null = null;

async function check_stream(
    id: string
): Promise<[boolean, YoutubeVideoListResponse]> {
    const streamInfo = await get_stream_info(id);

    return [
        !(
            streamInfo.items.length === 0 ||
            streamInfo.items[0].snippet.liveBroadcastContent !== "live"
        ),
        streamInfo,
    ];
}

async function ongoing_stream_listener_callback(): Promise<void> {
    const { ongoingStreams } = streamList;

    for (let i = 0; i < ongoingStreams.length; i++) {
        const { streamId } = ongoingStreams[i];

        const [isStreaming] = await check_stream(streamId);

        if (!isStreaming) {
            streamList.removeOngoingStream(streamId);
        }
    }
}

/**
 * Start ongoing stream listeners.
 * This starts a loop that checks each of the ongoing streams in the stream list
 * every 15 minutes.
 * It checks the streams whether or not they have ended or not by calling
 * the YouTube API.
 */
function start_ongoing_stream_listeners(): void {
    setTimeout(() => {
        ongoing_stream_listener_callback().then(() => {
            start_ongoing_stream_listeners();
        });
    }, get_next_minute(15) - Date.now());
}

async function upcoming_stream_listener_callback(
    upcomingStream: UpcomingStream
) {
    const [isStreaming, streamInfo] = await check_stream(
        upcomingStream.streamId
    );

    if (isStreaming) {
        streamList.startUpcomingStream(streamInfo);

        _.remove(listeners, (v) => v === upcomingStream.streamId);

        console.log(`Stream is now live: ${upcomingStream.streamId}`);
    } else {
        // Checks if the stream no longer exists (deleted / set to private)
        // Then remove it from existence.
        if (streamInfo.items.length === 0) {
            console.log(`Stream no longer exists: ${upcomingStream.streamId}`);

            streamList.removeUpcomingStream(upcomingStream.streamId);
            _.remove(listeners, (v) => v === upcomingStream.streamId);
            return;
        }

        // Check for reschedule
        if (
            +dayjs(
                streamInfo.items[0].liveStreamingDetails.scheduledStartTime
            ) !== upcomingStream.scheduledStartTime
        ) {
            console.log(`Stream rescheduled: ${upcomingStream.streamId}`);

            const rescheduledStream = convert_to_upcoming_stream(
                streamInfo,
                channels
            );
            streamList.rescheduleUpcomingStream(
                upcomingStream.streamId,
                rescheduledStream.scheduledStartTime
            );

            const time = get_next_minute(5);

            add_upcoming_stream_listener(upcomingStream, time, true);
            return;
        }

        let time = get_next_minute(5);
        // If it's an hour past the scheduled start time
        if (Date.now() >= upcomingStream.scheduledStartTime + 1000 * 60 ** 2) {
            // Start checking every 15 minutes (to save API quota)
            time += 1000 * 60 * 10; // Add 10 minutes to the time
        }

        console.log(`Reinitialized listener: ${upcomingStream.streamId}`);

        add_upcoming_stream_listener(upcomingStream, time, true);
    }
}

function add_upcoming_stream_listener(
    upcomingStream: UpcomingStream,
    time: number,
    resetListener?: boolean
) {
    // This checks if resetListener IS NOT true.
    // It will still return true if resetListener is undefined or null.
    if (!resetListener) {
        listeners.push(upcomingStream.streamId);
    }

    setTimeout(() => {
        upcoming_stream_listener_callback(upcomingStream);
    }, time - Date.now());
}

// I couldn't find an easy optimization for upcoming stream listeners so,
// it still uses the old method.
function start_upcoming_stream_listeners(): void {
    const { upcomingStreams } = streamList;

    // Filter the streams so that the streams that already has a listener
    // won't get iterated.
    const filteredStreams = upcomingStreams.filter(
        ({ streamId }) => !listeners.includes(streamId)
    );

    for (let i = 0; i < filteredStreams.length; i++) {
        const upcomingStream = filteredStreams[i];
        // If upcoming stream starts within the next 2 hours, add the listener.
        if (
            upcomingStream.scheduledStartTime <=
            Date.now() + 1000 * (60 ** 2 * 2)
        ) {
            // Add 2 minutes to the scheduledStartTime to compensate the fact that
            // Streams don't start EXACTLY at their scheduled start time.
            const time = upcomingStream.scheduledStartTime + 1000 * 60 * 2;

            add_upcoming_stream_listener(upcomingStream, time);
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
