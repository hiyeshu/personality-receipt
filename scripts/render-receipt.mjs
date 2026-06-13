#!/usr/bin/env node

/**
 * [INPUT]: 依赖 app/index.html、app/app.js、app.v1 小票 JSON、可选本地 typeImage/typeImageMode 和本机 Chrome/Chromium
 * [OUTPUT]: 对外提供 app.v1/legacy receipt JSON -> normalized JSON + app HTML fixture + app canvas -> PNG 的非交互渲染命令，stdout 输出结构化 JSON
 * [POS]: scripts 的核心 renderer，只做 JSON 规范化、HTML 固化和 app 导出包装，不拥有人格判断逻辑
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const VIEWPORT_WIDTH = 412;
const VIEWPORT_HEIGHT = 1100;
const EXPORT_SCALE = 2;
const EXPORT_TIMEOUT_MS = 30000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..');
const REFERENCE_RARITY = Object.freeze({
  '白猫': '8.0%',
  '狐狸': '6.5%',
  '水母': '4.0%',
  '兔子': '9.5%',
  '章鱼': '3.2%',
  '猫头鹰': '2.8%',
  '云团': '14.0%'
});

function help() {
  return `Usage: node scripts/render-receipt.mjs INPUT.json [options]

Render a personality receipt PNG through the canonical app page.

Options:
  --output FILE      PNG output path. Default: outputs/<receiptId>.png
  --json-output FILE JSON output path. Default: same basename as PNG with .json
  --html-output FILE HTML fixture output path. Default: same basename as PNG with .html
  --chrome FILE      Chrome/Chromium executable path. Default: auto-detect
  --width PX         Browser viewport width. Default: ${VIEWPORT_WIDTH}
  --height PX        Browser viewport height. Default: ${VIEWPORT_HEIGHT}
  --scale N          PNG export scale. Default: ${EXPORT_SCALE}
  --help             Show this help text

Input:
  Preferred: personality-receipt.app.v1 JSON from assets/receipt-model-template.json.
  Legacy flat receipt JSON is accepted and mapped into app.v1.

Example:
  node scripts/render-receipt.mjs assets/sample-receipt.json --output outputs/PR_DEMO.png
`;
}

function parseArgs(argv) {
  const args = {
    input: null,
    output: null,
    jsonOutput: null,
    htmlOutput: null,
    chrome: null,
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT,
    scale: EXPORT_SCALE,
    help: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--output') {
      args.output = argv[++i];
    } else if (arg === '--json-output') {
      args.jsonOutput = argv[++i];
    } else if (arg === '--html-output') {
      args.htmlOutput = argv[++i];
    } else if (arg === '--chrome') {
      args.chrome = argv[++i];
    } else if (arg === '--width') {
      args.width = Number.parseInt(argv[++i], 10);
    } else if (arg === '--height') {
      args.height = Number.parseInt(argv[++i], 10);
    } else if (arg === '--scale') {
      args.scale = Number.parseFloat(argv[++i]);
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`);
    } else if (!args.input) {
      args.input = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  return args;
}

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read JSON: ${file}\n${error.message}`);
  }
}

function safeFileName(value) {
  return String(value || 'receipt').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function defaultSidecarOutput(output, suffix) {
  const normalizedSuffix = suffix.startsWith('.') ? suffix : `.${suffix}`;
  const extension = path.extname(output);
  if (!extension) return `${output}${normalizedSuffix}`;
  return `${output.slice(0, -extension.length)}${normalizedSuffix}`;
}

function rarityForType(type) {
  return REFERENCE_RARITY[String(type || '').trim()] || REFERENCE_RARITY['云团'];
}

function resolveImagePath(imagePath, inputPath) {
  if (!imagePath) return '';
  if (/^data:image\//.test(imagePath) || /^https?:\/\//.test(imagePath)) return imagePath;

  const resolved = path.isAbsolute(imagePath)
    ? imagePath
    : path.resolve(path.dirname(inputPath), imagePath);

  if (!existsSync(resolved)) {
    throw new Error(`typeImage not found: ${imagePath}`);
  }

  return pathToFileURL(resolved).href;
}

function requireFields(object, fields, label) {
  const missing = fields.filter((field) => object[field] === undefined || object[field] === null || object[field] === '');
  if (missing.length) {
    throw new Error(`Missing required ${label} fields: ${missing.join(', ')}`);
  }
}

function normalizeTypeMode(mode) {
  const value = mode || 'thermal';
  if (!['clean', 'stamp', 'thermal'].includes(value)) {
    throw new Error('typeImageMode must be one of: clean, stamp, thermal');
  }
  return value;
}

function normalizeGlyph(rawGlyph, warnings) {
  if (rawGlyph === undefined || rawGlyph === null) return '';

  const glyph = Array.isArray(rawGlyph) ? rawGlyph.join('\n') : String(rawGlyph);
  const lines = glyph.split('\n');
  if (lines.length > 5) warnings.push('typeGlyph should be 5 lines or fewer');
  lines.forEach((line, index) => {
    if (line.length > 24) warnings.push(`typeGlyph line ${index + 1} is wider than 24 characters`);
  });
  return glyph;
}

function normalizeAppV1(data, warnings, inputPath) {
  const receipt = data.receipt || {};
  requireFields(receipt, [
    'time',
    'receiptId',
    'mbti',
    'energy',
    'decision',
    'stress',
    'collab',
    'total',
    'type',
    'verdict'
  ], 'receipt');

  const typeImage = resolveImagePath(data.typeImage || '', inputPath);
  const typeGlyph = normalizeGlyph(data.typeGlyph, warnings);
  if (!typeImage && !typeGlyph) {
    throw new Error('Missing required type mark: provide typeImage or typeGlyph');
  }

  return {
    _contract: 'personality-receipt.app.v1',
    theme: data.theme || 'dailv',
    typeImage,
    typeImageMode: normalizeTypeMode(data.typeImageMode),
    typeGlyph,
    receipt: {
      heading: receipt.heading || 'RECEIPT',
      cashier: receipt.cashier || 'CASHIER',
      cashierValue: receipt.cashierValue || 'MODEL',
      payment: receipt.payment || 'PAYMENT',
      paymentValue: receipt.paymentValue || 'YESHU',
      dateLine: receipt.dateLine || 'DATE',
      time: receipt.time,
      counter: receipt.counter || 'NO.001',
      receiptId: receipt.receiptId,
      mbti: receipt.mbti,
      energy: receipt.energy,
      decision: receipt.decision,
      stress: receipt.stress,
      collab: receipt.collab,
      total: receipt.total,
      type: receipt.type,
      rarity: receipt.rarity || rarityForType(receipt.type),
      verdict: receipt.verdict,
      barcode: receipt.barcode || '||| ||||| || ||| | |||'
    }
  };
}

function normalizeLegacy(data, warnings, inputPath) {
  requireFields(data, ['receiptId', 'date', 'mbti', 'items', 'total', 'type', 'verdict'], 'legacy receipt');
  requireFields(data.items, ['Energy', 'Decision', 'Stress', 'Collab'], 'legacy items');

  const typeImage = resolveImagePath(data.typeImage || '', inputPath);
  const typeGlyph = normalizeGlyph(data.typeGlyph, warnings);
  if (!typeImage && !typeGlyph) {
    throw new Error('Missing required type mark: provide typeImage or typeGlyph');
  }

  if (data.typeImageOptions) {
    warnings.push('typeImageOptions ignored; app renderer uses typeImageMode presets');
  }

  return {
    _contract: 'personality-receipt.app.v1',
    theme: data.theme || 'dailv',
    typeImage,
    typeImageMode: normalizeTypeMode(data.typeImageMode),
    typeGlyph,
    receipt: {
      heading: data.heading || 'RECEIPT',
      cashier: data.cashier || 'CASHIER',
      cashierValue: data.cashierValue || 'MODEL',
      payment: data.payment || 'PAYMENT',
      paymentValue: data.paymentValue || 'YESHU',
      dateLine: data.dateLine || 'DATE',
      time: data.date,
      counter: data.counter || 'NO.001',
      receiptId: data.receiptId,
      mbti: data.mbti,
      energy: data.items.Energy,
      decision: data.items.Decision,
      stress: data.items.Stress,
      collab: data.items.Collab,
      total: data.total,
      type: data.type,
      rarity: data.rarity || rarityForType(data.type),
      verdict: data.verdict,
      barcode: data.barcode || '||| ||||| || ||| | |||'
    }
  };
}

function normalizeReceipt(data, warnings, inputPath) {
  if (data._contract === 'personality-receipt.app.v1' || data.receipt) {
    return normalizeAppV1(data, warnings, inputPath);
  }
  return normalizeLegacy(data, warnings, inputPath);
}

function jsonForScript(value) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}

function buildExportHtml(payload, scale) {
  const indexPath = path.join(skillRoot, 'app', 'index.html');
  const appJsUrl = pathToFileURL(path.join(skillRoot, 'app', 'app.js')).href;
  const indexHtml = readFileSync(indexPath, 'utf8');
  const bootScript = [
    '<script>',
    `window.PERSONALITY_RECEIPT_BOOTSTRAP = ${jsonForScript(payload)};`,
    `window.PERSONALITY_RECEIPT_EXPORT_SCALE = ${JSON.stringify(scale)};`,
    'window.PERSONALITY_RECEIPT_AUTO_REPLAY = false;',
    '</script>',
    `<script src="${appJsUrl}"></script>`
  ].join('\n');

  if (!indexHtml.includes('<script src="app.js"></script>')) {
    throw new Error('app/index.html no longer contains <script src="app.js"></script>');
  }

  return indexHtml.replace('<script src="app.js"></script>', bootScript);
}

function commandExists(command) {
  const result = spawnSync(command, ['--version'], { stdio: 'ignore' });
  return result.status === 0;
}

function detectChrome(explicit) {
  const candidates = [
    explicit,
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    'google-chrome',
    'chromium',
    'chromium-browser'
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate.includes('/') && existsSync(candidate)) return candidate;
    if (!candidate.includes('/') && commandExists(candidate)) return candidate;
  }

  throw new Error('Chrome/Chromium not found. Pass --chrome /path/to/chrome or set CHROME_PATH.');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForDebugPort(child) {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Chrome did not expose a DevTools endpoint.'));
    }, EXPORT_TIMEOUT_MS);

    function cleanup() {
      clearTimeout(timer);
      child.stderr.off('data', onData);
      child.stdout.off('data', onData);
      child.off('error', onError);
      child.off('close', onClose);
    }

    function onData(chunk) {
      buffer += chunk.toString();
      const match = buffer.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//);
      if (match) {
        cleanup();
        resolve(Number(match[1]));
      }
    }

    function onError(error) {
      cleanup();
      reject(error);
    }

    function onClose(code) {
      cleanup();
      reject(new Error(`Chrome exited before DevTools was ready with code ${code}\n${buffer}`));
    }

    child.stderr.on('data', onData);
    child.stdout.on('data', onData);
    child.once('error', onError);
    child.once('close', onClose);
  });
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Chrome DevTools HTTP ${response.status}: ${await response.text()}`);
  }
  return await response.json();
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });

    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) {
          reject(new Error(`${message.error.message}: ${message.error.data || ''}`));
        } else {
          resolve(message.result || {});
        }
        return;
      }
      this.events.push(message);
    });
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    const payload = JSON.stringify({ id, method, params });
    const promise = new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
    this.ws.send(payload);
    return promise;
  }

  close() {
    this.ws.close();
  }
}

async function waitForRuntimeValue(cdp, expression, timeoutMs = EXPORT_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await cdp.send('Runtime.evaluate', {
      expression,
      returnByValue: true
    });
    if (result.result?.value) return;
    await sleep(100);
  }
  throw new Error(`Timed out waiting for: ${expression}`);
}

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  });

  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed');
  }

  return result.result?.value;
}

async function runChromeExport(chrome, htmlPath, width, height, profileDir) {
  if (typeof WebSocket !== 'function') {
    throw new Error('Node.js WebSocket global is required for Chrome DevTools export.');
  }

  const args = [
    '--headless=new',
    '--disable-gpu',
    '--disable-background-networking',
    '--disable-sync',
    '--metrics-recording-only',
    '--disable-default-apps',
    '--no-service-autorun',
    '--disable-features=MediaRouter,OptimizationHints',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--allow-file-access-from-files',
    `--user-data-dir=${profileDir}`,
    `--window-size=${width},${height}`,
    '--remote-debugging-port=0',
    'about:blank'
  ];

  const child = spawn(chrome, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let cdp;

  try {
    const port = await waitForDebugPort(child);
    const target = await fetchJson(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
    cdp = new CdpClient(target.webSocketDebuggerUrl);
    await cdp.open();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Page.navigate', { url: pathToFileURL(htmlPath).href });
    await waitForRuntimeValue(cdp, 'Boolean(window.personalityReceiptApp)');
    await evaluate(cdp, 'window.personalityReceiptApp.ready');
    return await evaluate(cdp, 'window.personalityReceiptApp.exportPngDataUrl()');
  } finally {
    if (cdp) cdp.close();
    child.kill('SIGTERM');
    await sleep(200);
    if (!child.killed) child.kill('SIGKILL');
  }
}

function writePngFromDataUrl(dataUrl, output) {
  const prefix = 'data:image/png;base64,';
  if (!dataUrl.startsWith(prefix)) {
    throw new Error('Exported data URL is not a PNG.');
  }

  const buffer = Buffer.from(dataUrl.slice(prefix.length), 'base64');
  if (buffer.subarray(1, 4).toString('utf8') !== 'PNG') {
    throw new Error('Decoded export is not a PNG.');
  }

  writeFileSync(output, buffer);
  return buffer.length;
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    fail(`${error.message}\n\n${help()}`);
  }

  if (args.help) {
    console.log(help());
    return;
  }

  if (!args.input) fail(`Error: INPUT.json is required.\n\n${help()}`);
  if (!Number.isFinite(args.width) || args.width < 320) fail('Error: --width must be at least 320.');
  if (!Number.isFinite(args.height) || args.height < 600) fail('Error: --height must be at least 600.');
  if (!Number.isFinite(args.scale) || args.scale <= 0) fail('Error: --scale must be a positive number.');

  const inputPath = path.resolve(args.input);
  const warnings = [];
  const tmp = mkdtempSync(path.join(tmpdir(), 'personality-receipt-'));

  try {
    const payload = normalizeReceipt(readJson(inputPath), warnings, inputPath);
    const html = buildExportHtml(payload, args.scale);
    const profileDir = path.join(tmp, 'chrome-profile');
    const output = path.resolve(args.output || path.join(skillRoot, 'outputs', `${safeFileName(payload.receipt.receiptId)}.png`));
    const jsonOutput = path.resolve(args.jsonOutput || defaultSidecarOutput(output, '.json'));
    const htmlOutput = path.resolve(args.htmlOutput || defaultSidecarOutput(output, '.html'));

    if (new Set([output, jsonOutput, htmlOutput]).size !== 3) {
      throw new Error('JSON, HTML, and PNG output paths must be different.');
    }

    mkdirSync(path.dirname(output), { recursive: true });
    mkdirSync(path.dirname(jsonOutput), { recursive: true });
    mkdirSync(path.dirname(htmlOutput), { recursive: true });
    mkdirSync(profileDir, { recursive: true });
    rmSync(output, { force: true });
    if (jsonOutput !== inputPath) rmSync(jsonOutput, { force: true });
    rmSync(htmlOutput, { force: true });
    if (jsonOutput !== inputPath) writeFileSync(jsonOutput, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    writeFileSync(htmlOutput, html, 'utf8');

    const chrome = detectChrome(args.chrome);
    const dataUrl = await runChromeExport(chrome, htmlOutput, args.width, args.height, profileDir);
    const bytes = writePngFromDataUrl(dataUrl, output);

    console.log(JSON.stringify({
      ok: true,
      output,
      jsonOutput,
      htmlOutput,
      bytes,
      contract: payload._contract,
      receiptId: payload.receipt.receiptId,
      viewportWidth: args.width,
      viewportHeight: args.height,
      scale: args.scale,
      warnings
    }, null, 2));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

main().catch((error) => fail(error.message));
