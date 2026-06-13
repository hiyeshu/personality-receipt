/**
 * [INPUT]: 依赖 app/index.html 的 DOM 节点、可选 window.PERSONALITY_RECEIPT_BOOTSTRAP/EXPORT_SCALE/AUTO_REPLAY、浏览器 canvas/Web Share/FileReader 能力、上传图片源和无图 ASCII typeGlyph
 * [OUTPUT]: 对外提供 app.v1 JSON 注入、一键热敏化图片处理、ASCII 兜底、小票出纸动效、响应式预览同步、分享字段编辑、DOM 测量透明 PNG 导出和分享动作
 * [POS]: app 的行为层，被 index.html 加载，和 CSS/DOM 共同组成静态演示页面
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
const BLOCKS = '░▒▓█▌▐▀▄■□▪▫';
const PAPER = '#fffaf0';
const DEFAULT_TYPE_GLYPH = ' /\\\\_/\\\\\n( o.o )\n > ^ <';
const RECEIPT_IMAGE_PRESET = Object.freeze({
  targetWidth: 220,
  matrixSize: 4,
  brightness: 0.85,
  contrast: 1.15,
  invert: false,
  enableDither: true,
  threshold: true,
  transparentWhite: true,
  whiteCutoff: 244
});
const TYPE_IMAGE_MODES = Object.freeze({
  clean: { ...RECEIPT_IMAGE_PRESET, brightness: 1, contrast: 1.12, enableDither: false, threshold: false },
  stamp: { ...RECEIPT_IMAGE_PRESET, brightness: 0.9, contrast: 1.45, enableDither: false },
  thermal: RECEIPT_IMAGE_PRESET
});
const requestedExportScale = Number(window.PERSONALITY_RECEIPT_EXPORT_SCALE || 2);
const EXPORT_SCALE = Number.isFinite(requestedExportScale) && requestedExportScale > 0
  ? requestedExportScale
  : 2;
const AUTO_REPLAY = window.PERSONALITY_RECEIPT_AUTO_REPLAY !== false;
const BAYER_2 = [[0, 2], [3, 1]];
const THEMES = {
  black: ['#2b2723', '#7a7164'],
  dailan: ['#3f5f7f', '#7a8996'],
  dailv: ['#587267', '#7d8c84'],
  yanzhi: ['#9d2933', '#9b7476'],
  zhecha: ['#8a5f45', '#927c6d'],
  xiangjin: ['#b08a18', '#9c8a50']
};

function formatReceiptTime(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('-') + ' ' + [
    pad(date.getHours()),
    pad(date.getMinutes())
  ].join(':');
}

function formatReceiptDate(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function randomReceiptCode() {
  const bytes = new Uint8Array(2);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function createReceiptId(date) {
  return `PR_${formatReceiptDate(date)}_001_${randomReceiptCode()}`;
}

const receiptCreatedAt = new Date();
const bootstrap = window.PERSONALITY_RECEIPT_BOOTSTRAP || {};
const REFERENCE_RARITY = Object.freeze({
  '白猫': '8.0%',
  '狐狸': '6.5%',
  '水母': '4.0%',
  '兔子': '9.5%',
  '章鱼': '3.2%',
  '猫头鹰': '2.8%',
  '云团': '14.0%'
});

function rarityForType(type) {
  return REFERENCE_RARITY[String(type || '').trim()] || REFERENCE_RARITY['云团'];
}

const data = {
  heading: 'RECEIPT',
  cashier: 'CASHIER',
  cashierValue: 'MODEL',
  payment: 'PAYMENT',
  paymentValue: 'YESHU',
  dateLine: 'DATE',
  time: formatReceiptTime(receiptCreatedAt),
  counter: 'NO.001',
  receiptId: createReceiptId(receiptCreatedAt),
  mbti: 'INFJ',
  energy: '喝热咖啡',
  decision: '先别回消息',
  stress: '找人吐槽',
  collab: '约人散步',
  total: '柔软但警觉',
  type: '白猫',
  verdict: 'SOFT FACE. SHARP SENSOR.',
  barcode: '||| ||||| || ||| | |||',
  ...(bootstrap.receipt || {})
};
data.rarity = data.rarity || rarityForType(data.type);

const EDIT_FIELDS = Object.freeze({
  cashierInput: 'cashierValue',
  paymentInput: 'paymentValue',
  mbtiInput: 'mbti',
  totalInput: 'total',
  typeInput: 'type',
  rarityInput: 'rarity',
  energyInput: 'energy',
  decisionInput: 'decision',
  stressInput: 'stress',
  collabInput: 'collab',
  verdictInput: 'verdict'
});

const state = {
  typeSource: bootstrap.typeImage || '',
  typeImage: '',
  typeGlyph: bootstrap.typeGlyph || DEFAULT_TYPE_GLYPH,
  typeMode: bootstrap.typeImageMode || 'thermal',
  theme: bootstrap.theme || 'dailv'
};

const receiptShell = document.querySelector('.receipt-shell');
const receiptCard = document.getElementById('receiptCard');
const typeSlot = document.getElementById('typeSlot');
const editButton = document.getElementById('editButton');
const editMenu = document.getElementById('editMenu');
let typeImageJob = 0;

function randomBlock() {
  return BLOCKS[Math.floor(Math.random() * BLOCKS.length)];
}

function maskText(text, progress) {
  return [...text].map((char, index, array) => {
    if (char === ' ') return ' ';
    const reveal = index / Math.max(1, array.length - 1);
    return reveal < progress ? char : randomBlock();
  }).join('');
}

function setText(field, text) {
  document.querySelectorAll(`[data-field="${field}"]`).forEach((node) => {
    node.textContent = text;
  });
}

function applyData() {
  Object.entries(data).forEach(([key, value]) => setText(key, value));
}

function currentTheme() {
  const [ink, muted] = THEMES[state.theme] || THEMES.black;
  return { ink, muted };
}

function hexToRgb(hex) {
  const value = String(hex || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return [0, 0, 0];
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16)
  ];
}

function setTheme(theme) {
  state.theme = THEMES[theme] ? theme : 'black';
  document.body.dataset.ink = state.theme;
  document.querySelectorAll('[data-theme]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.theme === state.theme));
  });
}

function typeImagePreset(mode) {
  return TYPE_IMAGE_MODES[mode] || TYPE_IMAGE_MODES.thermal;
}

function buildBayer(size) {
  if (size === 2) return BAYER_2;

  const prev = buildBayer(size / 2);
  const half = size / 2;
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));

  for (let y = 0; y < half; y += 1) {
    for (let x = 0; x < half; x += 1) {
      matrix[y][x] = prev[y][x] * 4;
      matrix[y][x + half] = prev[y][x] * 4 + 2;
      matrix[y + half][x] = prev[y][x] * 4 + 3;
      matrix[y + half][x + half] = prev[y][x] * 4 + 1;
    }
  }

  return matrix;
}

function clamp(value) {
  return Math.max(0, Math.min(255, value));
}

function adjustedGray(data, offset, preset) {
  const gray = data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114;
  const tuned = ((gray / 255 - 0.5) * preset.contrast + 0.5) * preset.brightness * 255;
  const value = preset.invert ? 255 - tuned : tuned;
  return clamp(value);
}

function sourceGray(data, offset) {
  return data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114;
}

function clearPixel(data, offset) {
  data[offset] = 255;
  data[offset + 1] = 255;
  data[offset + 2] = 255;
  data[offset + 3] = 0;
}

function paintInkPixel(data, offset, value, ink, transparentWhite) {
  const opacity = 1 - value / 255;
  if (transparentWhite && opacity < 0.04) {
    clearPixel(data, offset);
    return;
  }
  data[offset] = ink[0];
  data[offset + 1] = ink[1];
  data[offset + 2] = ink[2];
  data[offset + 3] = Math.round(255 * opacity);
}

function ditheredValue(gray, x, y, preset, matrix) {
  if (!preset.threshold) return gray;
  if (!preset.enableDither) return gray > 128 ? 255 : 0;

  const threshold = (matrix[y % preset.matrixSize][x % preset.matrixSize] / (preset.matrixSize ** 2)) * 255;
  return gray > threshold ? 255 : 0;
}

function processTypeCanvas(img, mode) {
  const preset = typeImagePreset(mode);
  const width = preset.targetWidth;
  const height = Math.max(1, Math.round(width * (img.naturalHeight / img.naturalWidth)));
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const matrix = preset.enableDither ? buildBayer(preset.matrixSize) : null;
  const ink = hexToRgb(currentTheme().ink);

  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      if (pixels[offset + 3] < 16 || (preset.transparentWhite && sourceGray(pixels, offset) >= preset.whiteCutoff)) {
        clearPixel(pixels, offset);
        continue;
      }
      const value = ditheredValue(adjustedGray(pixels, offset, preset), x, y, preset, matrix);
      paintInkPixel(pixels, offset, value, ink, preset.transparentWhite);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

async function refreshTypeImage(animate = true) {
  const job = ++typeImageJob;

  if (!state.typeSource) {
    state.typeImage = '';
    renderType();
    if (animate) replayReceipt();
    return;
  }

  const img = await loadImage(state.typeSource);
  if (job !== typeImageJob) return;
  state.typeImage = processTypeCanvas(img, state.typeMode).toDataURL('image/png');
  renderType();
  if (animate) replayReceipt();
}

function preparePrintLines() {
  const nodes = document.querySelectorAll('.type-mark, .store-info > div, .rule, .row, .verdict, .barcode, .receipt-id');
  nodes.forEach((node, index) => {
    node.classList.add('heat-line');
    node.style.setProperty('--print-delay', `${180 + index * 38}ms`);
  });
}

function replayReceipt() {
  receiptShell.classList.remove('is-printing');
  receiptCard.classList.remove('is-running');
  void receiptShell.offsetWidth;
  receiptShell.classList.add('is-printing');
  scrambleAll();
}

function scrambleAll() {
  receiptCard.classList.remove('is-running');
  void receiptCard.offsetWidth;
  receiptCard.classList.add('is-running');

  const nodes = Array.from(document.querySelectorAll('.scramble'));
  const duration = 520;
  const start = performance.now();

  nodes.forEach((node) => node.classList.add('scrambling'));

  function frame(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);

    nodes.forEach((node, nodeIndex) => {
      const key = node.dataset.field;
      const text = String(data[key] || '');
      const local = Math.max(0, Math.min(1, eased - nodeIndex * 0.015));
      node.textContent = maskText(text, local);
    });

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      nodes.forEach((node) => {
        node.classList.remove('scrambling');
        node.textContent = data[node.dataset.field] || '';
      });
    }
  }

  requestAnimationFrame(frame);
}

function renderType() {
  if (state.typeImage) {
    typeSlot.innerHTML = `<img src="${state.typeImage}" alt="">`;
    const img = typeSlot.querySelector('img');
    if (img.complete) {
      fitReceiptPreview();
    } else {
      img.addEventListener('load', fitReceiptPreview, { once: true });
    }
    fitReceiptPreview();
    return;
  }

  typeSlot.innerHTML = '<pre></pre>';
  typeSlot.querySelector('pre').textContent = state.typeGlyph;
  fitReceiptPreview();
}

function applyInputValues() {
  Object.entries(EDIT_FIELDS).forEach(([inputId, field]) => {
    const input = document.getElementById(inputId);
    if (input) input.value = data[field] || '';
  });
}

function fitReceiptPreview() {
  receiptShell.style.removeProperty('--preview-scale');
  receiptShell.style.marginBottom = '0px';
}

function syncInputs() {
  Object.entries(EDIT_FIELDS).forEach(([inputId, field]) => {
    const input = document.getElementById(inputId);
    if (input) data[field] = input.value || data[field];
  });
  data.rarity = data.rarity || rarityForType(data.type);
  applyData();
  fitReceiptPreview();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function cssPx(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function canvasFont(style) {
  return [
    style.fontStyle,
    style.fontVariant,
    style.fontWeight,
    style.fontSize,
    style.fontFamily
  ].join(' ');
}

function exportMetrics() {
  const root = receiptCard.getBoundingClientRect();
  const scale = root.width / receiptCard.offsetWidth || 1;
  return { root, scale };
}

function rectFor(node, metrics) {
  const rect = node.getBoundingClientRect();
  return {
    x: (rect.left - metrics.root.left) / metrics.scale,
    y: (rect.top - metrics.root.top) / metrics.scale,
    width: rect.width / metrics.scale,
    height: rect.height / metrics.scale
  };
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('PNG export failed'));
      }
    }, 'image/png');
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function drawRuleNode(ctx, node, metrics) {
  const rect = rectFor(node, metrics);
  const ink = currentTheme().ink;

  if (node.classList.contains('soft')) {
    ctx.save();
    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(1, rect.height);
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(rect.x, rect.y + rect.height / 2);
    ctx.lineTo(rect.x + rect.width, rect.y + rect.height / 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.fillStyle = ink;
  ctx.fillRect(rect.x, rect.y, rect.width, Math.max(1, rect.height));
}

function textBaselineY(rect, style) {
  const fontSize = cssPx(style.fontSize, 13);
  const lineHeight = cssPx(style.lineHeight, fontSize * 1.2);
  return rect.y + (rect.height - lineHeight) / 2 + fontSize * 0.86;
}

function drawTextNode(ctx, node, metrics) {
  const text = node.textContent || '';
  if (!text.trim()) return;

  const rect = rectFor(node, metrics);
  const style = getComputedStyle(node);
  ctx.fillStyle = style.color;
  ctx.font = canvasFont(style);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = style.textAlign === 'right' ? 'right' : style.textAlign === 'center' ? 'center' : 'left';

  const x = ctx.textAlign === 'right' ? rect.x + rect.width : ctx.textAlign === 'center' ? rect.x + rect.width / 2 : rect.x;
  ctx.fillText(text, x, textBaselineY(rect, style), rect.width + 2);
}

function drawReceiptTitle(ctx, metrics) {
  const node = receiptCard.querySelector('.receipt-word');
  const rect = rectFor(node, metrics);
  const style = getComputedStyle(node);
  const text = node.textContent || '';
  const fontSize = cssPx(style.fontSize, 64);

  ctx.save();
  ctx.translate(rect.x + rect.width / 2, rect.y + rect.height / 2 - fontSize * 0.45);
  ctx.scale(1.08, 1);
  ctx.fillStyle = style.color;
  ctx.font = canvasFont(style);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, 0, fontSize * 0.86, rect.width);
  ctx.restore();
}

function drawTypeMark(ctx, metrics) {
  const image = typeSlot.querySelector('img');
  if (image) {
    const rect = rectFor(image, metrics);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
    return;
  }

  const pre = typeSlot.querySelector('pre');
  const rect = rectFor(pre, metrics);
  const style = getComputedStyle(pre);
  const lines = (pre.textContent || '').split('\n');
  const lineHeight = cssPx(style.lineHeight, cssPx(style.fontSize, 20));

  ctx.fillStyle = style.color;
  ctx.font = canvasFont(style);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  lines.forEach((line, index) => {
    ctx.fillText(line, rect.x + rect.width / 2, rect.y + index * lineHeight, rect.width);
  });
}

function drawReceiptToCanvas(ctx) {
  const metrics = exportMetrics();
  drawTypeMark(ctx, metrics);
  receiptCard.querySelectorAll('.rule').forEach((node) => drawRuleNode(ctx, node, metrics));
  drawReceiptTitle(ctx, metrics);
  receiptCard.querySelectorAll('.store-info [data-field], .row:not(.section) .key, .row:not(.section) .value, .row.section > span, .verdict [data-field], .barcode [data-field], .receipt-id [data-field]').forEach((node) => {
    drawTextNode(ctx, node, metrics);
  });
}

async function exportPngBlob() {
  syncInputs();
  if (state.typeSource && !state.typeImage) await refreshTypeImage(false);
  if (document.fonts?.ready) await document.fonts.ready;
  applyData();

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = Math.ceil(receiptCard.offsetWidth * EXPORT_SCALE);
  canvas.height = Math.ceil(receiptCard.offsetHeight * EXPORT_SCALE);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(EXPORT_SCALE, EXPORT_SCALE);
  drawReceiptToCanvas(ctx);
  return await canvasToBlob(canvas);
}

function triggerDownload(blob) {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.download = `${data.receiptId}.png`;
  link.href = url;
  document.body.append(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    link.remove();
  }, 1000);
}

async function downloadPng() {
  try {
    triggerDownload(await exportPngBlob());
  } catch (error) {
    console.error(error);
    alert('PNG 导出失败，刷新页面后再试一次。');
  }
}

async function sharePng() {
  try {
    const blob = await exportPngBlob();
    const file = new File([blob], `${data.receiptId}.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Personality Receipt' });
    } else {
      triggerDownload(blob);
    }
  } catch (error) {
    console.error(error);
    alert('分享图片生成失败，刷新页面后再试一次。');
  }
}

document.getElementById('typeImageInput').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state.typeSource = reader.result;
    refreshTypeImage();
  };
  reader.readAsDataURL(file);
});

Object.keys(EDIT_FIELDS).forEach((id) => {
  const input = document.getElementById(id);
  if (!input) return;
  input.addEventListener('input', () => {
    syncInputs();
    replayReceipt();
  });
});

document.querySelectorAll('[data-theme]').forEach((button) => {
  button.addEventListener('click', async () => {
    setTheme(button.dataset.theme);
    if (state.typeSource) await refreshTypeImage(false);
    replayReceipt();
  });
});

editButton.addEventListener('click', () => {
  const nextOpen = editMenu.hidden;
  editMenu.hidden = !nextOpen;
  editButton.setAttribute('aria-expanded', String(nextOpen));
});

document.getElementById('downloadButton').addEventListener('click', downloadPng);
document.getElementById('shareButton').addEventListener('click', sharePng);
window.addEventListener('resize', fitReceiptPreview);

async function initializeReceiptApp() {
  setTheme(state.theme);
  applyInputValues();
  applyData();
  preparePrintLines();
  if (state.typeSource) {
    await refreshTypeImage(false);
  } else {
    renderType();
  }
  if (AUTO_REPLAY) replayReceipt();
}

const appReady = initializeReceiptApp();

window.personalityReceiptApp = {
  ready: appReady,
  exportPngBlob: async () => {
    await appReady;
    return await exportPngBlob();
  },
  exportPngDataUrl: async () => {
    await appReady;
    return await blobToDataUrl(await exportPngBlob());
  }
};
