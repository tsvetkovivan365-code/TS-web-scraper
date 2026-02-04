import { expect, test } from 'vitest';
import { normalizeURL, getH1FromHTML, getFirstParagraphFromHTML, getURLsFromHTML } from './crawl.js';

test('https url to directory equals blog.cake.dev/path', () => {
        expect(normalizeURL("https://blog.cake.dev/path/")).toBe("blog.cake.dev/path")
})

test('https url to page equals blog.cake.dev/path', () => {
        expect(normalizeURL("https://blog.cake.dev/path")).toBe("blog.cake.dev/path")
})

test('http url to directory equals blog.cake.dev/path', () => {
        expect(normalizeURL("http://blog.cake.dev/path/")).toBe("blog.cake.dev/path")
})

test('http url to file equals blog.cake.dev/path', () => {
        expect(normalizeURL("http://blog.cake.dev/path")).toBe("blog.cake.dev/path")
})

test("getH1FromHTML basic", () => {
  const inputBody = `<html><body><h1>Test Title</h1></body></html>`;
  const actual = getH1FromHTML(inputBody);
  const expected = "Test Title";
  expect(actual).toEqual(expected);
});

test("getH1FromHTML no h1", () => {
  const inputBody = `<html><body><p>No H1 here</p></body></html>`;
  const actual = getH1FromHTML(inputBody);
  const expected = "";
  expect(actual).toEqual(expected);
});

test("getFirstParagraphFromHTML main priority", () => {
  const inputBody = `
    <html><body>
      <p>Outside paragraph.</p>
      <main>
        <p>Main paragraph.</p>
      </main>
    </body></html>
  `;
  const actual = getFirstParagraphFromHTML(inputBody);
  const expected = "Main paragraph.";
  expect(actual).toEqual(expected);
});

test("getFirstParagraphFromHTML fallback to first p", () => {
  const inputBody = `
    <html><body>
      <p>First outside paragraph.</p>
      <p>Second outside paragraph.</p>
    </body></html>`;
  const actual = getFirstParagraphFromHTML(inputBody);
  const expected = "First outside paragraph.";
  expect(actual).toEqual(expected);
});

test("getFirstParagraphFromHTML no paragraphs", () => {
  const inputBody = `<html><body><h1>Title</h1></body></html>`;
  const actual = getFirstParagraphFromHTML(inputBody);
  const expected = "";
  expect(actual).toEqual(expected);
});

test("getURLsFromHTML absolute", () => {
  const inputURL = "https://blog.boot.dev";
  const inputBody = `<html><body><a href="https://blog.boot.dev"><span>Boot.dev</span></a></body></html>`;
  const actual = getURLsFromHTML(inputBody, inputURL);
  const expected = ["https://blog.boot.dev/"];
  expect(actual).toEqual(expected);
});

test("getURLsFromHTML relative", () => {
  const inputURL = "https://blog.boot.dev";
  const inputBody = `<html><body><a href="/path/one"><span>Boot.dev</span></a></body></html>`;
  const actual = getURLsFromHTML(inputBody, inputURL);
  const expected = ["https://blog.boot.dev/path/one"];
  expect(actual).toEqual(expected);
});

test("getURLsFromHTML both absolute and relative", () => {
  const inputURL = "https://blog.boot.dev";
  const inputBody =
    `<html><body>` +
    `<a href="/path/one"><span>Boot.dev</span></a>` +
    `<a href="https://other.com/path/one"><span>Boot.dev</span></a>` +
    `</body></html>`;
  const actual = getURLsFromHTML(inputBody, inputURL);
  const expected = [
    "https://blog.boot.dev/path/one",
    "https://other.com/path/one",
  ];
  expect(actual).toEqual(expected);
});