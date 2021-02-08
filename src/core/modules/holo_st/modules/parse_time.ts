import moment, { MomentObjectOutput } from "moment";

export function parse_time(time: string): MomentObjectOutput {
    return moment(time).toObject();
}
