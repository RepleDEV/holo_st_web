import $ from "jquery";

type Page = "main" | "twitter-overview";

// TODO: Try not using a static class
// TODO: Don't use get_active_page repeatedly
export default class Pages {
    // TODO: Find out whether or not returning self does any good
    static enable(page: Page): Pages {
        const activePage = this.get_active_page();

        function activate(selector: string): void {
            $(selector).removeClass("hidden").attr("data-active", "true");
        }

        // Returns true only if activePage is undefined (no page is active)
        // OR
        // When the current page is NOT the page trying to be activated ("page" parameter)
        if (!activePage || activePage.attr("data-page") !== page) {
            // Disable current page
            this.disable();

            switch (page) {
                case "main":
                    activate("main > .stream-container");
                    break;
                case "twitter-overview":
                    activate("main > .twitter-overview");
                    break;
            }
        }

        return this;
    }
    static disable(): Pages {
        const activePage = this.get_active_page();

        if (activePage) {
            activePage.addClass("hidden").attr("data-active", "false");
        }

        return this;
    }
    static get_active_page(): JQuery<HTMLElement> {
        // Get every child from "main" element (every page's container)
        const pagesElm = $("main").children().toArray();

        // Loop through them
        for (let i = 0;i < pagesElm.length;i++) {
            const pageElm = $(pagesElm[i]);

            // Identify the active page by reading its "data-active" attribute
            if (pageElm.attr("data-active") === "true") {
                // Then return the "data-page" attribute
                return pageElm;
            }
        }

        // If there are no pages that are active, return nothing.
        return;
    }
} 