import "../../public/scss/base.scss";

import $ from "jquery";
import anime from "animejs";

import { Generation } from "../core/modules/holo_st/globals";
import StreamDisplay from "./modules/streamdisplay";

let is_default = true;

let streamDisplay: StreamDisplay | null = null;

async function gen_checkbox_callback(e: JQuery.TriggeredEvent): Promise<void> {
    const target = $(e.target);
    const checkboxes = $(".gen-select > .content").children(
        ":not(:first-child)"
    );

    // Check if the select all checkbox is clicked
    if (target.attr("value") === "select_all") {
        const checked = target.is(":checked");

        // Un-check / check all of the checkboxes
        checkboxes.each((i, e) => {
            $(e).find(".gen-checkbox").prop("checked", checked);
        });
    }

    const filter: Generation[] = [];

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

function toggle_sidepanel(): void {
    const sidePanel = $("nav.side-navbar");
    const width = sidePanel.width();
    const isHidden = sidePanel.hasClass("hidden");

    const translateX = [`-${width}px`, 0];
    const easing = "cubicBezier(0.650, 0.115, 0.375, 0.900)";
    const duration = 200;

    if (isHidden) {
        sidePanel.removeClass("hidden");

        // Disable toggle button.
        $(".nav-panel-toggle-container").prop("disable", true);

        anime({
            targets: "nav.side-navbar",
            translateX: translateX,
            duration: duration,
            easing: easing,
        });

        $(".side-navbar-overlay").removeClass("hidden");

        anime({
            targets: ".side-navbar-overlay",
            opacity: 1,
            duration: duration,
            easing: easing,
        });
    } else {
        anime({
            targets: "nav.side-navbar",
            translateX: translateX.reverse(),
            duration: duration,
            easing: easing,
        }).finished.then(() => {
            // Re-enable toggle button
            $(".nav-panel-toggle-container").prop("disable", false);

            sidePanel.addClass("hidden");
        });
        anime({
            targets: ".side-navbar-overlay",
            opacity: 0,
            duration: duration,
            easing: easing,
        }).finished.then(() => {
            $(".side-navbar-overlay").addClass("hidden");
        });
    }
}

$(async () => {
    await load_icons();

    const minimized_streams = await $.getJSON("streams?minimize=1");

    streamDisplay = new StreamDisplay();

    await streamDisplay.init(minimized_streams);
    await streamDisplay.display();

    $(".nav-panel-toggle-container").on("click", toggle_sidepanel);

    $(".side-navbar-overlay > .exit-button-container").on(
        "click",
        toggle_sidepanel
    );

    $(".side-navbar .dropdown-container > .button").on("click", (e) => {
        const element = $(e.target);
        const content = element.next();
        const isHidden = content.hasClass("hidden");

        const opacity = [0, 1];
        const easing = "easeInOutSine";
        const duration = 160;

        if (isHidden) {
            anime({
                targets: content[0],
                opacity: opacity,
                easing: easing,
                duration: duration,
            });

            content.removeClass("hidden");
        } else {
            anime({
                targets: content[0],
                opacity: opacity.reverse(),
                easing: easing,
                duration: duration,
            }).finished.then(() => content.addClass("hidden"));
        }
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

    $(".gen-select > .content .gen-checkbox").on(
        "input",
        gen_checkbox_callback
    );

    $("body > main").removeClass("hidden");
});
