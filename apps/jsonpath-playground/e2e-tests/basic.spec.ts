import { test, expect, Page, Locator } from "@playwright/test";

test("Inserts input data, writes a query with autocomplete and checks output", async ({ page }) => {
    await page.goto("https://localhost:3000/");

    const dataEditorLocator = await page.locator(`.cm-content:has-text('Superior Auto Sales')`);
    await dataEditorLocator.click();
    await page.keyboard.press("Control+A");
    await pasteText(dataEditorLocator, testJSON);

    await page.locator(`.cm-content:has-text("$.")`).click();
    await page.keyboard.press("Control+A");
    await page.keyboard.type(`$.`);

    await selectCompletionItem(page, "abc");
    await page.keyboard.type(`.`);
    await selectCompletionItem(page, "def");

    const text = await page.locator(`.cm-content:has-text('[ "Lorem impsum"]')`).innerText();
    expect(JSON.parse(text)).toEqual(["Lorem impsum"]);
});

let step = 0;

async function selectCompletionItem(page: Page, completionItemText: string) {
    await page.waitForSelector(".cm-tooltip-autocomplete");

    const completionItem = await page.locator(`.cm-tooltip-autocomplete li:has-text("${completionItemText}")`);
    await expect(completionItem).toBeVisible();

    while (true) {
        //if (step++ === 3)
        //    await page.screenshot({ path: "abc.png" });
        const text = await page.locator(`.cm-tooltip-autocomplete li[aria-selected=true]`).textContent();
        if (text !== null && text.indexOf(completionItemText) !== -1)
            break;
        else {
            await page.waitForTimeout(100); // TODO
            await page.keyboard.press("ArrowDown");
        }
    }

    await page.keyboard.press("Enter");
}

async function pasteText(locator: Locator, text: string) {
    await locator.evaluate((element, text) => {
        const dataTransfer = new DataTransfer();
        dataTransfer.setData("text/plain", text);
        const clipboardEvent = new ClipboardEvent("paste", {
            clipboardData: dataTransfer
        });
        element.dispatchEvent(clipboardEvent);
    }, text);
}

const testJSON = JSON.stringify({
    abc: {
        def: "Lorem impsum"
    }
}, undefined, 4);