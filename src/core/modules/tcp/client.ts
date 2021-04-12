import net from "net";
import { StreamList } from "../stream_list";
import { Streams } from "../../globals";
import { EndMarker } from "./server";
import { OngoingStream, UpcomingStream } from "../holo_st/globals";

export default class Client {
    socket: net.Socket;
    streamList: StreamList;
    constructor() {
        this.socket = new net.Socket();

        let packets = "";

        this.socket.on("data", (buf) => {
            let data = buf.toString();

            // RegExp Explanation:
            // Search for a piece of text at the beginning of the variable "data"
            // That matches: "START_DATA", then, optional for: "_DEL"
            // Then optional for: "_U" or "_O"
            // Then "_STREAM" (NOT OPTIONAL)
            // Then optional for "S"
            // All caps sensitive
            const startMarker = data.match(/^START_DATA(_DEL)?(_[UO])?_STREAM(S)?/);
            // It's the same except it searches at the end of the variable "data"
            // And matches from "END_DATA" instead of "START_DATA"
            const endMarker = data.match(/END_DATA(_DEL)?(_[UO])?_STREAM(S)?$/);

            if (startMarker) {
                data = data.slice(startMarker[0].length);
            }

            packets += data;

            if (endMarker) {
                const endMarkerStr = endMarker[0];
                packets = packets.slice(0, -endMarkerStr.length);

                switch (endMarkerStr) {
                    case "END_DATA_STREAMS": {
                        this.streamList = new StreamList();

                        const streams: Streams = JSON.parse(packets);
                        this.streamList.importStreams(streams);
                        break;
                    }
                    case "END_DATA_U_STREAM": {
                        if (this.streamList) {
                            const u_stream: UpcomingStream = JSON.parse(packets);
                            this.streamList.addUpcomingStream(u_stream);
                        }
                        break;
                    }
                    case "END_DATA_O_STREAM": {
                        if (this.streamList) {
                            const o_stream: OngoingStream = JSON.parse(packets);
                            this.streamList.addOngoingStream(o_stream);
                        }
                        break;
                    }
                    case "END_DATA_DEL_U_STREAM": {
                        if (this.streamList) {
                            const id: string = JSON.parse(packets);
                            this.streamList.removeUpcomingStream(id);
                        }
                        break;
                    }
                    case "END_DATA_DEL_O_STREAM": {
                        if (this.streamList) {
                            const id: string = JSON.parse(packets);
                            this.streamList.removeOngoingStream(id);
                        }
                    }
                }
            }
        });
    }
    connect(options?: { maxRetries?: number, retryDelay: number }): Promise<void> {
        return new Promise((resolve, reject) => {
            let attempts = 0;

            const connect = () => {
                this.socket.connect(9107, "127.0.0.1", () => {
                    resolve();
                });
                attempts++;
            };

            this.socket.on("error", () => {
                if (attempts == (options.maxRetries || 10)) {
                    return reject(`Socket could not connect to server after ${options.maxRetries || 10} retries.`);
                } else if (options.retryDelay) {
                    setTimeout(() => {
                        connect();
                    }, options.retryDelay);
                } else {
                    connect();
                }
            });

            connect();
        });
    }
}