/**
 * File: debug.ts
 * Purpose: Debug screen-scraping bugs. (e.g. wrong selectors, random redirects, etc)
 */

import { get_page, visit_channel } from "./holo_st/modules/get_streams";
import puppeteer from "puppeteer";
import { get_channels } from "./holo_st/modules/get_channels";
import { promises as fs, existsSync, mkdirSync } from "fs";
import path from "path";
import { get_browser } from "./holo_st";

export default class Debug {
    constructor() {}
    async get(): Promise<string> {
        // Acquire page HTML. Page: https://youtube.com/channel/{ID}/videos
        const browser = await get_browser();
        const page = await get_page(browser);
        await page.setViewport({ width: 1366, height: 768 });

        // Get random channel ID (i could define a channelID by myself but it's not as fun)
        const channels = await get_channels();
        const channelIds = channels.map((channel) => channel.channel.id);
        const randomChannelId = channelIds[Math.floor(Math.random() * channelIds.length)];

        await visit_channel(randomChannelId, page);

        await page.screenshot({ path: "./test.png" });

        const pageHTML = await page.evaluate(() => document.querySelector("*").outerHTML);

        await browser.close();

        await this.write(pageHTML, `pageHTML-${randomChannelId}.html`);
        
        return randomChannelId;
    }
    write(data: string, filename: string): Promise<void> {
        // Create /debug directory if it doesn't exist
        const dir = "./debug";
        if (!existsSync(dir)) {
            mkdirSync(dir);
        }

        return fs.writeFile(path.resolve(`./debug/${filename}`), data);
    }
}