#!/usr/bin/env node

/**
 * [INPUT]: 依赖 assets/receipt-card.html 的固定模板、公开 receipt JSON 的 match/mbti/type/rarity/action 槽位、可选本地 typeImage/typeImageMode 和本机 Chrome/Chromium
 * [OUTPUT]: 对外提供 receipt JSON -> 384x620 逻辑版式、默认 2x PNG 的非交互渲染命令
 * [POS]: scripts 的核心 renderer，被 SKILL.md 的 PNG 流程调用，与人格判断逻辑解耦
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WIDTH = 384;
const HEIGHT = 620;
const SCALE = 2;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..');

function help() {
  return `Usage: node scripts/render-receipt.mjs INPUT.json [options]

Render a fixed 58mm-style personality receipt card to PNG.

Options:
  --output FILE      PNG output path. Default: outputs/<receiptId>.png
  --chrome FILE      Chrome/Chromium executable path. Default: auto-detect
  --width PX         Viewport width. Default: ${WIDTH}
  --height PX        Viewport height. Default: ${HEIGHT}
  --scale N          Export scale. Default: ${SCALE}; use 1 for thermal printer native size
  --help             Show this help text

Example:
  node scripts/render-receipt.mjs assets/sample-receipt.json
`;
}

function parseArgs(argv) {
  const args = { input: null, output: null, chrome: null, width: WIDTH, height: HEIGHT, scale: SCALE };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--output') {
      args.output = argv[++i];
    } else if (arg === '--chrome') {
      args.chrome = argv[++i];
    } else if (arg === '--width') {
      args.width = parseInt(argv[++i], 10);
    } else if (arg === '--height') {
      args.height = parseInt(argv[++i], 10);
    } else if (arg === '--scale') {
      args.scale = parseFloat(argv[++i]);
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

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeFileName(value) {
  return String(value || 'receipt').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function truncate(value, max, label, warnings) {
  const text = String(value ?? '');
  if (text.length <= max) return text;
  warnings.push(`${label} truncated to ${max} characters`);
  return `${text.slice(0, Math.max(0, max - 1))}…`;
}

function rowsFromObject(object, options, warnings) {
  return Object.entries(object || {})
    .map(([key, value]) => {
      const rowKey = truncate(key, options.keyMax, `${key} key`, warnings);
      const rowValue = truncate(value, options.valueMax, `${key} value`, warnings);
      return `<div class="row"><div class="key">${escapeHtml(rowKey)}</div><div class="value">${escapeHtml(rowValue)}</div></div>`;
    })
    .join('\n');
}

function resolveImagePath(imagePath, inputPath) {
  if (!imagePath) return '';
  if (/^data:image\//.test(imagePath) || /^https?:\/\//.test(imagePath)) return imagePath;

  const base = path.dirname(inputPath);
  const resolved = path.isAbsolute(imagePath)
    ? imagePath
    : path.resolve(base, imagePath);

  if (!existsSync(resolved)) {
    throw new Error(`typeImage not found: ${imagePath}`);
  }

  return pathToFileURL(resolved).href;
}

function normalizeReceipt(data, warnings, inputPath) {
  const required = ['receiptId', 'date', 'match', 'mbti', 'items', 'total', 'type', 'rarity', 'verdict'];
  const missing = required.filter((key) => data[key] === undefined || data[key] === null || data[key] === '');
  const rawTypeGlyph = data.typeGlyph;
  if (rawTypeGlyph === undefined || rawTypeGlyph === null || rawTypeGlyph === '') {
    missing.push('typeGlyph');
  }
  if (missing.length) {
    throw new Error(`Missing required receipt fields: ${missing.join(', ')}`);
  }

  const typeGlyph = Array.isArray(rawTypeGlyph) ? rawTypeGlyph.join('\n') : String(rawTypeGlyph);
  const typeLines = typeGlyph.split('\n');
  if (typeLines.length > 5) warnings.push('typeGlyph should be 5 lines or fewer');
  typeLines.forEach((line, index) => {
    if (line.length > 24) warnings.push(`typeGlyph line ${index + 1} is wider than 24 characters`);
  });

  const typeImage = resolveImagePath(data.typeImage || '', inputPath);
  const typeImageMode = data.typeImageMode || 'clean';
  if (!['clean', 'stamp', 'thermal'].includes(typeImageMode)) {
    throw new Error('typeImageMode must be one of: clean, stamp, thermal');
  }
  const imageOptions = data.typeImageOptions || {};
  const typeImageOptions = {
    targetWidth: Number(imageOptions.targetWidth ?? data.typeTargetWidth ?? 220),
    matrixSize: Number(imageOptions.matrixSize ?? data.typeDitherMatrix ?? 4),
    brightness: Number(imageOptions.brightness ?? data.typeBrightness ?? 1),
    contrast: Number(imageOptions.contrast ?? data.typeContrast ?? 1),
    invert: Boolean(imageOptions.invert ?? data.typeInvert ?? false),
    enableDither: imageOptions.enableDither ?? data.typeEnableDither ?? true
  };
  if (![2, 4, 8, 16].includes(typeImageOptions.matrixSize)) {
    throw new Error('typeImageOptions.matrixSize must be one of: 2, 4, 8, 16');
  }
  if (!Number.isFinite(typeImageOptions.targetWidth) || typeImageOptions.targetWidth < 32) {
    throw new Error('typeImageOptions.targetWidth must be at least 32');
  }

  return {
    title: data.title || '人 格 小 票',
    thanks: data.thanks || 'THANK YOU FOR RUNNING THIS SYSTEM',
    receiptId: data.receiptId,
    date: data.date,
    typeImage,
    typeImageMode,
    typeImageOptions,
    typeGlyph,
    summary: {
      MBTI: data.mbti,
      '匹配度(MATCH)': data.match
    },
    items: {
      '能量(ENERGY)': data.items.Energy,
      '决策(DECISION)': data.items.Decision,
      '压力(STRESS)': data.items.Stress,
      '协作(COLLAB)': data.items.Collab
    },
    total: data.total,
    extras: {
      '类型(TYPE)': data.type,
      '稀有度(RARITY)': data.rarity
    },
    verdict: data.verdict,
    barcode: data.barcode || '||| ||||| || ||| | | || |||'
  };
}

function renderTypeMark(receipt) {
  if (receipt.typeImage) {
    return `<img class="type-image" data-mode="${escapeHtml(receipt.typeImageMode)}" data-target-width="${escapeHtml(receipt.typeImageOptions.targetWidth)}" data-matrix-size="${escapeHtml(receipt.typeImageOptions.matrixSize)}" data-brightness="${escapeHtml(receipt.typeImageOptions.brightness)}" data-contrast="${escapeHtml(receipt.typeImageOptions.contrast)}" data-invert="${escapeHtml(receipt.typeImageOptions.invert)}" data-enable-dither="${escapeHtml(receipt.typeImageOptions.enableDither)}" src="${escapeHtml(receipt.typeImage)}" alt="">`;
  }

  return `<pre class="type-glyph">${escapeHtml(receipt.typeGlyph)}</pre>`;
}

function renderHtml(receipt, warnings, scale) {
  const templatePath = path.join(skillRoot, 'assets', 'receipt-card.html');
  const template = readFileSync(templatePath, 'utf8');
  const exportWidth = Math.round(WIDTH * scale);
  const exportHeight = Math.round(HEIGHT * scale);
  const replacements = {
    EXPORT_WIDTH: exportWidth,
    EXPORT_HEIGHT: exportHeight,
    EXPORT_SCALE: scale,
    TITLE: escapeHtml(receipt.title),
    THANKS: escapeHtml(receipt.thanks),
    RECEIPT_ID: escapeHtml(receipt.receiptId),
    DATE: escapeHtml(receipt.date),
    TYPE_MARK: renderTypeMark(receipt),
    SUMMARY_ROWS: rowsFromObject(receipt.summary, { keyMax: 16, valueMax: 24 }, warnings),
    ITEM_ROWS: rowsFromObject(receipt.items, { keyMax: 16, valueMax: 24 }, warnings),
    TOTAL: escapeHtml(truncate(receipt.total, 24, 'total', warnings)),
    EXTRA_ROWS: rowsFromObject(receipt.extras, { keyMax: 16, valueMax: 24 }, warnings),
    VERDICT: escapeHtml(truncate(receipt.verdict, 58, 'verdict', warnings)),
    BARCODE: escapeHtml(receipt.barcode)
  };

  return Object.entries(replacements).reduce(
    (html, [key, value]) => html.replaceAll(`{{${key}}}`, value),
    template
  );
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

function hasPngOutput(output) {
  return existsSync(output) && readFileSync(output).subarray(1, 4).toString('utf8') === 'PNG';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForClose(child, ms) {
  return Promise.race([
    new Promise((resolve) => child.once('close', resolve)),
    sleep(ms).then(() => null)
  ]);
}

async function runChrome(chrome, htmlPath, output, width, height, scale, profileDir) {
  const args = [
    '--headless',
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
    `--window-size=${Math.round(width * scale)},${Math.round(height * scale)}`,
    '--force-device-scale-factor=1',
    `--screenshot=${output}`,
    pathToFileURL(htmlPath).href
  ];

  const child = spawn(chrome, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  let closed = false;
  let exitCode = null;
  let spawnError = null;

  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });
  child.once('close', (code) => {
    closed = true;
    exitCode = code;
  });
  child.once('error', (error) => {
    spawnError = error;
    closed = true;
  });

  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (spawnError) throw spawnError;

    if (hasPngOutput(output)) {
      if (!closed) {
        child.kill('SIGTERM');
        await waitForClose(child, 1500);
        if (!closed) child.kill('SIGKILL');
      }
      return;
    }

    if (closed) break;
    await sleep(100);
  }

  if (!closed) {
    child.kill('SIGKILL');
  }

  if (hasPngOutput(output)) return;

  if (closed) {
    throw new Error(`Chrome exited with code ${exitCode} before writing PNG\n${stderr || stdout}`);
  }

  throw new Error('Chrome timed out before writing PNG.');
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
  if (!Number.isFinite(args.width) || !Number.isFinite(args.height)) {
    fail('Error: --width and --height must be numbers.');
  }
  if (!Number.isFinite(args.scale) || args.scale <= 0) {
    fail('Error: --scale must be a positive number.');
  }

  const inputPath = path.resolve(args.input);
  const warnings = [];
  const tmp = mkdtempSync(path.join(tmpdir(), 'personality-receipt-'));

  try {
    const data = readJson(inputPath);
    const receipt = normalizeReceipt(data, warnings, inputPath);
    const html = renderHtml(receipt, warnings, args.scale);
    const htmlPath = path.join(tmp, 'receipt.html');
    const profileDir = path.join(tmp, 'chrome-profile');
    const output = path.resolve(args.output || path.join(skillRoot, 'outputs', `${safeFileName(receipt.receiptId)}.png`));

    mkdirSync(path.dirname(output), { recursive: true });
    mkdirSync(profileDir, { recursive: true });
    rmSync(output, { force: true });
    writeFileSync(htmlPath, html, 'utf8');

    const chrome = detectChrome(args.chrome);
    await runChrome(chrome, htmlPath, output, args.width, args.height, args.scale, profileDir);

    console.log(JSON.stringify({
      ok: true,
      output,
      logicalWidth: args.width,
      logicalHeight: args.height,
      scale: args.scale,
      pixelWidth: Math.round(args.width * args.scale),
      pixelHeight: Math.round(args.height * args.scale),
      warnings
    }, null, 2));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

main().catch((error) => fail(error.message));
