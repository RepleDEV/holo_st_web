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

    channelName: string;
    channelId: string;

    scheduledStartTime: MomentObjectOutput;
}

export interface MinimizedUpcomingStream extends MinimizedStream {}

export interface MinimizedOngoingStream extends MinimizedStream {
    actualStartTime: MomentObjectOutput;
    concurrentViewers: number;
}

export interface MinimizedStreams {
    ongoingStreams: MinimizedOngoingStream[];
    upcomingStreams: MinimizedUpcomingStream[];
    lastUpdated: number;
}

export interface Channel extends Channel {
    icon: string;
}

export interface StreamListener {
    id: string;
    time: MomentObjectOutput;
}
