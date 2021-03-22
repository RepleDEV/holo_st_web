import _ from "lodash";
import { Channel, OngoingStream, UpcomingStream } from "../globals";

const REGEX = /https:\/\/www.youtube.com\/channel\/.*/gi;

export default function get_collaborators(stream: UpcomingStream | OngoingStream, channels: Channel[]): Channel[] {
    const { description } = stream;

    let links = description.match(REGEX);

    if (links === null) {
        links = [];
    }

    const ids = links.map((x) => x.replace("https://", "").split("/")[2]);

    return channels.filter((x) => ids.includes(x.channel.id));
}