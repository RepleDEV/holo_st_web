import _ from "lodash";
import $ from "jquery";
import {
    MinimizedOngoingStream,
    MinimizedStreams,
    MinimizedUpcomingStream,
} from "../../core/globals";
import { Generation } from "../../core/modules/holo_st/globals";

import streamCardCreator from "./streamcardcreator";
import moment from "moment";

interface OngoingStreamCard {
    card: string;
    stream: MinimizedOngoingStream;
}

interface UpcomingStreamCard {
    card: string;
    stream: MinimizedUpcomingStream;
}

export default class StreamDisplay {
    ongoingStreamCards: OngoingStreamCard[] = [];
    upcomingStreamCards: UpcomingStreamCard[] = [];
    streams: MinimizedStreams;

    constructor() {}
    async init(streams: MinimizedStreams): Promise<void> {
        this.streams = streams;

        for (let i = 0; i < this.streams.ongoingStreams.length; i++) {
            const stream = this.streams.ongoingStreams[i];

            const streamCardPromise = streamCardCreator(
                stream.title,
                stream.streamId,
                (stream.thumbnail.maxres || stream.thumbnail.medium).url,
                true,
                stream.channels
            );

            streamCardPromise.catch((err) => {
                console.error(
                    "An error occurred when trying to create a stream card."
                );
                console.error(err);
            });

            const card = await streamCardPromise;
            this.ongoingStreamCards.push({
                card: card,
                stream: stream,
            });
        }

        for (let i = 0; i < this.streams.upcomingStreams.length; i++) {
            const stream = this.streams.upcomingStreams[i];

            // This checks whether or not the stream is scheduled within the next day.
            // I'm not sorry that this is a 1 liner.
            const startOfNextDay = new Date(
                new Date().setHours(0, 0, 0, 0)
            ).setDate(new Date().getDate() + 1);
            const twentyFourHours = 1000 * 60 * 60 * 24;

            if (
                +moment(stream.scheduledStartTime) >=
                startOfNextDay + twentyFourHours
            ) {
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
                console.error(
                    "An error occurred when trying to create a stream card."
                );
                console.error(err);
            });

            const card = await streamCardPromise;
            this.upcomingStreamCards.push({
                card: card,
                stream: stream,
            });
        }
    }
    display(): void {
        let cards = "";

        this.ongoingStreamCards.forEach((c) => {
            cards += c.card;
        });
        this.upcomingStreamCards.forEach((c) => {
            cards += c.card;
        });

        $(".stream-container").html(cards);

        $(".stream-layout").on("click", (e) => {
            const card = $(e.target);
            const id = card.attr("data-id");

            if (id) window.open(`https://youtu.be/${id}`, "_blank").focus();
        });
    }
    // TODO: Optimize query algorithm. Reduce looping! Current amount of loops: 10.
    // TODO: If it is unable to optimize this any further, move the query algorithm to back-end.
    updateQuery(query: string, gen_filter?: Generation[]): void {
        const q = query.toLowerCase();

        const filterIds: string[] = [];

        function searchQuery(c: UpcomingStreamCard | OngoingStreamCard) {
            let filter = false;

            // If a title matches the query, show that card.
            // OR, if the name of AT LEAST ONE of the streamers matches the query
            // Show the card.
            if (q.length)
                filter =
                    // This checks the title
                    !c.stream.title.toLowerCase().includes(q) &&
                    // This checks the name of the streamer(s) (hence the .some function)
                    !c.stream.channels.some((x) => {
                        return x.name.toLowerCase().includes(q) ||
                            // Check for nicknames e.g: Senchou (Marine), FBK (Fubuki), etc.
                            x.alias.some((y) => {
                                return y.toLowerCase().includes(q);
                            });
                    });
            if (gen_filter)
                filter = c.stream.channels.some((x) => {
                    return gen_filter.some((y) => {
                        return _.isEqual(x.generation, y);
                    });
                });

            if (filter) filterIds.push(c.stream.streamId);
        }

        this.ongoingStreamCards.forEach(searchQuery);
        this.upcomingStreamCards.forEach(searchQuery);

        $(".stream-layout").each((i, e) => {
            const card = $(e);
            const streamId = card.attr("data-id");

            if (filterIds.includes(streamId)) {
                card.addClass("hidden");
            } else {
                card.removeClass("hidden");
            }
        });
    }
    clearQuery(): void {
        $(".stream-layout").each((i, e) => {
            const card = $(e);

            card.removeClass("hidden");
        });
    }
}
