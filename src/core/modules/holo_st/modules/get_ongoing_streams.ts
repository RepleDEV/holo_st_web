import cheerio from "cheerio";
import _ from "lodash";
import moment from "moment";

import { Browser } from "puppeteer";
import { OngoingStream } from "../globals";
import { get_channels } from "./get_channels";
import get_collaborators from "./get_collabolators";
import { get_html } from "./get_html";
import { get_stream_info } from "./get_stream_info";
import { parse_time } from "./parse_time";

export async function get_ongoing_streams(
    id: string,
    browser_p?: Browser
): Promise<OngoingStream[]> {
    const data = await get_html(
        `https://youtube.com/channel/${id}/videos?view=2&live_view=501`,
        browser_p
    );
    if (!data) throw "UNABLE TO GET PAGE HTML DATA";

    const $ = cheerio.load(data);

    const hasOngoingStreams =
        $("div#label-text.style-scope.yt-dropdown-menu").text() == "Live now";
    if (!hasOngoingStreams) return [];

    const streamIds: string[] = [];

    $("ytd-app div#content ytd-page-manager ytd-browse div#primary div#items")
        .children()
        .each((i, e) => {
            const meta = $(e).find("div#dismissible > div#details > div#meta");
            const streamPath =
                meta.children(":first").children(":last").attr("href") || "";

            const streamId = streamPath.substring("/watch?v=".length);

            if (streamId) streamIds.push(streamId);
        });

    const ongoingStreams: OngoingStream[] = [];
    const channels = await get_channels();

    for (let i = 0; i < streamIds.length; i++) {
        const streamId = streamIds[i];
        const stream_info = await get_stream_info(streamId);

        const { snippet, liveStreamingDetails } = stream_info.items[0];
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

        ongoingStreams.push({
            streamId: streamId,

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
        });

        const s = ongoingStreams[ongoingStreams.length - 1];
        s.channels.push(...get_collaborators(s, channels));
    }

    return ongoingStreams;
}
