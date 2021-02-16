import "../../public/scss/base.scss";

import $ from "jquery";

import { MinimizedStreamCache, Channel } from "../core/globals";

async function get_stream_layout(): Promise<string> {
    return await $.get("./public/layouts/stream_layout.html");
}

let channels: Channel[] | null = null;
let stream_layout: string | null = null;

function get_channel_info(id: string): Channel | undefined {
    if (channels !== null) {
        for (let i = 0;i < channels.length;i++) {
            const channel = channels[i];
            if (channel.channel.id === id) {
                return channel;
            }
        }
    }
    return;
}

function add_stream(channelId: string, streamTitle: string, streamId: string, streamThumbnailUrl: string, streaming: boolean): void {
    if (stream_layout !== null) {
        $("main > div.stream-container").append(stream_layout);
        const stream_card = $("main > div.stream-container").children(":last-child");
        stream_card.find(".thumbnail-container a").attr("href", `https://youtu.be/${streamId}`);
        stream_card.find("#stream_thumbnail").attr("src", streamThumbnailUrl);
        stream_card.find(".stream-title").text(streamTitle);

        // Dirty workaround pls fix
        const channel = get_channel_info(channelId);
        let channel_name = "Unknown";
        let channel_icon_src = "";
        if (channel) {
            channel_name = channel.name;
            channel_icon_src = channel.icon.replace("{size}", "128");
        }

        stream_card.find(".channel-icon-container a").attr("href", `https://youtube.com/channel/${channelId}`);
        stream_card.find(".channel-icon-container img").attr("src", channel_icon_src);
        stream_card.find(".streamer-name").text(channel_name)
        if (streaming) {
            stream_card.addClass("streaming");
        }
    }
}

(async () => {
    const { ongoingStreams, upcomingStreams }: MinimizedStreamCache = await $.getJSON("streams?minimized=1");
    stream_layout = await get_stream_layout();
    channels = await $.getJSON("public/files/channels.json");
    for (let i = 0;i < ongoingStreams.length;i++) {
        const { channelId, title, streamId, thumbnail } = ongoingStreams[i];
        add_stream(channelId, title, streamId, thumbnail.maxres.url, true);
    }
    for (let i = 0;i < upcomingStreams.length;i++) {
        const { channelId, title, streamId, thumbnail } = upcomingStreams[i];
        add_stream(channelId, title, streamId, thumbnail.maxres.url, false);
    }
})()