import net from "net";
import { OngoingStream, UpcomingStream } from "../holo_st/globals";
import { StreamList } from "../stream_list";

export type StartMarker = "START_DATA_STREAMS" | "START_DATA_U_STREAM" | "START_DATA_O_STREAM" | "START_DATA_DEL_U_STREAM" | "START_DATA_DEL_O_STREAM";
export type EndMarker = "END_DATA_STREAMS" | "END_DATA_U_STREAM" | "END_DATA_O_STREAM" | "END_DATA_DEL_U_STREAM" | "END_DATA_DEL_O_STREAM";

export default class Server {
    server: net.Server;
    streamList: StreamList;
    connectedSocket: net.Socket;
    constructor() {
        this.server = new net.Server();
        
        this.server.on("connection", (socket) => {
            socket.on("error", () => {
                socket.end();
                delete this.connectedSocket;
            });

            this.connectedSocket = socket;

            if (this.streamList) {
                this.sendStreams();
            }
        });
    }
    removeStream(type: "upcoming" | "ongoing", streamId: string): void {
        if (this.connectedSocket) {
            const startMarker: StartMarker = type === "upcoming" ? "START_DATA_DEL_U_STREAM" : "START_DATA_DEL_O_STREAM";
            const endMarker: EndMarker = type === "upcoming" ? "END_DATA_DEL_U_STREAM" : "END_DATA_DEL_O_STREAM";
            this.connectedSocket.write(startMarker + JSON.stringify(streamId) + endMarker);
        }
    }
    sendStream(type: "upcoming" | "ongoing", stream: OngoingStream | UpcomingStream): void {
        if (this.connectedSocket) {
            const startMarker: StartMarker = type === "upcoming" ? "START_DATA_U_STREAM" : "START_DATA_O_STREAM";
            const endMarker: EndMarker = type === "upcoming" ? "END_DATA_U_STREAM" : "END_DATA_O_STREAM";
            this.connectedSocket.write(startMarker + JSON.stringify(stream) + endMarker);
        }
    }
    sendStreams(): void {
        if (this.streamList && this.connectedSocket) {
            this.connectedSocket.write("START_DATA_STREAMS" + JSON.stringify(this.streamList.export()) + "END_DATA_STREAMS");
        }
    }
    listen(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.server.once("error", (err) => {
                reject(err);
            });
            this.server.listen(9107, "127.0.0.1", () => {
                resolve();
            });
        });
    }
    close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.server.close((err) => {
                if (err)reject(err);
                resolve();
            });
        });
    }
}