import { JSDOM } from "jsdom";

export function normalizeURL(url: string): string {
        const receivedURL = new URL(url)
        let fullPath = receivedURL.hostname.toLowerCase() + receivedURL.pathname.toLowerCase()
        if (fullPath.endsWith('/')) {
                fullPath = fullPath.substring(0, fullPath.length - 1)
        }

        return fullPath
}