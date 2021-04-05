import puppeteer, { Browser } from "puppeteer";

export async function get_html(
    url: string,
    browser_p?: Browser
): Promise<string> {
    const browser = browser_p || (await puppeteer.launch());
    const page = await browser.newPage();

    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36"
    );
    await page.goto(url, { waitUntil: "networkidle0", timeout: 0 });

    async function checkUrl() {
        let currentURL = (await page.evaluate(() => window.location.href));

        if (currentURL !== url && currentURL.includes("consent.youtube.com")) {
            await page.click("div.VfPpkd-RLmnJb");
            console.log(currentURL);
            setTimeout(async () => { await checkUrl() }, 250);
        }
    }

    await checkUrl();

    const data =
        (await page.evaluate(
            () => (document.querySelector("*") || {}).outerHTML
        )) || "";
    // Don't close the browser if it's imported but close the page.
    if (browser_p) {
        await page.close();
    } else {
        await browser.close();
    }

    return data;
}
