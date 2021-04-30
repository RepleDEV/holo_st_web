import cheerio from "cheerio";
import puppeteer,{ Browser, Page } from "puppeteer";
import { Channels, OngoingStream, UpcomingStream } from "../globals";
import get_collaborators from "./get_collabolators";
import { get_stream_info } from "./get_stream_info";
import dayjs from "dayjs";
import _ from "lodash";

async function get_stream_types(page: Page): Promise<string[]> {
    // Get dropdown inner html from page. (The dropdown that allows you to select video types)
    const dropdownInnerHTML = await page.evaluate(() => (document.querySelector("#menu") || {}).innerHTML);
    if (dropdownInnerHTML) {
        const $ = cheerio.load(dropdownInnerHTML);

        const streamTypes: string[] = []

        $("a").each((i, e) => {
            const streamType = $(e).find("div.item").text();

            streamTypes.push(streamType);
        });

        return streamTypes;
    } else {
        console.log("Unable to get HTML from dropdown.");
    }

    return [];
}

async function get_video_list(page: Page): Promise<string> {
    const videoList = await page.evaluate(() => 
        (document.querySelector("*") || {}).innerHTML
    );

    return videoList;
}

async function click_dropdown_button(page: Page, type: "ongoing" | "upcoming", streamTypes: string[]): Promise<void> {
    let buttonIndex = -1;

    // Get dropdown button to press from the streamTypes array.
    if (type === "ongoing") {
        buttonIndex = streamTypes.indexOf("Live now");
    } else {
        buttonIndex = streamTypes.indexOf("Upcoming live streams");
    }

    // Get selector from index
    const selector = `#menu > a:nth-child(${buttonIndex + 1})`;

    // // Get child amount of #contents #items (Number of videos displayed)
    // const previousAmount = await page.evaluate(() => 
    //     document.querySelector("#contents #items").childElementCount
    // );

    await Promise.all([
        // Click the dropdown button
        page.evaluate((selector) => {
            (document.querySelector(selector) as HTMLElement).click()
        }, selector),
        // Wait to load

        // TODO: This method of comparing states
        // TODO: might not work 100% of the time
        // TODO: and will probably need to be changed sometime soon.
        page.waitForFunction((type) => {
            if (type === "upcoming") {
                // This method checks the first video of the list. Checks its thumbnail mark.
                // On a video, the thumbnail mark will show the length of the video.
                // On an ongoing live stream, the thumbnail mark will show the text LIVE with a red background
                // And, on an upcoming live stream, the thumbnail mark will show the text LIVE with a gray background.
                // We check what type of the thumbnail mark is by checking its overlay-style attribute.
                // On a video it will be "DEFAULT"
                // On an ongoing live stream it will be "LIVE"
                // And on an upcoming live stream it will be "UPCOMING"
                return document.querySelector("#overlays > ytd-thumbnail-overlay-time-status-renderer").getAttribute("overlay-style") === "UPCOMING";
            } else {
                // When the type it wants to check is "ongoing" then just count how many videos there are being shown
                // It will always be 1 as there cannot be more than 1 ongoing live stream at any time.
                return document.querySelector("#contents #items").childElementCount === 1;
            }
        }, {}, type)
    ]);
}

function get_stream_ids(videoList: string): string[] {
    const $ = cheerio.load(videoList);

    const streamIds: string[] = [];

    // Loop through every video element to get their respective IDs
    const items = $("#contents #items").children().toArray();

    for (let i = 0;i < items.length;i++) {
        const e = $(items[i]);

        if (e.find("#overlays > ytd-thumbnail-overlay-time-status-renderer").attr("overlay-style") === "DEFAULT") {
            break;
        }

        const meta = e.find("div#dismissible > div#details > div#meta");
        const streamPath =
            meta.children(":first").children(":last").attr("href") || "";
        const streamId = streamPath.substring("/watch?v=".length);

        if (streamId) streamIds.push(streamId);
    }

    return streamIds;
}

async function get_ongoing_streams(page: Page, channels: Channels, streamTypes: string[]): Promise<OngoingStream[]> {
    await click_dropdown_button(page, "ongoing", streamTypes);

    const videoList = await get_video_list(page);
    const streamIds = get_stream_ids(videoList);

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
            tags,
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
            publishedAt: +dayjs(publishedAt),
            tags: tags,
            thumbnail: thumbnails,

            channels: [_.find(channels, (x) => x.channel.id === channelId)],

            defaultAudioLanguage: defaultAudioLanguage,

            scheduledStartTime: +dayjs(scheduledStartTime),
            actualStartTime: +dayjs(actualStartTime),
            concurrentViewers: +concurrentViewers,
            activeLiveChatId: activeLiveChatId,
        });

        const s = ongoingStreams[ongoingStreams.length - 1];
        s.channels.push(...get_collaborators(s, channelId, channels));
    }

    return ongoingStreams;
}

async function get_upcoming_streams(page: Page, channels: Channels, streamTypes: string[]): Promise<UpcomingStream[]> {
    await click_dropdown_button(page, "upcoming", streamTypes);

    const videoList = await get_video_list(page);
    const streamIds = get_stream_ids(videoList);

    const upcomingStreams: UpcomingStream[] = [];

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
            tags,
            defaultAudioLanguage,
        } = snippet;
        const {
            scheduledStartTime,
            activeLiveChatId,
        } = liveStreamingDetails;

        upcomingStreams.push({
            streamId: streamId,

            title: title,
            description: description,
            publishedAt: +dayjs(publishedAt),
            tags: tags,
            thumbnail: thumbnails,

            channels: [_.find(channels, (x) => x.channel.id === channelId)],

            defaultAudioLanguage: defaultAudioLanguage,

            scheduledStartTime: +dayjs(scheduledStartTime),
            activeLiveChatId: activeLiveChatId,
        });

        const s = upcomingStreams[upcomingStreams.length - 1];
        s.channels.push(...get_collaborators(s, channelId, channels));
    }

    return upcomingStreams;
}

async function get_page(browser: Browser): Promise<Page> {
    const page = await browser.newPage();

    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36"
    );

    return page;
}

/**
 * Handles redirects when deployed to Heroku.
 */
async function handle_redirect(page: Page, url: string): Promise<void> {
    const pageURL = page.url();
    if (pageURL !== url && pageURL.includes("consent.youtube.com")) {
        await page.click("div.VfPpkd-RLmnJb");
        await page.waitForNavigation();
    }
}

export default async function get_streams(
    id: string,
    channels: Channels,
    browser_p?: Browser
): Promise<[OngoingStream[], UpcomingStream[]]> {
    // TODO: Change puppeteer.launch() to get_browser function.
    const browser = browser_p || (await puppeteer.launch());
    const page = await get_page(browser);

    const url = `https://www.youtube.com/channel/${id}/videos`;
    await handle_redirect(page, url);

    console.log(page.url());

    await page.goto(url);
    const streamTypes = await get_stream_types(page);

    const hasOngoingStreams = streamTypes.includes("Live now");
    const hasUpcomingStreams = streamTypes.includes("Upcoming live streams");

    // If hasOngoingStreams is true, get ongoing streams. If not, define the variable as an empty array
    const ongoingStreams = hasOngoingStreams ? await get_ongoing_streams(page, channels, streamTypes) : [];
    // Same goes with hasUpcomingStreams.
    const upcomingStreams = hasUpcomingStreams ? await get_upcoming_streams(page, channels, streamTypes) : [];

    return [ongoingStreams, upcomingStreams];
}