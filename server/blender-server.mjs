// SPDX-License-Identifier: GPL-2.0-or-later
// Minimal static server for the real Blender WebAssembly release.
// Guarantees same-origin isolation for Emscripten pthreads/SharedArrayBuffer.
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { resolve, sep, extname } from 'node:path';

const root = resolve(process.env.BLENDER_PUBLIC_DIR || 'full-dist');
const port = Number(process.env.PORT || 8080);
const mime = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
  '.wasm':'application/wasm', '.zst':'application/zstd',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg', '.webp':'image/webp', '.ico':'image/x-icon',
  '.txt':'text/plain; charset=utf-8',
};
function error(res, code, body) {
  res.writeHead(code, {'Content-Type':'text/plain; charset=utf-8', 'Cache-Control':'no-store'});
  res.end(body);
}

const server = createServer((req,res)=>{
  res.setHeader('Cross-Origin-Opener-Policy','same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy','require-corp');
  res.setHeader('Cross-Origin-Resource-Policy','same-origin');
  res.setHeader('X-Content-Type-Options','nosniff');
  if (req.method !== 'GET' && req.method !== 'HEAD') return error(res,405,'Method Not Allowed');
  let name;
  try {
    name = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  } catch {
    return error(res,400,'Bad URL');
  }
  if (name.includes('\\') || name.split('/').includes('..') || name.includes('\0')) {
    return error(res,403,'Forbidden');
  }
  let file = resolve(root, '.'+name);
  if (file !== root && !file.startsWith(root+sep)) return error(res,403,'Forbidden');
  let info;
  try {
    info=statSync(file);
    if (info.isDirectory()) {
      file=resolve(file,'index.html');
      if (file !== root && !file.startsWith(root+sep)) return error(res,403,'Forbidden');
      info=statSync(file);
    }
    if (!info.isFile()) return error(res,404,'Not Found');
  } catch {
    return error(res,404,'Not Found');
  }

  res.setHeader('Content-Type',mime[extname(file).toLowerCase()] || 'application/octet-stream');
  res.setHeader('Accept-Ranges','bytes');
  res.setHeader('Cache-Control', /\/assets\//.test(name) ?
    'public, max-age=31536000, immutable' : 'public, max-age=300');
  let start=0,end=info.size-1, status=200;
  if (req.headers.range) {
    const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if (!m || (!m[1] && !m[2])) {
      res.setHeader('Content-Range',`bytes */${info.size}`);
      return error(res,416,'Invalid Range');
    }
    if (!m[1]) {
      const count=Number(m[2]);
      if (!Number.isSafeInteger(count) || count<=0) return error(res,416,'Invalid Range');
      start=Math.max(0,info.size-count);
    } else {
      start=Number(m[1]);
      end=m[2]?Number(m[2]):end;
    }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) ||
        start> end || start>=info.size) {
      res.setHeader('Content-Range',`bytes */${info.size}`);
      return error(res,416,'Invalid Range');
    }
    end=Math.min(end,info.size-1);
    status=206;
    res.setHeader('Content-Range',`bytes ${start}-${end}/${info.size}`);
  }
  res.setHeader('Content-Length',end-start+1);
  res.writeHead(status);
  if (req.method==='HEAD') return res.end();
  createReadStream(file,{start,end}).on('error',()=>{
    if (!res.headersSent) error(res,500,'Read Error');
    else res.destroy();
  }).pipe(res);
});
server.listen(port,'0.0.0.0',()=>console.log(`Blender WASM listening on port ${port}; public directory ${root}`));
