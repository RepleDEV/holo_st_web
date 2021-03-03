export function get_next_minute(minute: number): number {
    const coeff = 1000 * 60 * minute;
    const date = Date.now();

    return +new Date(Math.ceil(date / coeff) * coeff);
}
