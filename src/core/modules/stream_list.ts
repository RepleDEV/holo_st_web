import {
    Streams,
    MinimizedStreams,
    MinimizedOngoingStream,
    MinimizedUpcomingStream,
} from "../globals";
import {
    OngoingStream,
    UpcomingStream,
    YoutubeVideoListResponse,
} from "./holo_st/globals";

import moment from "moment";
import _ from "lodash";

export class StreamList {
    upcomingStreams: UpcomingStream[] = [];
    ongoingStreams: OngoingStream[] = [];
    lastModified = Date.now();
    constructor() {}
    // These two functions make sure that no duplicate is made on either of the arrays.
    addUpcomingStream(stream: UpcomingStream): void {
        for (let i = 0; i < this.upcomingStreams.length; i++) {
            const upcomingStream = this.upcomingStreams[i];

            if (upcomingStream.streamId === stream.streamId) {
                // If stream already exists in the list, replace it
                this.upcomingStreams[i] = stream;
                this.lastModified = Date.now();
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

        this.lastModified = Date.now();
    }
    addOngoingStream(stream: OngoingStream): void {
        for (let i = 0; i < this.ongoingStreams.length; i++) {
            const ongoingStream = this.ongoingStreams[i];
            // If the stream already exists in the list, replace it (changes titles & other stuff in cases where they're changed)
            if (ongoingStream.streamId === stream.streamId) {
                this.ongoingStreams[i] = stream;
                this.lastModified = Date.now();
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

        this.lastModified = Date.now();
    }
    removeOngoingStream(streamId: string): OngoingStream | void {
        for (let i = 0; i < this.ongoingStreams.length; i++) {
            const ongoingStream = this.ongoingStreams[i];

            if (ongoingStream.streamId === streamId) {
                this.ongoingStreams.splice(i, 1);
                this.lastModified = Date.now();
                return ongoingStream;
            }
        }
    }
    removeUpcomingStream(streamId: string): UpcomingStream | void {
        for (let i = 0; i < this.upcomingStreams.length; i++) {
            const upcomingStream = this.upcomingStreams[i];

            if (upcomingStream.streamId === streamId) {
                this.upcomingStreams.splice(i, 1);
                this.lastModified = Date.now();
                return upcomingStream;
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
    // Function for editing the scheduledStartTime property on a given UpcomingStream object.
    rescheduleUpcomingStream(streamId: string, time: number): UpcomingStream {
        for (let i = 0; i < this.upcomingStreams.length; i++) {
            const upcomingStream = this.upcomingStreams[i];
            const { streamId: id } = upcomingStream;

            if (id === streamId) {
                upcomingStream.scheduledStartTime = time;

                this.lastModified = Date.now();

                return upcomingStream;
            }
        }
    }
    // Change an upcomingStream object to ongoingStream. Basically like starting it.
    startUpcomingStream(
        streamInfo: YoutubeVideoListResponse
    ): OngoingStream | void {
        const streamId = streamInfo.items[0].id;

        // Remove the upcomingStream from the list
        const upcomingStream = this.removeUpcomingStream(streamId);
        // If the stream does not exist, return
        if (!upcomingStream) return;

        const {
            actualStartTime,
            concurrentViewers,
        } = streamInfo.items[0].liveStreamingDetails;

        const ongoingStream: OngoingStream = {
            ...upcomingStream,
            actualStartTime: +actualStartTime,
            concurrentViewers: +concurrentViewers,
        };
        this.addOngoingStream(ongoingStream);
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
            lastUpdated: this.lastModified,
        };
    }
    static minimizeOngoingStream(stream: OngoingStream): MinimizedOngoingStream {
        const res: MinimizedOngoingStream = {
            streamId: stream.streamId,

            title: stream.title,
            thumbnail: stream.thumbnail,

            channels: stream.channels,

            scheduledStartTime: stream.scheduledStartTime,

            actualStartTime: stream.actualStartTime,
            concurrentViewers: stream.concurrentViewers,

            membershipOnly: stream.membershipOnly,
        };
        return res;
    }
    static minimizeUpcomingStream(stream: UpcomingStream): MinimizedUpcomingStream {
        const res: MinimizedUpcomingStream = {
            streamId: stream.streamId,

            title: stream.title,
            thumbnail: stream.thumbnail,

            channels: stream.channels,

            scheduledStartTime: stream.scheduledStartTime,

            membershipOnly: stream.membershipOnly,
        };
        return res;
    }
    exportMinimized(): MinimizedStreams {
        return {
            ongoingStreams: this.ongoingStreams.map((val) => StreamList.minimizeOngoingStream(val)),
            upcomingStreams: this.upcomingStreams.map((val) => StreamList.minimizeUpcomingStream(val)),
            lastUpdated: this.lastModified,
        };
    }
    importStreams(stream: Streams): void {
        stream.ongoingStreams.forEach((x) => this.addOngoingStream(x));
        stream.upcomingStreams.forEach((x) => this.addUpcomingStream(x));
    }
}
