const puppeteer = require('puppeteer');

async function scrape(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

        const data = await page.evaluate(() => {
            return {
                title: document.title,

                images: Array.from(document.querySelectorAll('img')).map(img => ({
                    src: img.src,
                    alt: img.alt
                })),

                buttons: Array.from(document.querySelectorAll('button')).map(btn => ({
                    text: btn.innerText,
                    aria: btn.getAttribute('aria-label')
                })),

                headings: Array.from(document.querySelectorAll('h1,h2,h3')).map(h => h.innerText),

                links: Array.from(document.querySelectorAll('a')).map(a => a.href)
            };
        });

        await browser.close();
        return data;

    } catch (err) {
        await browser.close();
        return { error: "Website not reachable" };
    }
}

module.exports = scrape;