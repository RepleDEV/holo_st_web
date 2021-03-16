import "../../public/scss/base.scss";

import $ from "jquery";

import { MinimizedStreams } from "../core/globals";
import { Generation } from "../core/modules/holo_st/globals";
import StreamDisplay from "./modules/streamdisplay";

let is_default = true;

let streamDisplay: StreamDisplay | null = null;

async function gen_checkbox_callback(e: JQuery.TriggeredEvent): Promise<void> {
    const target = $(e.target);
    const checkboxes = $(".gen-select > .content").children(":not(:first-child)");

    // Check if the select all checkbox is clicked
    if (target.attr("value") === "select_all") {
        const checked = target.is(":checked");

        // Un-check / check all of the checkboxes
        checkboxes.each((i, e) => {
            $(e).find(".gen-checkbox").prop("checked", checked);
        });
    }

    let filter: Generation[] = [];

    const children = checkboxes.toArray();
    for (let i = 0; i < children.length; i++) {
        const child = children[i];

        const checkbox = $(child).find(".gen-checkbox");
        const value = checkbox.attr("value");

        if (!checkbox.is(":checked")) {
            switch (value) {
                case "0th": 
                    filter.push(["JP", 0]);
                    break;
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
                default:
                    break;
            }
        }
    }

    if (streamDisplay !== null) {
        streamDisplay.updateQuery("", filter);
    }
}

async function load_icons(): Promise<void> {
    const elements = $("i[id*='load-icon']").toArray();

    for (let i = 0; i < elements.length; i++) {
        const e = $(elements[i]);
        const icon_name = e.attr("data-icon") || "";

        if (icon_name.length) {
            const icon = await $.get({
                url: `/public/icons/${icon_name}.svg`,
                dataType: "text",
            });

            e.replaceWith(icon);
        }
    }
}

(async () => {
    await load_icons();

    const minimized_streams = await $.getJSON("streams?minimized=1");

    streamDisplay = new StreamDisplay();

    await streamDisplay.init(minimized_streams);
    streamDisplay.display();

    $(".nav-panel-toggle-container").on("click", () => {
        $("nav.side-navbar").toggleClass("hidden");
        $(".side-navbar-overlay").toggleClass("hidden");
    });

    $(".side-navbar-overlay > .exit-button-container").on("click", () => {
        $("nav.side-navbar").toggleClass("hidden");
        $(".side-navbar-overlay").toggleClass("hidden");
    });

    $(".side-navbar .dropdown-container > .button").on("click", (e) => {
        const element = $(e.target);

        element.next().toggleClass("hidden");
    });

    $("input#search_input").on("keypress", async (e) => {
        const val = ($(e.target).val() || "").toString();

        if (e.key === "Enter") {
            streamDisplay.updateQuery(val);
            is_default = false;
        }
    });
    $("input#search_input").on("input", async (e) => {
        const val = ($(e.target).val() || "").toString().toLowerCase();

        if (!val.length && !is_default) {
            streamDisplay.clearQuery();
            is_default = true;
        }
    });

    $(".gen-select > .content .gen-checkbox").on("input", gen_checkbox_callback);
})();
