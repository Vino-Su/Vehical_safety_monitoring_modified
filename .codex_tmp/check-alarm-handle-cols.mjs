import fs from 'node:fs';

const file = process.argv[2];
const html = fs.readFileSync(file, 'utf8');

const th = [...html.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
console.log(`TH(${th.length}): ${JSON.stringify(th)}`);

const tbody = html.match(/<tbody id="eventRows">([\s\S]*?)<\/tbody>/);
if (!tbody) {
  console.log('tbody#eventRows: NOT FOUND');
} else {
  const rows = [...tbody[1].matchAll(/<tr[\s\S]*?<\/tr>/g)];
  console.log(`ROWS: ${rows.length}`);
  rows.slice(0, 3).forEach((r, i) => {
    const cells = [...r[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => c[1].replace(/<[^>]+>/g, '').trim());
    console.log(`ROW${i + 1}(${cells.length}): ${JSON.stringify(cells)}`);
  });
}

const pagination = html.match(/class="[^"]*pg-[^"]*"/g);
console.log(`pagination nodes: ${pagination ? [...new Set(pagination)].join(' | ') : 'none'}`);
