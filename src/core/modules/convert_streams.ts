import _ from "lodash";
import moment from "moment";
import { Channel } from "../globals";
import {
    OngoingStream,
    UpcomingStream,
    YoutubeVideoListResponse,
} from "./holo_st/globals";

export function convert_to_ongoing_stream(
    list: YoutubeVideoListResponse,
    channels: Channel[]
): OngoingStream {
    const { snippet, liveStreamingDetails, id } = list.items[0];
    const {
        publishedAt,
        channelId,
        title,
        description,
        thumbnails,
        tags,
        defaultAudioLanguage,
    } = snippet;
    const {
        scheduledStartTime,
        actualStartTime,
        concurrentViewers,
        activeLiveChatId,
    } = liveStreamingDetails;

    return {
        streamId: id,

        title: title,
        description: description,
        publishedAt: +moment(publishedAt),
        tags: tags,
        thumbnail: thumbnails,

        channels: [_.find(channels, (x) => x.channel.id === channelId)],

        defaultAudioLanguage: defaultAudioLanguage,

        scheduledStartTime: +moment(scheduledStartTime),
        actualStartTime: +moment(actualStartTime),
        concurrentViewers: +concurrentViewers,
        activeLiveChatId: activeLiveChatId,
    };
}

export function convert_to_upcoming_stream(
    list: YoutubeVideoListResponse,
    channels: Channel[]
): UpcomingStream {
    const { snippet, liveStreamingDetails, id } = list.items[0];
    const {
        publishedAt,
        channelId,
        title,
        description,
        thumbnails,
        tags,
        defaultAudioLanguage,
    } = snippet;
    const { scheduledStartTime, activeLiveChatId } = liveStreamingDetails;

    return {
        streamId: id,

        title: title,
        description: description,
        publishedAt: +moment(publishedAt),
        tags: tags,
        thumbnail: thumbnails,

        channels: [_.find(channels, (x) => x.channel.id === channelId)],

        defaultAudioLanguage: defaultAudioLanguage,

        scheduledStartTime: +moment(scheduledStartTime),
        activeLiveChatId: activeLiveChatId,
    };
}
