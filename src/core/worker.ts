import { init } from "./modules/listeners";
import { list_streams } from "./modules/list_streams";
import { StreamList } from "./modules/stream_list";

import Server from "./modules/tcp/server";

const streamList = new StreamList();
const server = new Server();

(async () => {
    console.log("Starting TCP server");
    await server.listen();
    console.log("Started TCP server!");

    await list_streams(streamList);
    init(streamList, server);
    server.streamList = streamList;
    server.sendStreams();
    console.log("Finished starting worker!");
})();