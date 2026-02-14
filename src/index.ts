import { argv } from "node:process";
import { crawlSiteAsync } from "./crawl.js";

async function main() {
    if (argv.length < 5) {
        console.error("not enough arguments provided");
        process.exit(1);
    }
    if (argv.length > 5) {
        console.error("too many arguments provided");
        process.exit(1);
    }

    const baseURL: string = argv[2];
    const maxConcurrency: number = Number(argv[3]);
    const maxPages: number = Number(argv[4]);

    if (!Number.isFinite(maxConcurrency) || maxConcurrency < 1 ) {
        console.error("maxConcurrency argument needs to be a number > 0");
        process.exit(1);
    }

    if (!Number.isFinite(maxPages) || maxPages < 1) {
        console.error("maxPages argument needs to be a number > 0");
        process.exit(1);
    }

    console.log(`Starting crawl of: ${baseURL}`);

    const pages = await crawlSiteAsync(baseURL, maxConcurrency, maxPages);

    console.log("Finished crawling.");
    console.log(Object.keys(pages).length)
    const firstPage = Object.values(pages)[0];
    if (firstPage) {
        console.log(`First page record: ${firstPage["url"]} - ${firstPage["h1"]}`);
    }
}

main();