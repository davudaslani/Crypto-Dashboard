// ═══════════════════════════════════════
// KI-ANALYSE MIT CLAUDE
// ═══════════════════════════════════════

async function ladeKI() {
  if (!coinsData.length) return;

  const btc  = coinsData[0];
  const eth  = coinsData[1];
  const mc   = globalData?.total_market_cap?.usd;
  const fg   = fearGreed?.value;
  const heute = new Date().toLocaleDateString('de-DE',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );

  // Strukturierter Prompt: KI bekommt alle relevanten Daten
  const prompt = `Du bist ein professioneller Krypto-Marktanalyst. Heute ist ${heute}.

Aktuelle Marktdaten:
- BTC: ${fmtPreis(btc?.current_price)} | 24h: ${fmtPct(btc?.price_change_percentage_24h)}
- ETH: ${fmtPreis(eth?.current_price)} | 24h: ${fmtPct(eth?.price_change_percentage_24h)}
- Total Market Cap: ${fmt(mc)}
- Fear & Greed Index: ${fg} (${fearGreed?.value_classification})

Antworte NUR mit einem JSON-Objekt, kein Markdown, keine Erklärung:
{
  "tagesRating": "GOOD",
  "score": 7,
  "zusammenfassung": "2-3 Sätze auf Deutsch",
  "bullSignale": ["Signal 1", "Signal 2", "Signal 3"],
  "bearSignale": ["Signal 1", "Signal 2", "Signal 3"],
  "wochentage": {
    "Montag": 5, "Dienstag": 6, "Mittwoch": 8,
    "Donnerstag": 7, "Freitag": 6, "Samstag": 4, "Sonntag": 3
  },
  "btcSupport": 95000,
  "btcResistance": 105000,
  "ethSupport": 2500,
  "ethResistance": 3200,
  "wochenausblick": "2 Sätze auf Deutsch",
  "topSignal": "Ein konkreter Hinweis auf Deutsch",
  "briefing": "3-4 Sätze Marktbriefing auf Deutsch"
}`;

  try {
    const r = await fetch(AI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data  = await r.json();
    const text  = data.content.map(c => c.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const ki    = JSON.parse(clean);

    zeigeKI(ki);

  } catch (e) {
    console.error('KI fehlgeschlagen:', e);
    zeigeKIFehler();
  }
}

// ───────────────────────────────────────
// KI-Ergebnisse darstellen
// ───────────────────────────────────────
function zeigeKI(ki) {

  // 1. Tages-Badge
  const badgeCls =
    ki.tagesRating === 'GOOD'    ? 'signal-good' :
    ki.tagesRating === 'NEUTRAL' ? 'signal-neutral' : 'signal-avoid';
  const badgeTxt =
    ki.tagesRating === 'GOOD'    ? '▲ GUTER HANDELSTAG' :
    ki.tagesRating === 'NEUTRAL' ? '◈ NEUTRAL' : '▼ VORSICHT';

  document.getElementById('ki-badge').className = `signal-badge ${badgeCls}`;
  document.getElementById('ki-badge').textContent = badgeTxt;

  // 2. Score-Balken
  const score    = ki.score || 5;
  const scoreFarbe = score >= 7 ? '#10b981' : score >= 5 ? '#f59e0b' : '#ef4444';
  document.getElementById('ki-score-bar').style.width      = `${score * 10}%`;
  document.getElementById('ki-score-bar').style.background = scoreFarbe;
  document.getElementById('ki-score-num').textContent      = `${score}/10`;
  document.getElementById('ki-score-num').style.color      = scoreFarbe;
  document.getElementById('ki-summary').textContent        = ki.zusammenfassung;

  // 3. Bullish/Bearish Signale
  document.getElementById('bull-list').innerHTML =
    (ki.bullSignale || []).map(s =>
      `<li><span style="color:var(--green);flex-shrink:0">▲</span> ${s}</li>`
    ).join('');

  document.getElementById('bear-list').innerHTML =
    (ki.bearSignale || []).map(s =>
      `<li><span style="color:var(--red);flex-shrink:0">▼</span> ${s}</li>`
    ).join('');

  // 4. Wochentag-Heatmap
  const tage = ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];
  const heute = new Date().toLocaleDateString('de-DE', { weekday: 'long' });

  document.getElementById('heatmap-grid').innerHTML = tage.map(tag => {
    const s   = (ki.wochentage || {})[tag] || 5;
    const bg  = s >= 8 ? 'rgba(16,185,129,.2)'  : s >= 6 ? 'rgba(34,211,238,.12)'  : s >= 4 ? 'rgba(245,158,11,.12)' : 'rgba(239,68,68,.15)';
    const col = s >= 8 ? '#10b981'               : s >= 6 ? '#22d3ee'               : s >= 4 ? '#f59e0b'               : '#ef4444';
    const lbl = s >= 8 ? 'Ideal'                 : s >= 6 ? 'Gut'                   : s >= 4 ? 'OK'                    : 'Meiden';
    const isHeute = tag === heute ? ' heute' : '';

    return `
      <div class="heatmap-day${isHeute}"
           style="background:${bg};border:1px solid ${col}33">
        <div class="heatmap-day-name"  style="color:${col}">${tag.slice(0,2).toUpperCase()}</div>
        <div class="heatmap-day-score" style="color:${col}">${s}</div>
        <div class="heatmap-day-label" style="color:${col}">${lbl}</div>
      </div>
    `;
  }).join('');

  const best  = Array.isArray(ki.bestDaysThisWeek)  ? ki.bestDaysThisWeek.join(', ')  : '—';
  const worst = Array.isArray(ki.worstDaysThisWeek) ? ki.worstDaysThisWeek.join(', ') : '—';
  document.getElementById('heatmap-hint').innerHTML =
    `✓ Beste Tage: <span style="color:var(--green)">${best}</span>
     &nbsp;|&nbsp;
     ✗ Meiden: <span style="color:var(--red)">${worst}</span>`;

  // 5. Key Levels
  const kl = ki;
  document.getElementById('key-levels').innerHTML = [
    ['BTC Support',     kl.btcSupport,     'up'],
    ['BTC Resistance',  kl.btcResistance,  'dn'],
    ['ETH Support',     kl.ethSupport,     'up'],
    ['ETH Resistance',  kl.ethResistance,  'dn']
  ].map(([label, wert, cls]) =>
    `<div class="level-row">
      <span class="level-label">${label}</span>
      <span class="${cls}" style="font-weight:700">
        ${wert ? '$' + wert.toLocaleString() : '—'}
      </span>
    </div>`
  ).join('');

  // 6. Wochenausblick
  document.getElementById('weekly-outlook').textContent = ki.wochenausblick || '—';

  // 7. Briefing + Top Signal
  document.getElementById('ai-brief').textContent = ki.briefing || ki.zusammenfassung || '—';
  if (ki.topSignal) {
    const el = document.getElementById('ai-top-trade');
    el.textContent = `◈ TOP SIGNAL: ${ki.topSignal}`;
    el.style.display = 'block';
  }
}

function zeigeKIFehler() {
  document.getElementById('ki-badge').className   = 'signal-badge signal-neutral';
  document.getElementById('ki-badge').textContent = '◈ KI NICHT VERFÜGBAR';
  document.getElementById('ki-summary').textContent =
    'KI-Analyse konnte nicht geladen werden. Marktdaten sind trotzdem aktuell.';
  document.getElementById('ai-brief').textContent =
    'Bitte prüfe deine Internetverbindung. Die Marktdaten oben sind weiterhin live.';
}