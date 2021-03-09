import $ from "jquery";
import moment from "moment";
import _ from "lodash";

import {
    Channel,
    MinimizedOngoingStream,
    MinimizedUpcomingStream,
} from "../../core/globals";
import { Generation } from "../../core/modules/holo_st/globals";
import add_stream from "./add_stream";
import get_channel_info from "./get_channel_info";
import search_channels from "./search_channels";

let channels: Channel[] | null = null;

export default async function get_streams(
    ongoingStreams: MinimizedOngoingStream[],
    upcomingStreams: MinimizedUpcomingStream[],
    query: string = "",
    gen_filter: Generation[] = []
) {
    if (channels === null) {
        channels = await $.getJSON("./public/files/channels.json");
    }

    $("main > .stream-container").html("");

    const includeChannels = search_channels(
        query.toLowerCase(),
        channels || []
    );

    if (includeChannels.length) {
        ongoingStreams = ongoingStreams.filter((x) => {
            for (let i = 0; i < includeChannels.length; i++) {
                const channel = includeChannels[i];
                if (channel.channel.id === x.channelId) {
                    return true;
                }
            }
            return false;
        });
        upcomingStreams = upcomingStreams.filter((x) => {
            for (let i = 0; i < includeChannels.length; i++) {
                const channel = includeChannels[i];
                if (channel.channel.id === x.channelId) {
                    return true;
                }
            }
            return false;
        });
    } else if (query.length) {
        ongoingStreams = ongoingStreams.filter((x) => {
            return x.title.toLowerCase().includes(query.toLowerCase());
        });
        upcomingStreams = upcomingStreams.filter((x) => {
            return x.title.toLowerCase().includes(query.toLowerCase());
        });
    }

    if (gen_filter.length) {
        ongoingStreams = ongoingStreams.filter((x) => {
            const channel = get_channel_info(x.channelId, channels || []);

            const ch_gen = channel.generation || "";

            for (let i = 0; i < gen_filter.length; i++) {
                const gen = gen_filter[i];

                if (_.isEqual(ch_gen, gen)) {
                    return true;
                }
            }

            return false;
        });
        upcomingStreams = upcomingStreams.filter((x) => {
            const channel = get_channel_info(x.channelId, channels || []);

            const ch_gen = channel.generation || "";

            for (let i = 0; i < gen_filter.length; i++) {
                const gen = gen_filter[i];

                if (_.isEqual(ch_gen, gen)) {
                    return true;
                }
            }

            return false;
        });
    }

    for (let i = 0; i < ongoingStreams.length; i++) {
        const { channelId, title, streamId, thumbnail } = ongoingStreams[i];
        await add_stream(
            channelId,
            title,
            streamId,
            (thumbnail.maxres || thumbnail.medium).url,
            true,
            channels || []
        );
    }
    for (let i = 0; i < upcomingStreams.length; i++) {
        const {
            channelId,
            title,
            streamId,
            thumbnail,
            scheduledStartTime,
        } = upcomingStreams[i];

        // This checks whether or not the stream is scheduled within the next day.
        // I'm not sorry that this is a 1 liner.
        const startOfNextDay = new Date(
            new Date().setHours(0, 0, 0, 0)
        ).setDate(new Date().getDate() + 1);
        const twentyFourHours = 1000 * 60 * 60 * 24;

        if (+moment(scheduledStartTime) <= startOfNextDay + twentyFourHours) {
            // Sometimes the maxres version (1280x720) doesn't exist, if so, then switch to medium res ()
            await add_stream(
                channelId,
                title,
                streamId,
                (thumbnail.maxres || thumbnail.medium).url,
                false,
                channels || []
            );
        }
    }
}
