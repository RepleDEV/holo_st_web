import "../../public/scss/base.scss";

import $ from "jquery";
import moment from "moment";

import { MinimizedStreams, Channel } from "../core/globals";
import { get_next_minute } from "../core/modules/get_next_minute";

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
    const { ongoingStreams, upcomingStreams }: MinimizedStreams = await $.getJSON("streams?minimized=1");
    stream_layout = await get_stream_layout();
    channels = await $.getJSON("public/files/channels.json");

    for (let i = 0;i < ongoingStreams.length;i++) {
        const { channelId, title, streamId, thumbnail } = ongoingStreams[i];
        add_stream(channelId, title, streamId, (thumbnail.maxres || thumbnail.medium).url, true);
    }
    for (let i = 0;i < upcomingStreams.length;i++) {
        const { channelId, title, streamId, thumbnail, scheduledStartTime } = upcomingStreams[i];

        // This checks whether or not the stream is scheduled within the next day.
        // I'm not sorry that this is a 1 liner.
        const startOfNextDay = new Date(new Date().setHours(0,0,0,0)).setDate(new Date().getDate() + 1);
        const twentyFourHours = (1000 * 60 * 60 * 24);

        if (+moment(scheduledStartTime) <= startOfNextDay + twentyFourHours) {
            // Sometimes the maxres version (1280x720) doesn't exist, if so, then switch to medium res ()
            add_stream(channelId, title, streamId, (thumbnail.maxres || thumbnail.medium).url, false);
        }
    }
})();