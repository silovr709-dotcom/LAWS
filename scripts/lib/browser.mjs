import path from 'node:path';
import { pathToFileURL } from 'node:url';
export async function launchBrowser() {
// Optional QA tools live outside the app dependency tree. See docs/QA.md.
const tools = path.resolve(process.env.AUDIT_TOOLS_DIR ?? '.cache/audit-tools/node_modules');
const load = (relative) => import(pathToFileURL(path.join(tools, relative)).href);
const { chromium } = await load('playwright-core/index.mjs');
let executablePath = process.env.BROWSER_EXECUTABLE;
let args = [];
if (!executablePath) {
  const { default: bundled } = await load('@sparticuz/chromium/build/index.js');
  if (process.platform === 'linux') {
    const { inflate } = await load('@sparticuz/chromium/build/lambdafs.js');
    const { setupLambdaEnvironment } = await load('@sparticuz/chromium/build/helper.js');
    await inflate(path.join(tools, '@sparticuz/chromium/bin/al2023.tar.br'));
    setupLambdaEnvironment('/tmp/al2023/lib');
  }
  executablePath = await bundled.executablePath();
  args = bundled.args.filter(arg => arg !== '--single-process');
}
return { browser: await chromium.launch({ executablePath, args, headless: true }), tools };
}
