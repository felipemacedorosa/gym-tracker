// ── Progress tab ──────────────────────────────────────────────
// Sole responsibility: populate the exercise selector and draw the 1RM chart.

function populateProgressSelect() {
  const data  = loadData();
  const names = new Set();
  data.days.forEach(day => day.exercises.forEach(ex => names.add(ex.name)));

  const sel  = document.getElementById('progress-select');
  const prev = sel.value;
  sel.innerHTML = '<option value="">— select an exercise —</option>';
  [...names].sort().forEach(n => {
    const opt = document.createElement('option');
    opt.value = n;
    opt.textContent = n;
    if (n === prev) opt.selected = true;
    sel.appendChild(opt);
  });

  renderProgressChart();
}

function renderProgressChart() {
  const sel      = document.getElementById('progress-select');
  const name     = sel.value;
  const statsRow = document.getElementById('progress-stats');
  const chartBox = document.getElementById('chart-container');
  const emptyMsg = document.getElementById('progress-empty');

  if (!name) {
    statsRow.style.display = 'none';
    chartBox.style.display = 'none';
    emptyMsg.style.display = 'block';
    return;
  }

  const data   = loadData();
  const points = [];

  data.days.forEach(day => {
    day.exercises.forEach(ex => {
      if (ex.name.trim().toLowerCase() !== name.trim().toLowerCase()) return;
      // Historical entries (old values stored before each log)
      (ex.history || []).forEach(h => points.push({ weight: h.weight, reps: h.reps, sets: h.sets || 1, date: h.date }));
      // Current values as the latest data point
      points.push({ weight: ex.weight, reps: ex.reps, sets: ex.sets || 1, date: ex.date || todayISO() });
    });
  });

  if (points.length === 0) {
    statsRow.style.display = 'none';
    chartBox.style.display = 'none';
    emptyMsg.textContent   = 'No data found for this exercise.';
    emptyMsg.style.display = 'block';
    return;
  }

  // Sort chronologically, dedup same-date entries keeping latest
  points.sort((a, b) => parseDate(a.date) - parseDate(b.date));
  const seen = new Map();
  points.forEach(p => seen.set(p.date, p));
  const sorted = [...seen.values()];

  // Calculate 1RM for each point (sets-adjusted)
  const plotData = sorted.map(p => ({
    date: fmtDate(p.date),
    rm:   parseFloat(calc1RM(p.weight, p.reps, p.sets).toFixed(1))
  }));

  // Derive unit from the first matching exercise
  const unit = (() => {
    for (const day of data.days)
      for (const ex of day.exercises)
        if (ex.name.trim().toLowerCase() === name.trim().toLowerCase())
          return ex.unit || 'kg';
    return 'kg';
  })();

  // Update stat boxes
  const best = Math.max(...plotData.map(p => p.rm));
  document.getElementById('stat-best1rm').textContent    = `~${best.toFixed(1)} ${unit}`;
  document.getElementById('stat-sessions').textContent   = `${plotData.length} session${plotData.length !== 1 ? 's' : ''}`;
  document.getElementById('stat-first-date').textContent = plotData[0].date;
  statsRow.style.display = 'flex';

  chartBox.style.display = 'block';
  emptyMsg.style.display = 'none';
  drawChart(document.getElementById('progress-chart'), plotData, unit);
}

function drawChart(canvas, data, unit) {
  canvas.width  = canvas.offsetWidth;
  canvas.height = 280;
  const ctx = canvas.getContext('2d');
  const PAD = { top: 32, right: 24, bottom: 58, left: 62 };
  const W   = canvas.width  - PAD.left - PAD.right;
  const H   = canvas.height - PAD.top  - PAD.bottom;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const vals   = data.map(d => d.rm);
  const rawMin = Math.min(...vals);
  const rawMax = Math.max(...vals);
  // Give a little breathing room; handle flat data (all same value)
  const padding = rawMax === rawMin ? rawMax * 0.1 || 10 : (rawMax - rawMin) * 0.15;
  const minV  = rawMin - padding;
  const maxV  = rawMax + padding;
  const range = maxV - minV;

  const xOf = i => PAD.left + (data.length === 1 ? W / 2 : (i / (data.length - 1)) * W);
  const yOf = v => PAD.top  + H - ((v - minV) / range) * H;

  // Horizontal grid lines + Y labels
  const ticks = 5;
  for (let t = 0; t <= ticks; t++) {
    const v = minV + (range / ticks) * t;
    const y = yOf(v);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(PAD.left + W, y); ctx.stroke();
    ctx.fillStyle  = 'rgba(255,255,255,0.32)';
    ctx.font       = '11px Segoe UI, system-ui, sans-serif';
    ctx.textAlign  = 'right';
    ctx.fillText(v.toFixed(1), PAD.left - 8, y + 4);
  }

  // Y-axis label (rotated)
  ctx.save();
  ctx.translate(13, PAD.top + H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.font      = '11px Segoe UI, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Est. 1RM (${unit})`, 0, 0);
  ctx.restore();

  // Gradient fill under the line
  const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + H);
  grad.addColorStop(0, 'rgba(250,204,21,0.18)');
  grad.addColorStop(1, 'rgba(250,204,21,0.00)');
  ctx.beginPath();
  data.forEach((d, i) => {
    const x = xOf(i), y = yOf(d.rm);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo(xOf(data.length - 1), PAD.top + H);
  ctx.lineTo(xOf(0), PAD.top + H);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.strokeStyle = '#FACC15';
  ctx.lineWidth   = 2.5;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  data.forEach((d, i) => {
    const x = xOf(i), y = yOf(d.rm);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Dots, value labels, and date labels
  const step = Math.max(1, Math.ceil(data.length / 8));
  data.forEach((d, i) => {
    const x = xOf(i), y = yOf(d.rm);

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(250,204,21,0.18)';
    ctx.fill();

    // Dot
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle   = '#FACC15';
    ctx.fill();
    ctx.strokeStyle = '#07070d';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Value label above dot
    ctx.fillStyle = 'rgba(255,255,255,0.70)';
    ctx.font      = '10px Segoe UI, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.rm.toFixed(1), x, y - 13);

    // Date label on X axis (spaced to avoid crowding)
    if (i % step === 0 || i === data.length - 1) {
      ctx.save();
      ctx.translate(x, PAD.top + H + 14);
      ctx.rotate(-0.65);
      ctx.fillStyle = 'rgba(255,255,255,0.32)';
      ctx.font      = '10px Segoe UI, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(d.date, 0, 0);
      ctx.restore();
    }
  });
}
