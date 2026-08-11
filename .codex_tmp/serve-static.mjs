import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

const root = resolve(process.cwd());
const types = { '.css':'text/css', '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.json':'application/json', '.svg':'image/svg+xml' };

createServer(async (request, response) => {
  const pathname = decodeURIComponent((request.url || '/').split('?')[0]);
  const target = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!target.startsWith(root)) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  try {
    response.writeHead(200, { 'content-type': types[extname(target)] || 'application/octet-stream' });
    response.end(await readFile(target));
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(8899);
