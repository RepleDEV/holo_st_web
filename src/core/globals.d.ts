import { MomentObjectOutput } from "moment";
import {
    UpcomingStream,
    OngoingStream,
    YoutubeThumbnails,
    Channel,
} from "./modules/holo_st/globals";

export interface Streams {
    ongoingStreams: OngoingStream[];
    upcomingStreams: UpcomingStream[];
    lastUpdated: number;
}

export interface MinimizedStream {
    streamId: string;

    title: string;
    thumbnail: YoutubeThumbnails;

    channels: Channel[];

    scheduledStartTime: number;
}

export interface MinimizedUpcomingStream extends MinimizedStream {}

export interface MinimizedOngoingStream extends MinimizedStream {
    actualStartTime: number;
    concurrentViewers: number;
}

export interface MinimizedStreams {
    ongoingStreams: MinimizedOngoingStream[];
    upcomingStreams: MinimizedUpcomingStream[];
    lastUpdated: number;
}

export { Channel } from "./modules/holo_st/globals";

export interface StreamListener {
    id: string;
    time: number;
}
