import "../../public/scss/base.scss";

import $ from "jquery";

import { MinimizedStreams } from "../core/globals";
import get_streams from "./modules/get_streams";
import { Generation } from "../core/modules/holo_st/globals";
import StreamDisplay from "./modules/streamdisplay";

type Dropdowns = "GenerationSelect";

let minimized_streams: MinimizedStreams | null = null;

let is_default = true;
let current_navbar_dropdown: Dropdowns | null = null;

function toggle_generation_select_dropdown(): void {
    if (current_navbar_dropdown === "GenerationSelect") {
        $(".gen-select-dropdown>.dropdown-content").addClass("hidden");
        current_navbar_dropdown = null;
    } else {
        $(".gen-select-dropdown>.dropdown-content").removeClass("hidden");
        current_navbar_dropdown = "GenerationSelect";
    }
}

async function gen_checkbox_callback(e: JQuery.TriggeredEvent): Promise<void> {
    const container = $(".dropdown-content");

    let filter: Generation[] = [];

    const children = container.children().toArray();
    for (let i = 0; i < children.length; i++) {
        const child = children[i];

        const checkbox = $(child).find(".gen-checkbox");
        const value = checkbox.attr("value");

        if (checkbox.is(":checked")) {
            switch (value) {
                case "1st":
                    filter.push(["JP", 1]);
                    break;
                case "2nd":
                    filter.push(["JP", 2]);
                    break;
                case "GAMERS":
                    filter.push("GAMERS");
                    break;
                case "3rd":
                    filter.push(["JP", 3]);
                    break;
                case "4th":
                    filter.push(["JP", 4]);
                    break;
                case "5th":
                    filter.push(["JP", 5]);
                    break;
                case "ID 1st":
                    filter.push(["ID", 1]);
                    break;
                case "ID 2nd":
                    filter.push(["ID", 2]);
                    break;
                case "EN 1st":
                    filter.push(["EN", 1]);
                    break;
                case "select_all":
                    break;
                default:
                    break;
            }
        }
    }

    if (filter.length === 9) {
        $(".stream-container").html("");
        filter = [];
    }

    if (minimized_streams !== null) {
        await get_streams(
            minimized_streams.ongoingStreams,
            minimized_streams.upcomingStreams,
            "",
            filter
        );
    }
}

(async () => {
    minimized_streams = await $.getJSON("streams?minimized=1");

    const streamdisplay = new StreamDisplay();

    await streamdisplay.init(minimized_streams);
    streamdisplay.display();

    $(document).on("click", (e) => {
        switch (current_navbar_dropdown) {
            case "GenerationSelect":
                // Filter targets
                if (
                    !$(e.target).hasClass("dropdown-content") &&
                    !$(e.target).hasClass("gen-select-dropdown") &&
                    !$(e.target).hasClass("gen-checkbox") &&
                    $(e.target).attr("id") !== "gen_select_option"
                ) {
                    toggle_generation_select_dropdown();
                }
                break;
        }
    });

    // $("input#search_input").on("keypress", async (e) => {
    //     const val = ($(e.target).val() || "").toString().toLowerCase();

    //     if (e.key === "Enter") {
    //         await get_streams(ongoingStreams, upcomingStreams, val);
    //         is_default = false;
    //     }
    // });
    // $("input#search_input").on("input", async (e) => {
    //     const val = ($(e.target).val() || "").toString().toLowerCase();

    //     if (!val.length && !is_default) {
    //         await get_streams(ongoingStreams, upcomingStreams);
    //         is_default = true;
    //     }
    // });

    // $(".dropdown-button").on("click", (e) => {
    //     const { target } = e;
    //     if ($(target).hasClass("gen-select-dropdown")) {
    //         toggle_generation_select_dropdown();
    //     }
    // });
    // $(".gen-checkbox").on("input", gen_checkbox_callback);
})();
