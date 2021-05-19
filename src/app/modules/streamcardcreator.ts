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

    // Check if the stream is a collaboration stream by checking if the channels length is
    // More than 1.
    if (channels.length > 1) {
        // Get the element with the class "streamers" (the element containing the streamer name)
        const streamersElement = $(".streamers");
        // Find the collaboration-only icon container
        const streamerIconContainerElement = streamersElement.find(".streamer-icons-container");
        // Un-hide hr element (divider) & the collaboration-only container
        streamersElement.find("hr").removeClass("hidden");
        streamerIconContainerElement.removeClass("hidden");

        // Get the streamer-icon element
        const streamerIconElement = $(".streamers > .streamer-icons-container > .streamer-icon");
        // CLONE IT (to make a component out of it)
        const streamerIconComponent = streamerIconElement.clone();
        
        // Remove the original element
        streamerIconElement.remove();

        // Loop over every channel
        // Variable i is 1 because the first element of the array is the live stream's host.
        for (let i = 1;i < channels.length;i++) {
            const channel = channels[i];

            // CLONE THE COMPONENT
            const streamerIconComponentClone = streamerIconComponent.clone();

            // Insert the necessary data (link URL & image URL)
            streamerIconComponentClone.find(".streamer-icon-link").attr("href", `https://youtube.com/channel/${channel.channel.id}`);
            streamerIconComponentClone.find("img").attr("src", channel.icon.replace("{size}", "64"));

            // Add the image to the parent's container;
            streamerIconContainerElement.append(streamerIconComponentClone);
        }
    }

    if (streaming) {
        $(".stream-layout").addClass("streaming");
    }

    $(".stream-layout").attr("data-id", streamId);

    return $("body").html();
}
