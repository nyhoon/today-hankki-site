import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const months = JSON.parse(await readFile(new URL('./seasonal-data.json', import.meta.url)));
const seasonalScript = await readFile(new URL('./seasonal.js', import.meta.url), 'utf8');
const seasonalHtml = await readFile(new URL('./seasonal.html', import.meta.url), 'utf8');

assert.equal(months.length, 12, 'the guide must cover every month');
assert.deepEqual(months.map(({ month }) => month), Array.from({ length: 12 }, (_, i) => i + 1));

for (const month of months) {
  assert.equal(month.items.length, 10, `${month.month}월 needs ten seasonal items`);
  assert.equal(month.items.filter(({ category }) => category === 'produce').length, 5, `${month.month}월 needs five produce items`);
  assert.equal(month.items.filter(({ category }) => category === 'seafood').length, 5, `${month.month}월 needs five seafood items`);
  assert.ok(month.sources.length > 0, `${month.month}월 needs a source`);
  for (const source of month.sources) {
    assert.ok(source.title && source.date, `${month.month}월 source needs title and date`);
    assert.equal(new URL(source.url).protocol, 'https:');
  }
  for (const item of month.items) {
    assert.ok(item.id && item.name && item.note, `${month.month}월 item needs an id, name, and note`);
    assert.ok(['produce', 'seafood'].includes(item.category), `${item.name} has an unknown category`);
    assert.ok(month.sources[item.sourceIndex], `${item.name} must point to a source`);
  }
}

assert.doesNotMatch(seasonalScript, /source\.url|seasonal-card-source|seasonal-sources-list/, 'seasonal page should not render source URLs');
assert.doesNotMatch(seasonalHtml, /seasonal-sources-list|seasonal-sources/, 'seasonal page should not show a source-link section');
console.log('seasonal data: 12 months with 5 produce and 5 seafood items each');
