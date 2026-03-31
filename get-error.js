import { chromium } from "playwright";

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto("http://localhost:8081/acf/gn/1");

    // Wait for the verse 1 to be clickable
    console.log("Waiting for verse 1...");
    await page.waitForSelector("span.cursor-pointer", { timeout: 10000 });

    // Click verse 1
    const verseSpans = await page.$$("span.cursor-pointer");
    if (verseSpans.length > 0) {
        await verseSpans[0].click({ position: { x: 5, y: 5 } });
    }

    // Wait for "Estudar" button (drawer/modal)
    console.log("Waiting for Estudar button...");
    await page.waitForTimeout(1000);
    const estudarBtn = await page.getByRole('button', { name: /estudar/i });
    await estudarBtn.click();

    // Wait for StudyPanel "Língua" tab
    console.log("Waiting for Língua tab...");
    await page.waitForTimeout(1000);
    const languageTab = await page.getByRole('tab', { name: /língua/i });
    await languageTab.click();

    console.log("Waiting for error overlay...");
    await page.waitForTimeout(2000);

    try {
        const errorContent = await page.textContent("div#webpack-dev-server-client-overlay, vite-error-overlay");
        if (errorContent) {
            console.log("VITE ERROR OVERLAY TEXT:");
            // The vite error overlay is a shadow DOM in Vite 5!
        }
        // If it's a React Error Boundary:
        const bodyText = await page.textContent("body");
        console.log("BODY TEXT:");
        console.log(bodyText?.substring(0, 1500));
    } catch (err) {
        console.log(err);
    }

    // Easiest is to listen to pageerror events
    await browser.close();
})();
