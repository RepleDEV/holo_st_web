import {
    Streams,
    MinimizedStreams,
    MinimizedOngoingStream,
    MinimizedUpcomingStream,
} from "../globals";
import { OngoingStream, UpcomingStream } from "./holo_st/globals";

import moment from "moment";

export class StreamList {
    upcomingStreams: UpcomingStream[] = [];
    ongoingStreams: OngoingStream[] = [];
    constructor() {}
    // These two functions make sure that no duplicate is made on either of the arrays.
    addUpcomingStream(stream: UpcomingStream): void {
        // Index to add to
        let index = -1;

        for (let i = 0; i < this.upcomingStreams.length; i++) {
            const upcomingStream = this.upcomingStreams[i];

            if (
                +moment(upcomingStream.scheduledStartTime) <=
                    +moment(stream.scheduledStartTime) &&
                index != -1
            ) {
                index = i;
            }

            if (upcomingStream.streamId === stream.streamId) {
                // If stream already exists in the list, don't add it.
                return;
            }
        }
        for (let i = 0; i < this.ongoingStreams.length; i++) {
            const ongoingStream = this.ongoingStreams[i];

            // If the stream has already started / is in the ongoingStreams array, don't add the stream.
            if (ongoingStream.streamId === stream.streamId) {
                return;
            }
        }

        this.upcomingStreams.splice(index, 0, stream);
    }
    addOngoingStream(stream: OngoingStream): void {
        // Index to add to
        let index = -1;

        for (let i = 0; i < this.ongoingStreams.length; i++) {
            const ongoingStream = this.ongoingStreams[i];

            if (
                +moment(ongoingStream.scheduledStartTime) <=
                    +moment(stream.scheduledStartTime) &&
                index != -1
            ) {
                index = i;
            }

            // If stream already exists in the list, don't add it.
            if (ongoingStream.streamId === stream.streamId) {
                return;
            }
        }
        for (let i = 0; i < this.upcomingStreams.length; i++) {
            const upcomingStream = this.upcomingStreams[i];

            // If stream is ALREADY on the upcomingStreams list
            if (upcomingStream.streamId === stream.streamId) {
                // Remove the upcoming stream
                this.upcomingStreams.splice(i, 1);
                break;
            }
        }

        this.ongoingStreams.splice(index, 0, stream);
    }
    removeOngoingStream(streamId: string): void {
        for (let i = 0; i < this.ongoingStreams.length; i++) {
            const ongoingStream = this.ongoingStreams[i];

            if (ongoingStream.streamId === streamId) {
                this.ongoingStreams.splice(i, 1);
                return;
            }
        }
    }
    removeUpcomingStream(streamId: string): void {
        for (let i = 0; i < this.upcomingStreams.length; i++) {
            const upcomingStream = this.upcomingStreams[i];

            if (upcomingStream.streamId === streamId) {
                this.upcomingStreams.splice(i, 1);
                return;
            }
        }
    }
    export(): Streams {
        return {
            ongoingStreams: this.ongoingStreams,
            upcomingStreams: this.upcomingStreams,
            lastUpdated: Date.now(),
        };
    }
    exportMinimized(): MinimizedStreams {
        return {
            ongoingStreams: this.ongoingStreams.map<MinimizedOngoingStream>(
                (x) => {
                    const res: MinimizedOngoingStream = {
                        streamId: x.streamId,

                        title: x.title,
                        thumbnail: x.thumbnail,

                        channelName: x.channelName,
                        channelId: x.channelId,

                        scheduledStartTime: x.scheduledStartTime,

                        actualStartTime: x.actualStartTime,
                        concurrentViewers: x.concurrentViewers,
                    };
                    return res;
                }
            ),
            upcomingStreams: this.upcomingStreams.map<MinimizedUpcomingStream>(
                (x) => {
                    const res: MinimizedUpcomingStream = {
                        streamId: x.streamId,

                        title: x.title,
                        thumbnail: x.thumbnail,

                        channelName: x.channelName,
                        channelId: x.channelId,

                        scheduledStartTime: x.scheduledStartTime,
                    };

                    return res;
                }
            ),
            lastUpdated: Date.now(),
        };
    }
}
