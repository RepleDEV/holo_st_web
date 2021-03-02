import { Channel } from "../../core/globals";

export default function get_channel_info(id: string, channels: Channel[]): Channel | undefined {
    for (let i = 0; i < channels.length; i++) {
        const channel = channels[i];
        if (channel.channel.id === id) {
            return channel;
        }
    }
    return;
}