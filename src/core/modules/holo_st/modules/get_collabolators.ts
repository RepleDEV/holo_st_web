import _ from "lodash";
import { Channel, OngoingStream, UpcomingStream } from "../globals";

const REGEX = /https:\/\/www\.youtube\.com\/channel\/.*(\/?)(?!join)/gi;

export default function get_collaborators(
    stream: UpcomingStream | OngoingStream,
    channelId: string,
    channels: Channel[]
): Channel[] {
    const { description } = stream;

    let links = description.match(REGEX);
    let ids: string[] = [];

    if (links !== null) {
        ids.push(
            ...links.map(
                (x) =>
                    x
                        .replace("https://", "")
                        .replace("?sub_confirmation=1", "")
                        .split("/")[2]
            )
        );
    }

    for (let i = 0; i < channels.length; i++) {
        const { channel } = channels[i];

        // Fixes where channels are linked using @ (@ChannelName, @Tom Scott, etc.)
        if (description.includes(`@${channel.name}`))
            ids.push(`${channel.id}`);
    }

    ids = [...new Set(ids)];

    return channels.filter(
        (x) => ids.includes(x.channel.id) && x.channel.id !== channelId
    );
}
