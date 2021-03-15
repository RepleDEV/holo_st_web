import { Channels } from "../globals";
import { promises as fs } from "fs";
import path from "path";

export async function get_channels(): Promise<Channels> {
    const channelsPath = path.resolve("./public/files/channels.json");
    const channels = JSON.parse(
        await fs.readFile(channelsPath, { encoding: "utf-8" })
    );

    return channels;
}
