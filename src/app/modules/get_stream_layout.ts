import $ from "jquery";

export default async function get_stream_layout(): Promise<string> {
    return await $.get("./public/layouts/stream_layout.html");
}
