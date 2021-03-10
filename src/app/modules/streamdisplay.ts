import _ from "lodash";
import $ from "jquery";
import { MinimizedStreams } from "../../core/globals";
import { Generation } from "../../core/modules/holo_st/globals";

import streamCardCreator from "./streamcardcreator";
import moment from "moment";

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

            // This checks whether or not the stream is scheduled within the next day.
            // I'm not sorry that this is a 1 liner.
            const startOfNextDay = new Date(
                new Date().setHours(0, 0, 0, 0)
            ).setDate(new Date().getDate() + 1);
            const twentyFourHours = 1000 * 60 * 60 * 24;

            if (+moment(stream.scheduledStartTime) >= startOfNextDay + twentyFourHours) {
                // Break because it's GUARANTEED that every other stream after this
                // is scheduled after the 2 day filter.
                break;
            }

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