import puppeteer, { Browser } from "puppeteer";

import { OngoingStream, UpcomingStream } from "./globals";
import { get_upcoming_streams } from "./modules/get_upcoming_streams";
import { get_ongoing_streams } from "./modules/get_ongoing_streams";
import { get_channels } from "./modules/get_channels";
import get_streams from "./modules/get_streams";

export async function get_all_upcoming_streams(
    filter: string[] = [],
    check_callback?: (upcoming_streams: UpcomingStream[], i: number) => void
): Promise<UpcomingStream[]> {
    filter = [...new Set(filter)];

    const channels = await get_channels();

    const browser = await puppeteer.launch({
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox"
        ]
    });

    const res: UpcomingStream[] = [];

    if (filter.length) channels.filter((x) => filter.includes(x.channel.id));

    for (let i = 0; i < channels.length; i++) {
        const channelId = channels[i].channel.id;

        const upcomingStreams = await get_upcoming_streams(channelId, browser);
        res.push(...upcomingStreams);

        if (typeof check_callback === "function") {
            check_callback(upcomingStreams, i);
        }
    }

    await browser.close();

    return res;
}

export async function get_all_ongoing_streams(
    filter: string[] = [],
    check_callback?: (ongoing_streams: OngoingStream[], i: number) => void
): Promise<OngoingStream[]> {
    filter = [...new Set(filter)];

    const channels = await get_channels();
    // If the environment is production, pass no argument to puppeteer.
    const browser = await puppeteer.launch(
        (
            process.env.NODE_ENV === "production" ? 
            {
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox"
                ]
            } :
            undefined
        )
    );

    const res: OngoingStream[] = [];

    if (filter.length) channels.filter((x) => filter.includes(x.channel.id));

    for (let i = 0; i < channels.length; i++) {
        const channelId = channels[i].channel.id;

        const ongoingStreams = await get_ongoing_streams(channelId, browser);
        res.push(...ongoingStreams);

        if (typeof check_callback === "function") {
            check_callback(ongoingStreams, i);
        }
    }

    await browser.close();

    return res;
}

// TODO: Move this function to get_browser.ts in modules/ to allow imports
async function get_browser(): Promise<Browser> {
    // If the environment is production, pass no argument to puppeteer.
    const browser = await puppeteer.launch(
        (
            process.env.NODE_ENV === "production" ?
            {
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox"
                ]
            } :
            undefined
        )
    );

    return browser;
}

export async function get_all_streams(
    check_callback: (streams: [OngoingStream[], UpcomingStream[]], i: number) => void
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
