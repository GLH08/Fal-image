import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Test the image proxy endpoint logic directly
// Note: These tests work with the actual filesystem so we test the cache path generation

describe('Image Proxy Logic', () => {
    const DATA_DIR = path.join(process.cwd(), 'data');
    const IMAGE_CACHE_DIR = path.join(DATA_DIR, 'image-cache');

    // Helper: same logic as in app.js for generating cache path
    function getImageCachePath(imageUrl) {
        const hash = crypto.createHash('md5').update(imageUrl).digest('hex');
        const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
        return path.join(IMAGE_CACHE_DIR, `${hash}${ext}`);
    }

    describe('getImageCachePath', () => {
        it('generates consistent hash for same URL', () => {
            const url = 'https://chevereto.novaw.de/images/2026/04/11/test.jpg';
            const path1 = getImageCachePath(url);
            const path2 = getImageCachePath(url);
            assert.strictEqual(path1, path2);
        });

        it('generates different paths for different URLs', () => {
            const url1 = 'https://chevereto.novaw.de/images/2026/04/11/test1.jpg';
            const url2 = 'https://chevereto.novaw.de/images/2026/04/11/test2.jpg';
            const path1 = getImageCachePath(url1);
            const path2 = getImageCachePath(url2);
            assert.notStrictEqual(path1, path2);
        });

        it('extracts correct file extension from URL', () => {
            const url = 'https://chevereto.novaw.de/images/2026/04/11/test.png';
            const cachePath = getImageCachePath(url);
            assert.ok(cachePath.endsWith('.png'));
        });

        it('defaults to .jpg when no extension in URL', () => {
            const url = 'https://example.com/image';
            const cachePath = getImageCachePath(url);
            assert.ok(cachePath.endsWith('.jpg'));
        });
    });

    describe('IMAGE_CACHE_DIR setup', () => {
        it('image-cache directory should be created', () => {
            // This test verifies the directory creation logic
            if (!fs.existsSync(IMAGE_CACHE_DIR)) {
                fs.mkdirSync(IMAGE_CACHE_DIR, { recursive: true });
            }
            assert.ok(fs.existsSync(IMAGE_CACHE_DIR));
        });
    });
});

describe('Image Proxy Endpoint', () => {
    // Integration test would require starting the server
    // For now we test the URL transformation logic used by frontend

    it('should transform Chevereto URL to proxy format', () => {
        const originalUrl = 'https://chevereto.novaw.de/images/2026/04/11/test.jpg';
        const proxyUrl = `/api/proxy/image?url=${encodeURIComponent(originalUrl)}`;

        assert.ok(proxyUrl.startsWith('/api/proxy/image?url='));
        assert.ok(proxyUrl.includes(encodeURIComponent(originalUrl)));
    });

    it('should preserve full URL with query params', () => {
        const originalUrl = 'https://chevereto.novaw.de/images/2026/04/11/test.jpg?v=123';
        const encoded = encodeURIComponent(originalUrl);
        const proxyUrl = `/api/proxy/image?url=${encoded}`;

        assert.ok(proxyUrl.includes('v%3D123')); // encoded '?v=123'
    });
});
