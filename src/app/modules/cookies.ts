// Handles cookies. yum

import dayjs from "dayjs";

// See https://www.w3schools.com/js/js_cookies.asp

export default class Cookie {
    constructor(name: string, value = "", exDays = 7) {
        const expiryDate = new Date(+dayjs().add(exDays, "days")).toUTCString();
        if (name) {
            document.cookie = `${name}=${value};${expiryDate};path=/`;
        }
    }
    static get(name: string): string {
        const nameM = name + "=";
        const cookies = decodeURIComponent(document.cookie).split(";");
        for (let i = 0;i < cookies.length;i++) {
            let cookie = cookies[i];

            while (cookie[0] === " ")cookie = cookie.substring(1);

            if (cookie.indexOf(nameM) === 0) {
                return cookie.substring(nameM.length, cookie.length);
            }
        }

        return "";
    }
}