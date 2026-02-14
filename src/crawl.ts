import { JSDOM } from "jsdom";
import pLimit from 'p-limit';

class ConcurrentCrawler {
    private baseURL: string; 
    private pages: Record<string, ExtractedPageData>;
    private limit: <T>(fn: () => Promise<T>) => Promise<T>;
    private shouldStop: boolean;
    private maxPages: number;
    private allTasks: Set<Promise<void>>;
    private abortController: AbortController;

    constructor(baseURL: string, maxConcurrency: number, maxPages: number) {
        this.baseURL = baseURL;
        this.pages = {};
        this.limit = pLimit(maxConcurrency);
        this.maxPages = maxPages;
        this.shouldStop = false;
        this.allTasks = new Set([]);
        this.abortController = new AbortController();
    }
    
    // Fetch the HTML for currentURL, but according to the concurrency limiter
    private async getHTML(currentURL: string): Promise<string> {
        return await this.limit(async () => {
            const reqHeaders = new Headers();

            reqHeaders.set("User-Agent", "CakeCrawler/1.0");
            const options = {
                headers: reqHeaders,
                signal: this.abortController.signal,
            }

            const req = new Request(currentURL, options);

            let res;
            try {
                res = await fetch(req);
            } catch (err) {
                if ((err as any)?.name === "AbortError" || this.shouldStop) {
                    return "";
                }
                throw new Error(`Network error: ${(err as Error).message}`);
            }
            
            if (res.status > 399) {
                throw new Error(`HTTP error: ${res.status} ${res.statusText}`);
            }

            const contentType = res.headers.get('content-type');
            if (!contentType?.includes('text/html')) {
                throw new Error(`Non-HTML response: ${contentType}`);
            }

            return res.text()
        });
    }

    // Recursively crawl a page
    private async crawlPage(currentURL: string): Promise<void> {

        if (this.shouldStop) return;

        if (new URL(currentURL).hostname !== new URL(this.baseURL).hostname) return;

        const normalizedURL = normalizeURL(currentURL);

        if (this.pages[normalizedURL]) return;

        if (Object.keys(this.pages).length >= this.maxPages) {
            this.shouldStop = true;
            console.log("Reached maximum number of pages to crawl.")
            this.abortController.abort();
            return;
        }

        console.log(currentURL);

        const html = await this.getHTML(currentURL);
        if (!html) return;

        let data = extractPageData(html, currentURL);
        this.pages[normalizedURL] = data;



        for (const nextURL of data.outgoing_links) {
            if (this.shouldStop) break;
            const task = this.crawlPage(nextURL);
            this.allTasks.add(task);
            task.finally(() => this.allTasks.delete(task));
        }
    }

    // Public entrypoint
    async crawl(): Promise<Record<string, ExtractedPageData>> {
        const first = this.crawlPage(this.baseURL);
        this.allTasks.add(first);
        first.finally(() => this.allTasks.delete(first));

        while (this.allTasks.size > 0) {
            await Promise.race(this.allTasks);
        }

        return this.pages;
    }
}

// Wrapper for creating the crawler, running it and returning the final pages record
export async function crawlSiteAsync(
    baseURL: string,
    maxConcurrency: number = 3,
    maxPages: number = 50
    ): Promise<Record<string, ExtractedPageData>> {
    const crawler = new ConcurrentCrawler(baseURL, maxConcurrency, maxPages);
    let pages = await crawler.crawl()
    return pages;
}

// Parsed info we collect from a page
export type ExtractedPageData = {
  url: string;
  h1: string;
  first_paragraph: string;
  outgoing_links: string[];
  image_urls: string[];
};

// Convert a URL into a consistent `host/path` key (lowercased, no trailing `/`)
export function normalizeURL(url: string): string {
        const receivedURL = new URL(url)
        let fullPath = receivedURL.hostname.toLowerCase() + receivedURL.pathname.toLowerCase()
        if (fullPath.endsWith('/')) {
                fullPath = fullPath.substring(0, fullPath.length - 1)
        }

        return fullPath
}

// Return the first `<h1>` text, or `""` if missing
export function getH1FromHTML(html: string): string {
        const dom = new JSDOM(html);
        let firstH1 = dom.window.document.getElementsByTagName("h1")[0]
        if (!firstH1) {
                return ""
        }
        let firstH1Text = firstH1?.textContent ?? "";
        return firstH1Text
}

// Return the first `<p>` (preferably inside `<main>`), or `""` if missing
export function getFirstParagraphFromHTML(html: string): string {
        const dom = new JSDOM(html);
        let firstP;
        let main = dom.window.document.getElementsByTagName("main")[0];
        if (main) {
                firstP = main.getElementsByTagName("p")[0];
        } else {
                firstP = dom.window.document.getElementsByTagName("p")[0]
        }

        if (!firstP) {
                return ""
        }
        let firstPText = firstP.textContent ?? "";
        return firstPText
}

// Extract all `<a href>`s as absolute URLs using `baseURL`
export function getURLsFromHTML(html: string, baseURL: string): string[] {
    let urls: string[] = [];
    try {
        const dom = new JSDOM(html);
        let aTags: NodeListOf<HTMLAnchorElement> = dom.window.document.querySelectorAll("a");
        for (let i: number = 0; i < aTags.length; i++) {
            let relURL: string | null = aTags[i].getAttribute("href");
            if (!relURL) {
                continue
            }
            let absoluteURL = new URL(relURL, baseURL).toString();
            urls.push(absoluteURL);
        }
    } catch (err) {
        console.error("failed to parse HTML:", err);
    }
        

    return urls;
}

// Extract all `<img src>`s as absolute URLs using `baseURL`
export function getImagesFromHTML(html: string, baseURL: string): string[] {
    let imageURLs: string[] = [];
    try {
        const dom = new JSDOM(html);
        let images: NodeListOf<HTMLImageElement> = dom.window.document.querySelectorAll("img");
        for (let i: number = 0; i < images.length; i++) {
            let src: string | null = images[i].getAttribute("src");
            if (!src) {
                continue
            }
            let absoluteURL = new URL(src, baseURL);
            imageURLs.push(absoluteURL.toString())
        }
    } catch (err) {
        console.error("failed to parse HTML:", err);
    }
        

    return imageURLs;
    
}

// Build `ExtractedPageData` from HTML + the page URL
export function extractPageData(html: string, pageURL: string): ExtractedPageData {
    let h1 = getH1FromHTML(html);
    let firstParagraph = getFirstParagraphFromHTML(html);
    let outgoingLinks = getURLsFromHTML(html, pageURL);
    let imageURLs = getImagesFromHTML(html, pageURL);

    return {
        "url": pageURL,
        "h1": h1,
        "first_paragraph": firstParagraph,
        "outgoing_links": outgoingLinks,
        "image_urls": imageURLs
    }
}

// Fetch HTML from `url` (returns `undefined` for HTTP errors or non-HTML)
export async function getHTML(url: string) {

    const reqHeaders = new Headers();

    reqHeaders.set("User-Agent", "CakeCrawler/1.0");
    const options = {
        headers: reqHeaders,
    }

    const req = new Request(url, options);

    let res;
    try {
        res = await fetch(req);
    } catch (err) {
        throw new Error(`Network error: ${(err as Error).message}`)
    }
    
    if (res.status > 399) {
        console.log(`HTTP error: ${res.status} ${res.statusText}`);
        return;
    }

    const contentType = res.headers.get('content-type');
    if (!contentType?.includes('text/html')) {
        console.log(`Non-HTML response: ${contentType}`);
        return;
    }

    return res.text()
}

// Recursively crawl internal links and count visits per normalized URL
export async function crawlPage(
  baseURL: string,
  currentURL: string = baseURL,
  pages: Record<string, number> = {},
) {
    const normalized_CurrentURL = normalizeURL(currentURL);

    if (new URL(baseURL).hostname !== new URL(currentURL).hostname) {
        return pages;
    }

    if (pages[normalized_CurrentURL]) {
        pages[normalized_CurrentURL] += 1;
        return pages;
    } else {
        pages[normalized_CurrentURL] = 1;
    }


    const html = await getHTML(currentURL);

    if (!html) {
        return pages;
    }

    const urls = getURLsFromHTML(html, baseURL);
    for (let url of urls) {
        pages = await crawlPage(baseURL, url, pages);
    }

    return pages;
}