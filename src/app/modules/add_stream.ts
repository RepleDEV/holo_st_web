import $ from "jquery";

import { Channel } from "../../core/globals";
import get_channel_info from "./get_channel_info";
import get_stream_layout from "./get_stream_layout";

let stream_layout: string | null = null;

export default async function add_stream(
    channelId: string,
    streamTitle: string,
    streamId: string,
    streamThumbnailUrl: string,
    streaming: boolean,
    channels: Channel[]
): Promise<void> {
    if (stream_layout === null) {
        stream_layout = await get_stream_layout();
    }

    $("main > div.stream-container").append(stream_layout);
    const stream_card = $("main > div.stream-container").children(
        ":last-child"
    );
    const stream_link = `https://youtu.be/${streamId}`;
    stream_card
        .find(".thumbnail-container a")
        .attr("href", stream_link);
    stream_card.find("#stream_thumbnail").attr("src", streamThumbnailUrl);
    stream_card.find(".stream-title > a").text(streamTitle);
    stream_card.find(".stream-title > a").attr("ref", stream_link)

    // Dirty workaround pls fix
    const channel = get_channel_info(channelId, channels);
    let channel_name = "Unknown";
    let channel_icon_src = "";
    if (channel) {
        channel_name = channel.name;
        channel_icon_src = channel.icon.replace("{size}", "128");
    }

    stream_card
        .find(".channel-icon-container a")
        .attr("href", `https://youtube.com/channel/${channelId}`);
    stream_card
        .find(".channel-icon-container img")
        .attr("src", channel_icon_src);
    stream_card.find(".streamer-name").text(channel_name);
    if (streaming) {
        stream_card.addClass("streaming");
    }
}