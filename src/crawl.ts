import { JSDOM } from "jsdom";

export function normalizeURL(url: string): string {
        const receivedURL = new URL(url)
        let fullPath = receivedURL.hostname.toLowerCase() + receivedURL.pathname.toLowerCase()
        if (fullPath.endsWith('/')) {
                fullPath = fullPath.substring(0, fullPath.length - 1)
        }

        return fullPath
}

export function getH1FromHTML(html: string): string {
        const dom = new JSDOM(html);
        let firstH1 = dom.window.document.getElementsByTagName("h1")[0]
        if (!firstH1) {
                return ""
        }
        let firstH1Text = firstH1?.textContent ?? "";
        return firstH1Text
}

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