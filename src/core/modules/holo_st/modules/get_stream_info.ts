import axios from "axios";

import { YoutubeVideoListResponse } from "../globals";
import { config } from "dotenv";

config();

export async function get_stream_info(
    id: string
): Promise<YoutubeVideoListResponse> {
    const key = process.env.API_KEY || "";

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
