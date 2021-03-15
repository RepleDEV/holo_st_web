import cheerio from "cheerio";
import _ from "lodash";
import { Channel } from "../../core/globals";
import { get } from "jquery";

let template: string | null = null;

export default async function streamCardCreator(
    streamTitle: string,
    streamId: string,
    streamThumbnailUrl: string,
    streaming: boolean,
    channels: Channel[]
): Promise<string> {
    if (template === null) {
        template = await get("/public/layouts/stream_layout.html");
    }
    const $ = cheerio.load(template);

    const channel = channels[0];
    const channelLink = `https://youtube.com/channel/${channel.channel.id}`;
    const channelIconLink = channel.icon.replace("{size}", "120");
    const { name } = channel;
    const streamLink = `https://youtu.be/${streamId}`;

    $("#stream_thumbnail").attr("src", streamThumbnailUrl);
    $(".thumbnail-container a").attr("href", streamLink);

    $(".channel-icon-container a").attr("href", channelLink);
    $("#channel_icon").attr("src", channelIconLink);

    $(".stream-title").attr("href", streamLink);
    $(".stream-title").text(streamTitle);

    $(".streamer-name").text(name);
    $(".streamer-name").attr("href", channelLink);

    if (streaming) {
        $(".stream-layout").addClass("streaming");
    }

    $(".stream-layout").attr("data-id", streamId);

    return $("body").html();
}
