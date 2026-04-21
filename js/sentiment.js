// ═══════════════════════════════════════
// FEAR & GREED INDEX
// ═══════════════════════════════════════

async function ladeFearGreed() {
  try {
    const r = await fetch(FNG_URL);
    const d = await r.json();
    fearGreed = d.data[0];
    zeigeFearGreed();
  } catch (e) {
    console.error('Fear & Greed fehlgeschlagen:', e);
    // Fallback: Neutralwert anzeigen
    fearGreed = { value: '50', value_classification: 'Neutral' };
    zeigeFearGreed();
  }
}

function zeigeFearGreed() {
  const wert = parseInt(fearGreed.value);

  // Farbe je nach Wert (Ampel-System)
  const farbe =
    wert < 25 ? '#ef4444' :
    wert < 45 ? '#f97316' :
    wert < 55 ? '#f59e0b' :
    wert < 75 ? '#84cc16' :
                '#10b981';

  // Deutsches Label
  const labelDE =
    wert < 25 ? 'Extreme Angst' :
    wert < 45 ? 'Angst' :
    wert < 55 ? 'Neutral' :
    wert < 75 ? 'Gier' : 'Extreme Gier';

  // SVG Gauge animieren
  // Arc-Länge: 236px Gesamtlänge, proportional füllen
  const fill = (wert / 100) * 236;
  document.getElementById('fg-arc').setAttribute('stroke-dasharray', `${fill} ${236 - fill}`);
  document.getElementById('fg-arc').setAttribute('stroke', farbe);
  document.getElementById('fg-dot').setAttribute('fill', farbe);

  // Zeiger-Nadel rotieren: -90° (links) bis +90° (rechts)
  const winkel = -90 + (wert / 100) * 180;
  const rad = winkel * Math.PI / 180;
  const x2 = 90 + 55 * Math.sin(rad);
  const y2 = 85 - 55 * Math.cos(rad);
  document.getElementById('fg-needle').setAttribute('x2', x2);
  document.getElementById('fg-needle').setAttribute('y2', y2);
  document.getElementById('fg-needle').setAttribute('stroke', farbe);

  // Texte befüllen
  document.getElementById('fg-num').textContent   = wert;
  document.getElementById('fg-num').style.color   = farbe;
  document.getElementById('fg-label').textContent = labelDE.toUpperCase();
  document.getElementById('fg-label').style.color = farbe;
  document.getElementById('fg-time').textContent  =
    `Stand: ${new Date().toLocaleDateString('de-DE')}`;
}