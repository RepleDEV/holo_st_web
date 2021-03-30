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
        for (let i = 0; i < this.upcomingStreams.length; i++) {
            const upcomingStream = this.upcomingStreams[i];

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

        this.upcomingStreams.push(stream);

        this.upcomingStreams.sort(
            (a, b) =>
                +moment(a.scheduledStartTime) - +moment(b.scheduledStartTime)
        );
    }
    addOngoingStream(stream: OngoingStream): void {
        for (let i = 0; i < this.ongoingStreams.length; i++) {
            const ongoingStream = this.ongoingStreams[i];
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

        this.ongoingStreams.push(stream);

        // If you know a better way to dynamically sort the array
        // Please do me a favor
        // Thanks
        // <3

        // Sort the stream
        this.ongoingStreams.sort(
            (a, b) => a.scheduledStartTime - b.scheduledStartTime
        );
    }
    removeOngoingStream(streamId: string): OngoingStream[] | undefined {
        for (let i = 0; i < this.ongoingStreams.length; i++) {
            const ongoingStream = this.ongoingStreams[i];

            if (ongoingStream.streamId === streamId) {
                return this.ongoingStreams.splice(i, 1);
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
    getUpcomingStream(streamId: string): UpcomingStream | undefined {
        for (let i = 0; i < this.upcomingStreams.length; i++) {
            const upcomingStream = this.upcomingStreams[i];

            if (upcomingStream.streamId === streamId) {
                return upcomingStream;
            }
        }
        return;
    }
    getOngoingStream(streamId: string): OngoingStream | undefined {
        for (let i = 0; i < this.ongoingStreams.length; i++) {
            const ongoingStream = this.ongoingStreams[i];

            if (ongoingStream.streamId === streamId) {
                return ongoingStream;
            }
        }
        return;
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

                        channels: x.channels,

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

                        channels: x.channels,

                        scheduledStartTime: x.scheduledStartTime,
                    };

                    return res;
                }
            ),
            lastUpdated: Date.now(),
        };
    }
    importStreams(stream: Streams): void {
        stream.ongoingStreams.forEach((x) => this.addOngoingStream(x));
        stream.upcomingStreams.forEach((x) => this.addUpcomingStream(x));
    }
}
