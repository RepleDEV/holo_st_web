import { MomentObjectOutput } from "moment";
import { UpcomingStream, OngoingStream, YoutubeThumbnails } from "./modules/holo_st/globals";

export interface StreamCache {
    ongoingStreams: OngoingStream[];
    upcomingStreams: UpcomingStream[];
    writtenAt: number;
}

export interface MinimizedStream {
    streamId: string;

    title: string;
    thumbnail?: YoutubeThumbnails,

    channelName: string;
    channelId: string;

    scheduledStartTime: MomentObjectOutput;
}

export interface MinimizedUpcomingStream extends MinimizedStream {};

export interface MinimizedOngoingStream extends MinimizedStream {
    actualStartTime: MomentObjectOutput;
    concurrentViewers: number;
}

export interface MinimizedStreamCache {
    ongoingStreams: MinimizedOngoingStream[];
    upcomingStreams: MinimizedUpcomingStream[];
    writtenAt: number;
}