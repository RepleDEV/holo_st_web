import { MomentObjectOutput } from "moment";

export interface YoutubeVideoListResponse {
    kind: string;
    etag: string;
    items: YoutubeVideoItems[];
    pageInfo: {
        totalResults: number;
        resultsPerPage: number;
        [key: string]: any;
    };
    [key: string]: any;
}

export interface YoutubeVideoItems {
    kind: string;
    etag: string;
    id: string;
    snippet: {
        publishedAt: string;
        channelId: string;
        title: string;
        description: string;
        thumbnails: YoutubeThumbnails;
        channelTitle: string;
        tags: string[];
        categoryId: string;
        liveBroadcastContent: string;
        localized: {
            title: string;
            description: string;
        };
        defaultAudioLanguage: string;
        [key: string]: any;
    };
    liveStreamingDetails: {
        actualStartTime: string;
        scheduledStartTime: string;
        concurrentViewers: string;
        activeLiveChatId: string;
        [key: string]: any;
    };
    [key: string]: any;
}

export interface YoutubeThumbnails {
    default?: {
        url?: string;
        width?: number;
        height?: number;
    };
    medium?: {
        url?: string;
        width?: number;
        height?: number;
    };
    high?: ThumbnailObject;
    maxres?: ThumbnailObject;
}

export interface ThumbnailObject {
    url: string;
    width: number;
    height: number;
}

export interface Stream {
    streamId: string;

    title: string;
    description: string;
    publishedAt: string;
    tags?: string[];
    thumbnail?: YoutubeThumbnails;

    channelName: string;
    channelId: string;

    defaultAudioLanguage?: string;

    scheduledStartTime: MomentObjectOutput;
    activeLiveChatId?: string;
}

export interface UpcomingStream extends Stream {
    // TODO: Write "waiting" field once you find out how to get the amount of people waiting in an upcoming stream.
}

export interface OngoingStream extends Stream {
    actualStartTime: MomentObjectOutput;
    concurrentViewers: number;
}

export interface Channel {
    name: string;
    alias: string[];
    generation: [string, number] | "GAMERS";
    channel: {
        name: string;
        id: string;
    };
}

export type Channels = Channel[];
