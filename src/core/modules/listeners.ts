// import moment from "moment";

// import { Streams, StreamListener } from "../globals";
// import { Cache } from "./cache";
// import { get_next_minute } from "./get_next_minute";
// import { get_stream_info } from "./holo_st/modules/get_stream_info";

// const listeners: StreamListener[] = [];

// async function ongoingStreamCallback(id: string, cache: Cache): Promise<void> {
//     const stream_info = await get_stream_info(id);

//     const isStreaming = stream_info.items[0].snippet.liveBroadcastContent === "live";
//     if (isStreaming) {
//         const streamCache = await cache.readFile("min")
//     } else {

//     }
// }

// function upcomingStreamCallback(id: string, cache: Cache): void {

// }

// function init(streamCache: Streams, cache: Cache): void {
//     const { ongoingStreams, upcomingStreams } = streamCache;

//     // Check every 15 minutes if the stream already started.
//     for (let i = 0;i < ongoingStreams.length;i++) {
//         const ongoingStream = ongoingStreams[i];

//         const time = moment(get_next_minute(15));

//         listeners.push(
//             {
//                 id: ongoingStream.streamId,
//                 callback: ongoingStreamCallback,
//                 time: time.toObject()
//             }
//         );

//         setTimeout(async () => {
//             await ongoingStreamCallback(ongoingStream.streamId, cache);
//         }, +time);
//     }

//     for (let i = 0;i < upcomingStreams.length;i++) {
//         const upcomingStream = upcomingStreams[i];

//         // Add 2 minutes after the actual scheduled start time.
//         const time = moment(upcomingStream.scheduledStartTime).add(2, "minutes");

//         listeners.push(
//             {
//                 id: upcomingStream.streamId,
//                 callback: upcomingStreamCallback,
//                 time: time.toObject()
//             }
//         );

//         setTimeout(() => {
//             upcomingStreamCallback(upcomingStream.streamId, cache);
//         }, +time);
//     }
// }