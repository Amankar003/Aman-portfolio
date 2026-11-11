import { build } from 'esbuild';
import fs from 'fs';
const r = await build({ entryPoints: ['src/index.jsx'], bundle: true, minify: !process.env.DEV, write: false, outdir: '.', format: 'iife', target: ['es2020'], jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, loader: { '.css': 'css' }, legalComments: 'none' });
let js = '', css = '';
for (const f of r.outputFiles) { if (f.path.endsWith('.js')) js = f.text; else if (f.path.endsWith('.css')) css = f.text; }
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Aman Kar | AI/ML Engineer</title>
<meta name="description" content="Aman Kar, AI/ML Engineer. RAG systems, multi-agent AI and ML models. Explore my work by driving through an interactive 3D world.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@500;600;700&display=swap" rel="stylesheet">
<style>${css}</style></head><body><div id="root"></div><script>${js.replace(/<\/script/g, '<\\/script')}</script></body></html>`;
fs.writeFileSync('index.html', html);
console.log('built', (html.length / 1024).toFixed(0) + ' KB');

// Create a 404.html for GitHub Pages
fs.writeFileSync('404.html', html);
