import puppeteer, { Browser } from "puppeteer";
import { MinimizedStreams } from "../../globals";
import { StreamList } from "../stream_list";

import { OngoingStream, UpcomingStream } from "./globals";
import { get_channels } from "./modules/get_channels";
import get_streams from "./modules/get_streams";

export async function get_browser(): Promise<Browser> {
    // If the environment is production, pass no argument to puppeteer.
    const browser = await puppeteer.launch(
        process.env.NODE_ENV === "production"
            ? {
                  args: ["--no-sandbox", "--disable-setuid-sandbox"],
              }
            : undefined
    );

    return browser;
}

export async function get_all_streams(
    check_callback: (
        streams: [OngoingStream[], UpcomingStream[]],
        i: number
    ) => void,
    streamList?: MinimizedStreams | StreamList
): Promise<[OngoingStream[], UpcomingStream[]]> {
    // Get channels array.
    const channels = await get_channels();
    // If the environment is production, pass no argument to puppeteer.
    const browser = await get_browser();

    const ongoingStreams: OngoingStream[] = [];
    const upcomingStreams: UpcomingStream[] = [];

    for (let i = 0; i < channels.length; i++) {
        const channel = channels[i];
        const channelId = channel.channel.id;

        // First, check if any of the upcoming streams from channel[i]
        // is not starting within the next 2 hours

        // TODO: Improve this PLEASE
        if (streamList) {
            let filter = false;
            for (let j = 0;j < streamList.upcomingStreams.length;j++) {
                const upcomingStream = streamList.upcomingStreams[j];

                if (
                    upcomingStream.channels[0].channel.id === channel.channel.id && 
                    // Check 2 hours here (epoch diff)
                    upcomingStream.scheduledStartTime - Date.now() < 7.2e+6
                ) filter = true;
            }

            // Also check for ongoing streams.
            for (let j = 0;j < streamList.ongoingStreams.length;i++) {
                const ongoingStream = streamList.ongoingStreams[j];

                if (ongoingStream.channels[0].channel.id === channel.channel.id)
                    filter = true;
            }

            if (filter)continue;
        }

        const streams = await get_streams(channelId, channels, browser);
        ongoingStreams.push(...streams[0]);
        upcomingStreams.push(...streams[1]);

        if (typeof check_callback === "function") {
            check_callback(streams, i);
        }
    }

    await browser.close();

    return [ongoingStreams, upcomingStreams];
}
