import $ from "jquery";
import dayjs from "dayjs";
import { MinimizedOngoingStream, MinimizedStreams, MinimizedUpcomingStream } from "../../core/globals";

export async function computeCompactMode(streamList: MinimizedStreams): Promise<void> {
    const elementComponentStr = await $.get("/public/layouts/stream_compact_component.html");
    const elementComponent = $(elementComponentStr);

    // Move all streams to one array
    const streams: (MinimizedOngoingStream | MinimizedUpcomingStream)[] = [
        ...streamList.ongoingStreams,
        ...streamList.upcomingStreams
    ].filter((stream) => {
        // Filter streams that starts more than (the start of the day of) 2 days later
        const startOfNextDay = new Date(
            new Date().setHours(0, 0, 0, 0)
        ).setDate(new Date().getDate() + 1);
        const twentyFourHours = 1000 * 60 * 60 * 24;

        return +dayjs(stream.scheduledStartTime) <=
            startOfNextDay + twentyFourHours;
    });

    // Iterate through them and create an element for each stream
    for (let i = 0;i < streams.length;i++) {
        const stream = streams[i];
        const { streamId, title, channels, thumbnail, scheduledStartTime } = stream;

        const isStreaming = i < streamList.ongoingStreams.length;

        // Clone the component
        const streamElement = elementComponent.clone();

        const streamLink = `https://youtu.be/${streamId}/`;
        const thumbnailLink = (
            thumbnail.maxres ? 
                thumbnail.maxres : 
                thumbnail.medium
        ).url.replace("_live", "");

        // Apply text and links to the component
        streamElement
            .attr("data-id", streamId); // Just for identification
        streamElement.find(".thumbnail a")
            .attr("href", streamLink)
            .find("img")
            .attr("src", thumbnailLink);
        streamElement.find(".title a")
            .attr("href", streamLink)
            .text(title);
        const streamer = channels[0];
        const streamerLink = `https://youtube.com/channel/${streamer.channel.id}/`;
        streamElement.find(".streamer a")
            .attr("href", streamerLink)
            .append(streamer.name);
        // Check if it's a collab
        if (channels.length > 1) {
            for (let j = 1;j < channels.length;j++) {
                const { name, channel } = channels[j];
                const channelLink = `https://youtube.com/channel/${channel.id}/`;

                streamElement.find(".streamer a")
                    .clone()
                    .attr("href", channelLink)
                    .text(`, ${name}`)
                    .appendTo(streamElement.find(".streamer"));
            }
        }
        streamElement.find(".start-time")
            .text(dayjs(+scheduledStartTime).format("HH:mm, D/M/YYYY"));
        // Add ongoingStream only styling
        if (isStreaming)
            streamElement.addClass("streaming");

        const clickHandler = (): void => {
            window.open(streamLink, "_blank");
        }

        streamElement.children().on("click", (e) => {
            e.stopPropagation();
        });
        streamElement.on("click", clickHandler);
        streamElement.find(".stream-info > *").on("click", clickHandler);

        // Add the element to the list
        streamElement.appendTo(".stream-container .compact-container");
    }
}

function toggleCompactMode(): void {
    $(".stream-container .compact-container").toggleClass("hidden");
    $(".stream-container .main-container").toggleClass("hidden");
}

export function initializeListeners(): void {
    $(".ui-toggle").on("click", toggleCompactMode);
}