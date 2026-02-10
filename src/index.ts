import { argv } from "node:process";
import { crawlPage } from "./crawl.js";

async function main() {
    if (argv.length < 3) {
        console.error("Less than 1 argument provided");
        process.exit(1);
    }
    if (argv.length > 3) {
        console.error("More than 1 argument provided");
        process.exit(1);
    }

    const baseURL: string = process.argv[2];

    console.log(`Starting crawl of: ${baseURL}`);

    const pages = await crawlPage(baseURL);
    console.log(pages);

    process.exit(0);
}

main();