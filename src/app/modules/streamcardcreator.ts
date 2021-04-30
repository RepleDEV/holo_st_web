import cheerio from "cheerio";
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

    // Remove _live from *_live.jpg because somehow there could be
    // 2 different thumbnails???
    // YouTube what?
    $("#stream_thumbnail").attr("src", streamThumbnailUrl.replace("_live", ""));
    $(".thumbnail-container a").attr("href", streamLink);

    $(".channel-icon-container a").attr("href", channelLink);
    $("#channel_icon").attr("src", channelIconLink);

    $(".stream-title").attr("href", streamLink);
    $(".stream-title").text(streamTitle);

    $(".streamer-name").text(name);
    $(".streamer-name").attr("href", channelLink);

    if (channels.length > 1) {
        const streamersElement = $(".streamers");
        const streamerIconContainerElement = streamersElement.find(".streamer-icons-container");
        streamersElement.find("hr").removeClass("hidden");
        streamerIconContainerElement.removeClass("hidden");

        const streamerIconElement = $(".streamers > .streamer-icons-container > .streamer-icon");
        const streamerIconComponent = streamerIconElement.clone();
        
        streamerIconElement.remove();

        // Variable i is 1 because the first element of the array is the live stream's host.
        for (let i = 1;i < channels.length;i++) {
            const channel = channels[i];

            const streamerIconComponentClone = streamerIconComponent.clone();

            streamerIconComponentClone.find("img").attr("src", channel.icon.replace("{size}", "64"));

            streamerIconContainerElement.append(streamerIconComponentClone);
        }
    }

    if (streaming) {
        $(".stream-layout").addClass("streaming");
    }

    $(".stream-layout").attr("data-id", streamId);

    return $("body").html();
}
