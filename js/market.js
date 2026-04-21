// ═══════════════════════════════════════
// MARKTDATEN VON COINGECKO LADEN
// ═══════════════════════════════════════

async function ladeMarkt() {
  // Alle drei APIs gleichzeitig laden (schneller!)
  await Promise.all([
    ladeCoins(),
    ladeGlobal(),
    ladeBtcChart(),
    ladeTrending()
  ]);
}

// ───────────────────────────────────────
// Top-Coins Tabelle
// ───────────────────────────────────────
async function ladeCoins() {
  try {
    const r = await fetch(
      `${CG_BASE}/coins/markets` +
      `?vs_currency=usd` +
      `&order=market_cap_desc` +
      `&per_page=12` +
      `&sparkline=true` +
      `&price_change_percentage=1h,24h,7d`
    );
    coinsData = await r.json();
    zeigeCoins();
    zeigeTicker();
  } catch (e) {
    console.error('Coins laden fehlgeschlagen:', e);
  }
}

function zeigeCoins() {
  const tbody = document.getElementById('coin-tbody');
  tbody.innerHTML = coinsData.map((c, i) => {
    const h1  = c.price_change_percentage_1h_in_currency;
    const d24 = c.price_change_percentage_24h;
    const d7  = c.price_change_percentage_7d_in_currency;
    const sp  = c.sparkline_in_7d?.price || [];
    const sparkFarbe = (d7 || 0) >= 0 ? '#10b981' : '#ef4444';
    const spark = sp.length ? makeSpark(sp, sparkFarbe) : '';

    return `
      <tr>
        <td style="color:var(--text3);font-size:11px">${i + 1}</td>
        <td>
          <div style="display:flex;align-items:center">
            <img class="coin-img" src="${c.image}" alt="${c.name}"
                 onerror="this.style.display='none'"/>
            <strong style="color:var(--text)">${c.name}</strong>
            <span style="color:var(--text3);font-size:10px;margin-left:4px">
              ${c.symbol.toUpperCase()}
            </span>
          </div>
        </td>
        <td class="r" style="color:var(--text);font-weight:700">${fmtPreis(c.current_price)}</td>
        <td class="r ${clr(h1)}">${fmtPct(h1)}</td>
        <td class="r ${clr(d24)}">${fmtPct(d24)}</td>
        <td class="r ${clr(d7)}">${fmtPct(d7)}</td>
        <td class="r" style="color:var(--text2)">${fmt(c.market_cap)}</td>
      </tr>
    `;
  }).join('');

  document.getElementById('table-updated').textContent =
    new Date().toLocaleTimeString('de-DE');
}

// ───────────────────────────────────────
// Scrollender Ticker oben
// ───────────────────────────────────────
function zeigeTicker() {
  const items = coinsData.map(c => {
    const chg = c.price_change_percentage_24h;
    return `<span class="tick-item">
      <span class="tick-name">${c.symbol.toUpperCase()}</span>
      <span class="tick-price">${fmtPreis(c.current_price)}</span>
      <span class="${chg >= 0 ? 'tick-up' : 'tick-dn'}">${fmtPct(chg)}</span>
    </span>`;
  }).join('');
  // Doppelt einfügen → nahtlose Endlosschleife
  document.getElementById('ticker-inner').innerHTML = items + items;
}

// ───────────────────────────────────────
// Globale Marktdaten
// ───────────────────────────────────────
async function ladeGlobal() {
  try {
    const r = await fetch(`${CG_BASE}/global`);
    const d = await r.json();
    globalData = d.data;

    const mc   = globalData.total_market_cap.usd;
    const vol  = globalData.total_volume.usd;
    const btcD = globalData.market_cap_percentage.btc;
    const ethD = globalData.market_cap_percentage.eth;
    const chg  = globalData.market_cap_change_percentage_24h_usd;

    document.getElementById('g-mcap').textContent  = fmt(mc);
    document.getElementById('g-vol').textContent   = fmt(vol);
    document.getElementById('g-btcd').textContent  = `${btcD.toFixed(1)}%`;
    document.getElementById('g-ethd').textContent  = `ETH: ${ethD.toFixed(1)}%`;
    document.getElementById('g-coins').textContent = globalData.active_cryptocurrencies.toLocaleString();
    document.getElementById('g-markets').textContent = `Märkte: ${globalData.markets.toLocaleString()}`;

    const chgEl = document.getElementById('g-mcap-chg');
    chgEl.innerHTML = `<span class="${clr(chg)}">${fmtPct(chg)}</span> in 24h`;

    zeigeDominanz();
  } catch (e) {
    console.error('Global laden fehlgeschlagen:', e);
  }
}

// ───────────────────────────────────────
// BTC 14-Tage Chart
// ───────────────────────────────────────
async function ladeBtcChart() {
  try {
    const r = await fetch(
      `${CG_BASE}/coins/bitcoin/market_chart?vs_currency=usd&days=14&interval=daily`
    );
    const d = await r.json();
    zeigeBtcChart(d.prices);
  } catch (e) {
    console.error('BTC Chart fehlgeschlagen:', e);
  }
}

function zeigeBtcChart(preise) {
  const labels = preise.map(p =>
    new Date(p[0]).toLocaleDateString('de-DE', { month: 'short', day: 'numeric' })
  );
  const werte = preise.map(p => p[1]);
  const steigt = werte[werte.length - 1] > werte[0];
  const farbe = steigt ? '#10b981' : '#ef4444';
  const chgPct = ((werte[werte.length - 1] - werte[0]) / werte[0] * 100).toFixed(1);

  document.getElementById('btc-chg-label').innerHTML =
    `<span class="${steigt ? 'up' : 'dn'}">${steigt ? '+' : ''}${chgPct}% (14d)</span>`;

  const ctx = document.getElementById('btc-chart').getContext('2d');
  if (btcChartObj) btcChartObj.destroy();

  btcChartObj = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: werte,
        borderColor: farbe,
        backgroundColor: farbe + '18',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid:  { color: '#1e2d47' },
          ticks: { color: '#4b6080', font: { size: 10 }, maxTicksLimit: 7 }
        },
        y: {
          grid:  { color: '#1e2d47' },
          ticks: {
            color: '#4b6080',
            font: { size: 10 },
            callback: v => `$${(v / 1000).toFixed(0)}k`
          }
        }
      }
    }
  });
}

// ───────────────────────────────────────
// Dominanz Donut-Chart
// ───────────────────────────────────────
function zeigeDominanz() {
  if (!globalData) return;
  const dom = globalData.market_cap_percentage;
  const coins = ['btc', 'eth', 'bnb', 'sol', 'xrp'];
  const labels = [...coins.map(k => k.toUpperCase()), 'Others'];
  const werte  = coins.map(k => +(dom[k] || 0).toFixed(1));
  const others = +(100 - werte.reduce((s, v) => s + v, 0)).toFixed(1);
  werte.push(others);
  const farben = ['#f59e0b', '#6366f1', '#f97316', '#8b5cf6', '#06b6d4', '#374151'];

  const ctx = document.getElementById('dom-chart').getContext('2d');
  if (domChartObj) domChartObj.destroy();

  domChartObj = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: werte,
        backgroundColor: farben,
        borderColor: '#111827',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: { legend: { display: false } }
    }
  });

  document.getElementById('dom-legend').innerHTML = labels.map((l, i) =>
    `<div style="display:flex;align-items:center;gap:6px">
      <span style="width:10px;height:10px;border-radius:2px;background:${farben[i]};flex-shrink:0"></span>
      <span style="color:var(--text2)">${l}</span>
      <span style="color:var(--text);margin-left:auto">${werte[i]}%</span>
    </div>`
  ).join('');
}

// ───────────────────────────────────────
// Trending Coins
// ───────────────────────────────────────
async function ladeTrending() {
  try {
    const r = await fetch(`${CG_BASE}/search/trending`);
    const d = await r.json();
    zeigeTrending(d.coins.slice(0, 6));
  } catch (e) {
    console.error('Trending fehlgeschlagen:', e);
  }
}

function zeigeTrending(coins) {
  document.getElementById('trending-list').innerHTML = coins.map((c, i) => {
    const item = c.item;
    return `
      <div class="trend-item">
        <div style="display:flex;align-items:center;gap:8px">
          <span class="trend-rank">${i + 1}</span>
          <img class="trend-img" src="${item.thumb}" alt="${item.name}"
               onerror="this.style.display='none'"/>
          <div>
            <div style="font-weight:700;font-size:12px">${item.name}</div>
            <div style="font-size:10px;color:var(--text3)">${item.symbol}</div>
          </div>
        </div>
        <div style="font-size:10px;color:var(--text3)">
          Rank #${item.score !== undefined ? item.score + 1 : '—'}
        </div>
      </div>
    `;
  }).join('');
}