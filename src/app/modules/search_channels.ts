import { Channel } from "../../core/globals";

 // Search query algorithm for searching channels
export default function search_channels(query: string, channels: Channel[]): Channel[] {
    const res: Channel[] = [];

    if (!query.length)return res;


    if (channels !== null) {
        for (let i = 0; i < channels.length; i++) {
            const channel = channels[i];

            if (
                channel.name.toLowerCase().includes(query) ||
                channel.alias.map((x) => x.toLowerCase()).includes(query) ||
                channel.channel.name.toLowerCase().includes(query)
            ) {
                res.push(channel);
            }
        }
    }
    return res;
}