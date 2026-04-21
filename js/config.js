// ═══════════════════════════════════════
// API-URLS
// ═══════════════════════════════════════
const CG_BASE  = 'https://api.coingecko.com/api/v3';
const FNG_URL  = 'https://api.alternative.me/fng/';
const AI_URL   = 'https://api.anthropic.com/v1/messages';

// Globale Datenspeicher (werden von den anderen Dateien befüllt)
let coinsData  = [];
let globalData = null;
let fearGreed  = null;

// Chart-Objekte (müssen global sein um sie später zu zerstören)
let btcChartObj = null;
let domChartObj = null;

// ═══════════════════════════════════════
// HILFSFUNKTIONEN (überall verfügbar)
// ═══════════════════════════════════════

// Grosse Zahlen: 2500000000 → "$2.5B"
function fmt(n) {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

// Krypto-Preise: 95000 → "$95,000.00" | 0.0052 → "$0.005200"
function fmtPreis(n) {
  if (n == null) return '—';
  if (n >= 100)  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (n >= 1)    return `$${n.toFixed(4)}`;
  return `$${n.toFixed(6)}`;
}

// Prozent mit Vorzeichen: 2.5 → "+2.50%" | -1.3 → "-1.30%"
function fmtPct(n, dez = 2) {
  if (n == null) return '—';
  return `${n >= 0 ? '+' : ''}${n.toFixed(dez)}%`;
}

// CSS-Klasse basierend auf Wert: positiv → "up", negativ → "dn"
function clr(n) {
  return n >= 0 ? 'up' : 'dn';
}

// Mini-Sparkline SVG aus einem Zahlen-Array erstellen
function makeSpark(daten, farbe) {
  const d = daten.slice(-20); // Nur die letzten 20 Punkte
  const min = Math.min(...d);
  const max = Math.max(...d);
  const range = max - min || 1;
  const w = 80, h = 28;
  // Jeden Datenpunkt in x/y Koordinaten umrechnen
  const punkte = d.map((v, i) =>
    `${(i / (d.length - 1)) * w},${h - ((v - min) / range) * h}`
  ).join(' ');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <polyline fill="none" stroke="${farbe}" stroke-width="1.5" points="${punkte}"/>
  </svg>`;
}