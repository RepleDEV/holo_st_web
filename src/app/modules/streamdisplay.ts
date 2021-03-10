import _ from "lodash";
import $ from "jquery";
import { MinimizedStreams } from "../../core/globals";
import { Generation } from "../../core/modules/holo_st/globals";

import streamCardCreator from "./streamcardcreator";

export default class StreamDisplay {
    cards: string[] = [];
    streams: MinimizedStreams;

    constructor() {}
    async init(streams: MinimizedStreams): Promise<void> {
        this.streams = streams;

        for (let i = 0;i < this.streams.ongoingStreams.length;i++) {
            const stream = this.streams.ongoingStreams[i];

            const streamCardPromise = streamCardCreator(
                stream.title,
                stream.streamId,
                (stream.thumbnail.maxres || stream.thumbnail.medium).url,
                true,
                stream.channels
            );

            streamCardPromise.catch((err) => {
                console.error("An error occurred when trying to create a stream card.");
                console.error(err);
            });

            const card = await streamCardPromise;
            this.cards.push(card);
        }

        for (let i = 0;i < this.streams.upcomingStreams.length;i++) {
            const stream = this.streams.upcomingStreams[i];

            const streamCardPromise = streamCardCreator(
                stream.title,
                stream.streamId,
                (stream.thumbnail.maxres || stream.thumbnail.medium).url,
                false,
                stream.channels
            );

            streamCardPromise.catch((err) => {
                console.error("An error occurred when trying to create a stream card.");
                console.error(err);
            });

            const card = await streamCardPromise;
            this.cards.push(card);
        }
    }
    display(query: string = "", gen_filter?: Generation) {
        if (this.cards.length) {
            $(".stream-container").html(this.cards.join(""));
        } else {
            console.error("No stream card found!. Do the init() method first!");
        }
    }
}