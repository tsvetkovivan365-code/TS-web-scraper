import { expect, test } from 'vitest';
import { normalizeURL, getH1FromHTML } from './crawl.js';

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