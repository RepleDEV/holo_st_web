import cheerio from "cheerio";

import { Browser } from "puppeteer";
import { OngoingStream } from "../globals";
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
            const streamPath = meta
            .children(":first")
            .children(":last")
            .attr("href") || "";

            const streamId = streamPath.substring("/watch?v=".length);

            if (streamId) streamIds.push(streamId);
        });

    const ongoingStreams: OngoingStream[] = [];

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
            publishedAt: publishedAt,
            tags: tags,
            thumbnail: thumbnails,

            channelName: channelTitle,
            channelId: channelId,

            defaultAudioLanguage: defaultAudioLanguage,

            scheduledStartTime: parse_time(scheduledStartTime),
            actualStartTime: parse_time(actualStartTime),
            concurrentViewers: +concurrentViewers,
            activeLiveChatId: activeLiveChatId,
        });
    }

    return ongoingStreams;
}
