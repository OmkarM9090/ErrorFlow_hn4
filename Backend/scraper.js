const puppeteer = require('puppeteer');

async function scrape(url) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });

  const page = await browser.newPage();

  // Set realistic user agent and viewport for dynamic sites
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1366, height: 768 });

  try {
    // Navigate with better waiting strategy
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 40000 
    });

    // Wait for body and additional dynamic content
    await page.waitForSelector('body', { timeout: 10000 });

    // Wait for common dynamic elements or timeout
    await Promise.race([
      page.waitForSelector('h1, h2, .content, main, article', { timeout: 10000 }).catch(() => {}),
      new Promise(resolve => setTimeout(resolve, 5000))
    ]);

    // Additional wait for network stability
    await new Promise(resolve => setTimeout(resolve, 2000));

    const finalUrl = page.url();

    const data = await page.evaluate(() => {
      // Comprehensive meta extraction
      const getMetaContent = (selectors) => {
        for (const selector of selectors) {
          const el = document.querySelector(selector);
          if (el && el.content) return el.content.trim();
        }
        return '';
      };

      const getMetaProperty = (props) => {
        for (const prop of props) {
          const el = document.querySelector(`meta[property="${prop}"]`);
          if (el && el.content) return el.content.trim();
        }
        return '';
      };

      // Resolve relative URLs to absolute
      const resolveUrl = (href) => {
        try {
          return new URL(href, window.location.origin).href;
        } catch {
          return href;
        }
      };

      const baseOrigin = window.location.origin;

      return {
        title: document.title?.trim() || 'No title',
        metaDescription: getMetaContent([
          'meta[name="description"]',
          'meta[name="Description"]', 
          'meta[property="og:description"]',
          'meta[property="twitter:description"]'
        ]) || getMetaProperty(['og:description', 'twitter:description']) || 'No description',
        lang: document.documentElement.lang || document.querySelector('html')?.lang || 'en',
        
        // Internal links: same origin, limit to top 50, resolve relative
        internalLinks: Array.from(document.querySelectorAll('a[href]'))
          .map(a => resolveUrl(a.href))
          .filter(href => {
            try {
              return new URL(href).origin === baseOrigin;
            } catch {
              return false;
            }
          })
          .slice(0, 50),
        
        // Images: limit to top 20, only with src
        images: Array.from(document.querySelectorAll('img[src]'))
          .map(img => ({
            src: img.src,
            alt: img.alt || 'No alt'
          }))
          .filter(img => img.src && !img.src.includes('data:'))
          .slice(0, 20),
        
        // Headings: top 20 from h1-h6
        headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          .map(h => h.innerText.trim())
          .filter(text => text.length > 0)
          .slice(0, 20)
      };
    });

    await browser.close();

    return {
      success: true,
      finalUrl,
      ...data
    };

  } catch (error) {
    console.error('Scrape error:', error.message);
    await browser.close();
    return {
      success: false,
      error: error.message,
      finalUrl: page ? page.url() : url
    };
  }
}

module.exports = scrape;
