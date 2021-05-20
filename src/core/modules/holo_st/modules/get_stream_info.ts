import axios from "axios";

import { YoutubeVideoListResponse } from "../globals";
import { config } from "dotenv";

try {
    config();
} catch (err) {
    console.log(
        "Error whilst trying to load .env variables using dotenv.config()."
    );
}

export async function get_stream_info(
    id: string
): Promise<YoutubeVideoListResponse> {
    const key = process.env.API_KEY;

    if (typeof key !== "string" || !key.length) throw "NO API KEY AVAILABLE.";

    const res = await axios.get(
        `https://youtube.googleapis.com/youtube/v3/videos`,
        {
            params: {
                part: ["snippet", "liveStreamingDetails"].join(","),
                id: id,
                key: key,
            },
        }
    );

    const data: YoutubeVideoListResponse = res.data;
    return data;
}
