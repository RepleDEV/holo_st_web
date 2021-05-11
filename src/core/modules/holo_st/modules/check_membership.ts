import { get_stream_info } from "./get_stream_info";

// TODO: Finish & complete this function

export default async function check_membership(id: string): Promise<boolean> {
    const stream_info = await get_stream_info(id);
    if (stream_info.items.length) {
        const isOngoingStream = stream_info.items[0].snippet.liveBroadcastContent === "live";

        // TODO: Do more testing on checking membership only stream.
        if (isOngoingStream) {
            // One method of checking whether or not an ongoing stream is membership only or not
            // is by checking its concurrentViewers property.
            // if the property returns null / undefined, it's a membership stream.
            // It returns null because the concurrentViewers information
            // is inaccessible unless you join the channel's membership.
            return typeof stream_info.items[0].liveStreamingDetails.concurrentViewers !== "string";
        } else {
            // TODO: (Theoretical) check for membershipOnly stream by checking its title.
            return false;
        }

        return true;
    }

    return false;
}