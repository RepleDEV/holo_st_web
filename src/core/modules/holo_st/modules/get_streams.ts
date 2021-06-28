import cheerio from "cheerio";
import puppeteer, { Browser, Page } from "puppeteer";
import {
    Channels,
    OngoingStream,
    Stream,
    UpcomingStream,
    YoutubeVideoListResponse,
} from "../globals";
import get_collaborators from "./get_collabolators";
import { get_stream_info } from "./get_stream_info";
import dayjs from "dayjs";
import _ from "lodash";
import check_membership from "./check_membership";

async function click_dropdown_button(page: Page): Promise<number> {
    // Iterate through the dropdown buttons and find the one that says "Upcoming live streams"
    const dropdownInnerHTML = await page.evaluate(
        // TODO: Fix: Cannot read property "innerHTML" of null
        // TODO: Solution: Fix selector
        () => document.querySelector("#menu").innerHTML
    );

    const $ = cheerio.load(dropdownInnerHTML);

    let dropdownIndex = -1;
    const buttons = $("a").toArray();

    for (let i = 0; i < buttons.length; i++) {
        const e = $(buttons[i]);
        const buttonText = $(e).find("div.item").text();

        // If the button is found
        if (buttonText === "Upcoming live streams") {
            // Set the dropdownIndex variable to the i + 1. (i + 1 because nth-child starts from 1)
            dropdownIndex = i + 1;
            break;
        }
    }

    if (dropdownIndex !== -1) {
        // Selector for the dropdown button.
        const selector = `#menu > a:nth-child(${dropdownIndex})`;

        await Promise.all([
            // Click the dropdown button
            page.evaluate((selector) => {
                (document.querySelector(selector) as HTMLElement).click();
            }, selector),
            // Wait for page to load
            page.waitForNavigation({ waitUntil: "networkidle0" }),
        ]);
    }

    return dropdownIndex;
}

// TL;DR If the "type" parameter is "upcoming" it sets the return type of the function
// to upcomingStreams. But if the "type" parameter is "ongoing" then it sets the return type
// of the function to ongoingStreams.

// See https://stackoverflow.com/a/54166010/13160047

type StreamTypes = "upcoming" | "ongoing";

type ReturnType<T> = T extends "upcoming"
    ? UpcomingStream
    : T extends "ongoing"
    ? OngoingStream
    : never;

/**
 * Processes YouTube API response and converts it into an OngoingStream or UpcomingStream object.
 * @param type Type to of stream to process. (Defines return type)
 * @param stream_info YouTube API response.
 * @param channels Channels array.
 * @returns OngoingStream / UpcomingStream
 */
async function process_stream_info<T extends StreamTypes>(
    type: T,
    stream_info: YoutubeVideoListResponse,
    channels: Channels
): Promise<ReturnType<T>> {
    const { snippet, liveStreamingDetails, id } = stream_info.items[0];
    const { publishedAt, channelId, title, description, thumbnails, liveBroadcastContent } = snippet;

    if (liveBroadcastContent === "none") {
        throw `NOT A LIVE STREAM. ID: ${id}.`;
    }

    const {
        scheduledStartTime,
        actualStartTime,
        concurrentViewers,
        activeLiveChatId,
    } = liveStreamingDetails;

    const stream: Stream = {
        scheduledStartTime: +dayjs(scheduledStartTime),
        activeLiveChatId,
        description,
        title,
        publishedAt: +dayjs(publishedAt),
        streamId: id,
        thumbnail: thumbnails,
        channels: [_.find(channels, (x) => x.channel.id === channelId)],
        membershipOnly: await check_membership(id),
    };

    // Add collaborators to channels array.
    stream.channels.push(...get_collaborators(stream, channelId, channels));

    // We need to check if the stream type is ongoing or upcoming
    // because ongoing streams has extra properties
    if (type == "ongoing") {
        return {
            ...stream,
            actualStartTime: +dayjs(actualStartTime),
            concurrentViewers: concurrentViewers ? "" : +concurrentViewers,
        } as ReturnType<T>; // For readability purposes
    }

    return stream as ReturnType<T>;
}

export async function get_page(browser: Browser): Promise<Page> {
    const page = await browser.newPage();

    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36"
    );

    return page;
}

/**
 * Set browser page to a channel's page.
 * @param id Channel ID
 * @param page Browser page
 */
export async function visit_channel(id: string, page: Page): Promise<void> {
    const url = `https://www.youtube.com/channel/${id}/videos`;
    // Do not change waitUntil property. Only works when it's on networkidle0
    await page.goto(url, { waitUntil: "networkidle0", timeout: 0 });

    await handle_redirect(page, url);
}

/**
 * Handles redirects when deployed to Heroku.
 *
 * Tl;DR When deployed to Heroku the page (the last time I've observed it) gets redirected
 * to consent.youtube.com for whatever reason. This fixes it.
 */
async function handle_redirect(page: Page, url: string): Promise<void> {
    const pageURL = page.url();
    if (pageURL !== url && pageURL.includes("consent.youtube.com")) {
        await page.click("button.VfPpkd-LgbsSe");

        await page.waitForNavigation();

        await page.evaluate(() => {
            // Select all cookie options as "no"
            const optionElements = document.querySelectorAll(".VfPpkd-WsjYwc");
            const select = 0;
            let childPath = [1, 0, 1, select, 0, 0];

            for (let i = 0;i < optionElements.length;i++) {
                let currentElement = optionElements[i];

                if (i == 2) {
                    childPath = [1, 1, 0, 1, select, 0, 0];
                }

                for (let j = 0;j < childPath.length;j++) {
                    const childIndex = childPath[j];
                    currentElement = currentElement.children[childIndex];
                }
                (currentElement as HTMLElement).click();
            }
        });

        await page.click("button.VfPpkd-LgbsSe");

        await page.waitForNavigation({ waitUntil: "networkidle0" });
    }
}

/**
 * Get stream ID from a YT video element.
 * @param videoElement YouTube video element
 */
function get_stream_id(videoElement: string): string {
    const $ = cheerio.load(videoElement);

    const meta = $("body > *").find("div#dismissible > div#details > div#meta");
    const streamPath =
        meta.children(":first").children(":last").attr("href") || "";
    const streamId = streamPath.substring("/watch?v=".length);

    return streamId;
}

// These 2 functions only work when the page's url is: https://www.youtube.com/channel/{CHANNEL ID}/videos

async function get_ongoing_stream(
    page: Page,
    channels: Channels
): Promise<OngoingStream | void> {
    // The first video on the list will be the current live stream
    // So check if that is the case
    // if it is, get the ID of the live stream

    // This selector returns the text overlay of the first video.
    const SELECTOR =
        "#contents #items > *:nth-child(1) #overlays > ytd-thumbnail-overlay-time-status-renderer";
    const overlayType = await page.evaluate(
        (SELECTOR) =>
            {
                const overlay_style = document.querySelector(SELECTOR);
                if (overlay_style) {
                    return overlay_style.getAttribute("overlay-style")
                }
                return "";
            },
        SELECTOR
    );

    // If the overlay type is LIVE
    if (overlayType === "LIVE") {
        const videoElement = await page.evaluate(
            () =>
                document.querySelector("#contents #items > *:nth-child(1)")
                    .outerHTML
        );

        const streamId = get_stream_id(videoElement);
        const streamInfo = await get_stream_info(streamId);
        const ongoingStream = await process_stream_info(
            "ongoing",
            streamInfo,
            channels
        ).catch(() => {});

        return ongoingStream;
    }
}

async function get_upcoming_streams(
    page: Page,
    channels: Channels
): Promise<UpcomingStream[]> {
    // Changes page to view the upcoming streams page (by clicking the dropdown button so that it doesn't reload the whole page by changing the URL)
    // And extracts the video ID's from that.
    const s = await click_dropdown_button(page);

    if (s === -1) {
        return [];
    }

    // Testing purposes only.
    if (process.env.NODE_ENV !== "production")
        await page.screenshot({ path: "./test.png" });

    const videoElementsString = await page.evaluate(
        () => document.querySelector("#contents #items").outerHTML
    );

    const $ = cheerio.load(videoElementsString);
    const videoElements = $("body > *").children().toArray();

    let upcomingStreams: UpcomingStream[] = [];

    for (let i = 0; i < videoElements.length; i++) {
        const videoElement = videoElements[i];

        const streamId = get_stream_id($.html(videoElement));
        const streamInfo = await get_stream_info(streamId);
        const upcomingStream = await process_stream_info(
            "ongoing",
            streamInfo,
            channels
        ).catch((err) => {
            console.log("An error occurred whilst trying to get the upcomingStream for:");
            console.log(`Stream ID: ${streamId}\n`);
            console.log(`Error message: \n${err}`);
        });

        if (upcomingStream)upcomingStreams.push(upcomingStream);
    }

    return upcomingStreams;
}

export default async function get_streams(
    id: string,
    channels: Channels,
    browser_p?: Browser
): Promise<[OngoingStream[], UpcomingStream[]]> {
    // TODO: Change puppeteer.launch() to get_browser function.
    const browser = browser_p || (await puppeteer.launch());
    const page = await get_page(browser);

    await visit_channel(id, page);

    const ongoingStream = await get_ongoing_stream(page, channels);
    const upcomingStreams = await get_upcoming_streams(page, channels);

    await page.close();

    // TL;DR Return [ongoingStream] if ongoingStream is NOT undefined. I'm not sorry
    return [ongoingStream ? [ongoingStream] : [], upcomingStreams];
}
