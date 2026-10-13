// Captures fresh screenshots of the sites linked from the home page.
// Runs in GitHub Actions (.github/workflows/screenshots.yml); output goes to assets/shots/.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const SITES = [
  { slug: 'doug-ia-br',      url: 'https://doug.ia.br' },
  { slug: 'dsiqueira-com',   url: 'https://dsiqueira.com' },
  { slug: 'agentchaos',      url: 'https://agentchaos.org' },
  { slug: 'dougdrops',       url: 'https://doug.ia.br/dougdrops' },
  { slug: 'bitabit',         url: 'https://bitabit.doug.ia.br' },
  { slug: 'bitabit-mobile',  url: 'https://bitabit.doug.ia.br', mobile: true },
  { slug: 'vibedoc',         url: 'https://doug.ia.br/vibedoc' },
  { slug: 'cnpj-hub',        url: 'https://doug.ia.br/experimento/cnpj-hub' },
  { slug: 'cyberkey',        url: 'https://dssiqueira.github.io/random-keygen-generator/' },
];

await mkdir('assets/shots', { recursive: true });
const browser = await chromium.launch();
let failures = 0;

for (const site of SITES) {
  const context = await browser.newContext(site.mobile
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  try {
    const res = await page.goto(site.url, { waitUntil: 'networkidle', timeout: 45000 })
      .catch(() => page.goto(site.url, { waitUntil: 'load', timeout: 45000 }));
    if (!res || res.status() >= 400) throw new Error(`HTTP ${res ? res.status() : 'no response'}`);
    await page.waitForTimeout(2500); // let fonts, images and entrance animations settle
    await page.screenshot({ path: `assets/shots/${site.slug}.jpg`, type: 'jpeg', quality: 82 });
    console.log(`ok   ${site.slug}  ${site.url}`);
  } catch (err) {
    failures++;
    console.log(`fail ${site.slug}  ${site.url}  ${err.message}`);
  }
  await context.close();
}

await browser.close();
// Keep going with whatever was captured; only fail if everything failed.
if (failures === SITES.length) process.exit(1);
