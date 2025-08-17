// screenshot.ts
import { chromium } from 'playwright';
for (const v of [{w:1280,h:800,p:'public/screenshots/desktop-1280x800.png'},
                 {w:750,h:1334,p:'public/screenshots/mobile-750x1334.png'}]) {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width:v.w, height:v.h }});
  await p.goto('http://localhost:4173', { waitUntil: 'networkidle' });
  await p.screenshot({ path: v.p });
  await b.close();
}