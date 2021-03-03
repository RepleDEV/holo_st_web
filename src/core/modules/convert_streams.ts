import moment from "moment";
import {
    OngoingStream,
    UpcomingStream,
    YoutubeVideoListResponse,
} from "./holo_st/globals";
import { parse_time } from "./holo_st/modules/parse_time";

export function convert_to_ongoing_stream(
    list: YoutubeVideoListResponse
): OngoingStream {
    const { snippet, liveStreamingDetails, id } = list.items[0];
    const {
        publishedAt,
        channelId,
        title,
        description,
        thumbnails,
        channelTitle,
        tags,
        categoryId,
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

        channelName: channelTitle,
        channelId: channelId,

        defaultAudioLanguage: defaultAudioLanguage,

        scheduledStartTime: +moment(scheduledStartTime),
        actualStartTime: +moment(actualStartTime),
        concurrentViewers: +concurrentViewers,
        activeLiveChatId: activeLiveChatId,
    };
}

export function convert_to_upcoming_stream(
    list: YoutubeVideoListResponse
): UpcomingStream {
    const { snippet, liveStreamingDetails, id } = list.items[0];
    const {
        publishedAt,
        channelId,
        title,
        description,
        thumbnails,
        channelTitle,
        tags,
        categoryId,
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

        channelName: channelTitle,
        channelId: channelId,

        defaultAudioLanguage: defaultAudioLanguage,

        scheduledStartTime: +moment(scheduledStartTime),
        activeLiveChatId: activeLiveChatId,
    };
}
