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
    async display(): Promise<void> {
        let rows = "";

        const splitOngoingStreams: OngoingStreamCard[][] = [];
        const splitUpcomingStreams: UpcomingStreamCard[][] = [];

        this.ongoingStreamCards.forEach((x) => {
            if (
                splitOngoingStreams.length == 0 ||
                splitOngoingStreams[splitOngoingStreams.length - 1][0].stream
                    .scheduledStartTime !== x.stream.scheduledStartTime
            ) {
                splitOngoingStreams.push([x]);
            } else {
                splitOngoingStreams[splitOngoingStreams.length - 1].push(x);
            }
        });
        this.upcomingStreamCards.forEach((x) => {
            if (
                splitUpcomingStreams.length == 0 ||
                splitUpcomingStreams[splitUpcomingStreams.length - 1][0].stream
                    .scheduledStartTime !== x.stream.scheduledStartTime
            ) {
                splitUpcomingStreams.push([x]);
            } else {
                splitUpcomingStreams[splitUpcomingStreams.length - 1].push(x);
            }
        });

        const stream_row = await $.get("./public/layouts/stream_row.html");

        splitOngoingStreams.forEach((x) => {
            const time_section_element = $(stream_row);
            time_section_element
                .find(".time-text-container")
                .html(
                    moment(x[0].stream.scheduledStartTime).format(
                        "HH:mm, D/M/YYYY"
                    )
                );
            x.forEach((y) => {
                time_section_element.find(".streams").append(y.card);
            });

            rows += time_section_element[0].outerHTML;
        });
        splitUpcomingStreams.forEach((x) => {
            const time_section_element = $(stream_row);
            time_section_element
                .find(".time-text-container")
                .html(
                    moment(x[0].stream.scheduledStartTime).format(
                        "HH:mm, D/M/YYYY"
                    )
                );
            x.forEach((y) => {
                time_section_element.find(".streams").append(y.card);
            });

            rows += time_section_element[0].outerHTML;
        });

        function clickHandler(e: JQuery.ClickEvent) {
            const card = $(e.target);

            let id = "";
            if (card.hasClass("stream-info-container")) {
                id = card.parent().parent().attr("data-id");
            } else if (card.hasClass("stream-layout")) {
                id = card.attr("data-id");
            }

            if (id) window.open(`https://youtu.be/${id}`, "_blank").focus();
        }

        $(".stream-container").html(rows);

        $(".stream-layout").on("click", (e) => {
            clickHandler(e);
        });
        $(".stream-info-container").on("click", (e) => {
            // This prevents clickHandler to be called twice.
            e.stopPropagation();

            clickHandler(e);
        });
    }
    async display_V2(): Promise<void> {
        const ongoingStreamCards = [...this.ongoingStreamCards];
        const upcomingStreamCards = [...this.upcomingStreamCards];

        
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
                        return (
                            x.name.toLowerCase().includes(q) ||
                            // Check for nicknames e.g: Senchou (Marine), FBK (Fubuki), etc.
                            x.alias.some((y) => {
                                return y.toLowerCase().includes(q);
                            })
                        );
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

        $(".stream-container").children().each((i,e) => {
            const row = $(e);
            const streams = row.find(".streams").children().toArray();
            const time_section_element = row.find(".time-section-container");
            for (let i = 0;i < streams.length;i++) {
                const stream = $(streams[i]);

                if (!stream.hasClass("hidden")) {
                    row.removeClass("hidden");
                    time_section_element.removeClass("hidden");
                    return;
                }
            }
            time_section_element.addClass("hidden");
            // Hide the container
            row.addClass("hidden");
        });
    }
    clearQuery(): void {
        $(".stream-layout").each((i, e) => {
            const card = $(e);

            card.removeClass("hidden");
        });

        $(".stream-container").children().each((i,e) => {
            const row = $(e);
            const time_section_element = row.find(".time-section-container");
            time_section_element.removeClass("hidden");
            // Show the container
            row.removeClass("hidden");
        });
    }
}
