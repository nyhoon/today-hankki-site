import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile(new URL('./push.html', import.meta.url), 'utf8');
const categories = ['expiry', 'recipes', 'shopping', 'kitchen', 'operator'];

test('push landing page provides guidance for every supported category', () => {
  for (const category of categories) assert.match(page, new RegExp(`${category}: \\[`));
  assert.match(page, /\[eyebrow, title, body\] = copy\[key\] \?\? defaultCopy/);
  assert.match(page, /const defaultCopy = copy\.operator/);
});

test('push landing page uses safe text rendering and keeps the app link fixed', () => {
  assert.match(page, /getElementById\('push-eyebrow'\)\.textContent/);
  assert.match(page, /getElementById\('push-title'\)\.textContent/);
  assert.match(page, /getElementById\('push-body'\)\.textContent/);
  assert.doesNotMatch(page, /\.innerHTML/);
  assert.match(page, /href="todayhankki:\/\/"/);
  assert.match(page, /new URLSearchParams\(location\.search\)\.get\('category'\)/);
  assert.doesNotMatch(page, /get\('(title|body|user|recipient)'\)/);
});
