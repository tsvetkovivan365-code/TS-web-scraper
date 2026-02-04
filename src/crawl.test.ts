import { expect, test } from 'vitest';
import { normalizeURL } from './crawl.js';

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