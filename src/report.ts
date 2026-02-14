import * as fs from "node:fs";
import * as path from "node:path";
import { ExtractedPageData } from "./crawl.ts";

export function writeCSVReport(
  pageData: Record<string, ExtractedPageData>,
  filename = "report.csv",
): void {
    if (!pageData || Object.keys(pageData).length === 0) {
        console.log("No data to write to CSV");
        return;
    }

    // Ensuring the file is written relative to where the script is ran
    const file = path.resolve(process.cwd(), filename);
    const headers = [
        "page_url",
        "h1",
        "first_paragraph",
        "outgoing_link_urls",
        "image_urls"
    ];

    // Initialize the CSV rows, starting with the header row
    const rows: string[] = [headers.join(",")];

    // Adding rows with the values received from pageData, sorted by url
    for (const page of Object.values(pageData).sort((a, b) => a.url.localeCompare(b.url))) {
        let pageValues = [page.url, page.h1, page.first_paragraph, page.outgoing_links.join(";"), page.image_urls.join(";")];
        pageValues = pageValues.map(pageValue => csvEscape(pageValue));
        rows.push(pageValues.join(","));
    }

    let rowsToString = rows.join("\n");
    console.log(`Writing report to ${file}`);

    // Write the joined rows to the disk
    fs.writeFileSync(file, rowsToString);
};

/*
    Ensuring string field is safe for CSV format.
    If the field contains quotes, commas or newlines, it must be wrapped in double quotes.
    Internal double quotes are escaped by doubling them.
*/
function csvEscape(field: string) {
    const str = field ?? "";
    const needsQuoting = /[",\n]/.test(str);
    const escaped = str.replace(/"/g, '""');
    return needsQuoting ? `"${escaped}"` : escaped;
}