// ── Data helpers ──────────────────────────────────────────────

function loadData() {
  const raw = localStorage.getItem('gymTracker');
  return raw ? JSON.parse(raw) : { days: [] };
}

function saveData(data) {
  localStorage.setItem('gymTracker', JSON.stringify(data));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Epley-variant 1RM; each extra set adds ~2.5% to account for accumulated fatigue
function calc1RM(weight, reps, sets = 1) {
  if (reps <= 1) return weight;
  const base = weight / (1.0278 - 0.0278 * reps);
  return base * (1 + (sets - 1) * 0.025);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Handles both ISO (YYYY-MM-DD) stored going forward and old locale strings in existing data
function fmtDate(d) {
  if (!d) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date(d + 'T00:00').toLocaleDateString();
  return d;
}

function parseDate(d) {
  if (!d) return new Date(0);
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date(d + 'T00:00');
  return new Date(d);
}

// ── Render ────────────────────────────────────────────────────

function render() {
  const data = loadData();
  const container = document.getElementById('days-container');
  const emptyMsg = document.getElementById('empty-msg');

  container.innerHTML = '';

  if (data.days.length === 0) {
    container.appendChild(emptyMsg);
    emptyMsg.style.display = 'block';
    return;
  }

  data.days.forEach(day => {
    const card = buildDayCard(day);
    container.appendChild(card);
  });
}

function buildDayCard(day) {
  const totalVolume = day.exercises.reduce((sum, ex) => sum + ex.weight * ex.reps * ex.sets, 0);
  // If all exercises share the same unit, show it; otherwise note mixed units
  const units = [...new Set(day.exercises.map(ex => ex.unit || 'kg'))];
  const unitLabel = units.length === 1 ? units[0] : 'mixed units';

  const card = document.createElement('div');
  card.className = 'day-card';

  card.innerHTML = `
    <div class="day-header">
      <h2>${escHtml(day.name)}</h2>
      <div class="day-header-actions">
        <button class="icon-btn edit-day" title="Edit day name" onclick="openDayModal('${day.id}')">✏️</button>
        <button class="icon-btn del-day" title="Delete day" onclick="deleteDay('${day.id}')">🗑️</button>
      </div>
    </div>
    <div class="day-body">
      <div class="day-volume">Total volume: ${totalVolume.toLocaleString()} ${unitLabel}</div>
      <div class="exercise-list" id="list-${day.id}">
        ${day.exercises.map(ex => buildExerciseHTML(ex, day.id)).join('')}
      </div>
      <button class="btn-add-exercise" onclick="openExerciseModal('${day.id}')">+ Add Exercise</button>
    </div>
  `;

  return card;
}

function buildExerciseHTML(ex, dayId) {
  const unit = ex.unit || 'kg';
  const volume = ex.weight * ex.reps * ex.sets;
  const history = ex.history || [];

  const notesHtml = ex.notes
    ? `<div class="exercise-notes">${escHtml(ex.notes)}</div>`
    : '';

  const historyHtml = history.length > 0 ? `
    <div class="history-toggle" onclick="toggleHistory('${ex.id}')">
      ▸ ${history.length} previous entr${history.length === 1 ? 'y' : 'ies'}
    </div>
    <div class="history-list" id="history-${ex.id}">
      ${history.slice().reverse().map(h => `
        <div class="history-entry">${fmtDate(h.date)} — ${h.sets}×${h.reps} @ ${h.weight} ${unit}</div>
      `).join('')}
    </div>` : '';

  return `
    <div class="exercise-item" id="ex-${ex.id}">
      <div class="exercise-info">
        <div class="exercise-name">${escHtml(ex.name)}</div>
        <div class="exercise-stats">${ex.sets} sets × ${ex.reps} reps @ ${ex.weight} ${unit}</div>
        <div class="exercise-volume">Volume: ${volume.toLocaleString()} ${unit}</div>
        <div class="exercise-1rm">Est. 1RM: ~${calc1RM(ex.weight, ex.reps, ex.sets).toFixed(1)} ${unit}</div>
        ${notesHtml}
        ${historyHtml}
      </div>
      <div class="exercise-actions">
        <button class="btn-log" title="Log a session" onclick="openUpdateModal('${dayId}', '${ex.id}')">+ Log</button>
        <button class="icon-btn edit" title="Edit exercise" onclick="openExerciseModal('${dayId}', '${ex.id}')">✏️</button>
        <button class="icon-btn del" title="Delete exercise" onclick="deleteExercise('${dayId}', '${ex.id}')">🗑️</button>
      </div>
    </div>
  `;
}

// Prevent XSS from user-typed input when inserting into innerHTML
function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ── Workout Day modal ─────────────────────────────────────────

let editingDayId = null;

function openDayModal(dayId) {
  editingDayId = dayId || null;
  const modal = document.getElementById('day-modal');
  const title = document.getElementById('day-modal-title');
  const input = document.getElementById('day-name-input');

  if (editingDayId) {
    const data = loadData();
    const day = data.days.find(d => d.id === editingDayId);
    title.textContent = 'Edit Workout Day';
    input.value = day ? day.name : '';
  } else {
    title.textContent = 'Add Workout Day';
    input.value = '';
  }

  modal.classList.add('open');
  setTimeout(() => input.focus(), 50);
}

function closeDayModal(event) {
  // Close only if clicking the overlay background (not the modal box itself)
  if (event && event.target !== document.getElementById('day-modal')) return;
  document.getElementById('day-modal').classList.remove('open');
  editingDayId = null;
}

function saveDay() {
  const name = document.getElementById('day-name-input').value.trim();
  if (!name) {
    alert('Please enter a name for this workout day.');
    return;
  }

  const data = loadData();

  if (editingDayId) {
    const day = data.days.find(d => d.id === editingDayId);
    if (day) day.name = name;
  } else {
    data.days.push({ id: uid(), name, exercises: [] });
  }

  saveData(data);
  document.getElementById('day-modal').classList.remove('open');
  editingDayId = null;
  render();
}

function deleteDay(dayId) {
  if (!confirm('Delete this workout day and all its exercises?')) return;
  const data = loadData();
  data.days = data.days.filter(d => d.id !== dayId);
  saveData(data);
  render();
}

// ── Exercise modal ────────────────────────────────────────────

let targetDayId = null;
let editingExerciseId = null;

function openExerciseModal(dayId, exerciseId) {
  targetDayId = dayId;
  editingExerciseId = exerciseId || null;

  const modal = document.getElementById('exercise-modal');
  const title = document.getElementById('exercise-modal-title');
  document.getElementById('ex-error').textContent = '';

  if (editingExerciseId) {
    const data = loadData();
    const day = data.days.find(d => d.id === targetDayId);
    const ex = day && day.exercises.find(e => e.id === editingExerciseId);
    if (ex) {
      title.textContent = 'Edit Exercise';
      document.getElementById('ex-name').value   = ex.name;
      document.getElementById('ex-weight').value = ex.weight;
      document.getElementById('ex-unit').value   = ex.unit || 'kg';
      document.getElementById('ex-sets').value   = ex.sets;
      document.getElementById('ex-reps').value   = ex.reps;
      document.getElementById('ex-notes').value  = ex.notes || '';
    }
  } else {
    title.textContent = 'Add Exercise';
    document.getElementById('ex-name').value   = '';
    document.getElementById('ex-weight').value = '';
    document.getElementById('ex-sets').value   = '';
    document.getElementById('ex-reps').value   = '';
    document.getElementById('ex-notes').value  = '';
  }

  // Library: hide when editing an existing exercise; always reset state
  document.getElementById('lib-section').style.display = editingExerciseId ? 'none' : '';
  resetLibrary();

  modal.classList.add('open');
  setTimeout(() => document.getElementById('ex-name').focus(), 50);
}

function closeExerciseModal(event) {
  if (event && event.target !== document.getElementById('exercise-modal')) return;
  document.getElementById('exercise-modal').classList.remove('open');
  resetLibrary();
  targetDayId = null;
  editingExerciseId = null;
}

function saveExercise() {
  const name   = document.getElementById('ex-name').value.trim();
  const weight = parseFloat(document.getElementById('ex-weight').value);
  const unit   = document.getElementById('ex-unit').value;
  const sets   = parseInt(document.getElementById('ex-sets').value, 10);
  const reps   = parseInt(document.getElementById('ex-reps').value, 10);
  const notes  = document.getElementById('ex-notes').value.trim();
  const errorEl = document.getElementById('ex-error');

  // Basic validation
  if (!name) { errorEl.textContent = 'Exercise name is required.'; return; }
  if (isNaN(weight) || weight < 0) { errorEl.textContent = 'Enter a valid weight (0 or more).'; return; }
  if (isNaN(sets)   || sets < 1)   { errorEl.textContent = 'Sets must be 1 or more.'; return; }
  if (isNaN(reps)   || reps < 1)   { errorEl.textContent = 'Reps must be 1 or more.'; return; }

  errorEl.textContent = '';
  const data = loadData();
  const day = data.days.find(d => d.id === targetDayId);
  if (!day) return;

  if (editingExerciseId) {
    const ex = day.exercises.find(e => e.id === editingExerciseId);
    // Preserve history when editing — only update the fields the user changed
    if (ex) Object.assign(ex, { name, weight, unit, sets, reps, notes });
  } else {
    day.exercises.push({ id: uid(), name, weight, unit, sets, reps, notes,
                         date: new Date().toLocaleDateString(), history: [] });
  }

  saveData(data);
  document.getElementById('exercise-modal').classList.remove('open');
  targetDayId = null;
  editingExerciseId = null;
  render();
}

function deleteExercise(dayId, exerciseId) {
  if (!confirm('Delete this exercise?')) return;
  const data = loadData();
  const day = data.days.find(d => d.id === dayId);
  if (day) day.exercises = day.exercises.filter(e => e.id !== exerciseId);
  saveData(data);
  render();
}

// ── Update modal ──────────────────────────────────────────────

let updateDayId = null;
let updateExId  = null;

function openUpdateModal(dayId, exId) {
  updateDayId = dayId;
  updateExId  = exId;

  const data = loadData();
  const day  = data.days.find(d => d.id === dayId);
  const ex   = day && day.exercises.find(e => e.id === exId);
  if (!ex) return;

  const unit = ex.unit || 'kg';
  document.getElementById('upd-modal-title').textContent = `Log: ${ex.name}`;
  document.getElementById('upd-unit-label').textContent  = unit;
  document.getElementById('upd-weight').value = ex.weight;
  document.getElementById('upd-sets').value   = ex.sets;
  document.getElementById('upd-reps').value   = ex.reps;
  document.getElementById('log-date').value   = todayISO();
  document.getElementById('upd-error').textContent  = '';
  document.getElementById('upd-1rm-ref').textContent =
    `Current est. 1RM: ~${calc1RM(ex.weight, ex.reps, ex.sets).toFixed(1)} ${unit}`;

  document.getElementById('update-modal').classList.add('open');
  setTimeout(() => document.getElementById('upd-weight').focus(), 50);
}

function closeUpdateModal(event) {
  if (event && event.target !== document.getElementById('update-modal')) return;
  document.getElementById('update-modal').classList.remove('open');
  updateDayId = null;
  updateExId  = null;
}

function saveUpdate() {
  const weight  = parseFloat(document.getElementById('upd-weight').value);
  const sets    = parseInt(document.getElementById('upd-sets').value, 10);
  const reps    = parseInt(document.getElementById('upd-reps').value, 10);
  const dateVal = document.getElementById('log-date').value || todayISO();
  const errorEl = document.getElementById('upd-error');

  if (isNaN(weight) || weight < 0) { errorEl.textContent = 'Enter a valid weight (0 or more).'; return; }
  if (isNaN(sets)   || sets < 1)   { errorEl.textContent = 'Sets must be 1 or more.'; return; }
  if (isNaN(reps)   || reps < 1)   { errorEl.textContent = 'Reps must be 1 or more.'; return; }

  const data = loadData();
  const day  = data.days.find(d => d.id === updateDayId);
  const ex   = day && day.exercises.find(e => e.id === updateExId);
  if (!ex) return;

  // Push current values into history before overwriting
  if (!ex.history) ex.history = [];
  ex.history.push({ weight: ex.weight, reps: ex.reps, sets: ex.sets, date: ex.date || todayISO() });

  ex.weight = weight;
  ex.sets   = sets;
  ex.reps   = reps;
  ex.date   = dateVal;

  saveData(data);
  document.getElementById('update-modal').classList.remove('open');
  updateDayId = null;
  updateExId  = null;
  render();
}

function toggleHistory(exId) {
  const el = document.getElementById('history-' + exId);
  if (!el) return;
  const isNowOpen = el.classList.toggle('open');
  const toggle = el.previousElementSibling;
  if (toggle) toggle.textContent = toggle.textContent.replace(isNowOpen ? '▸' : '▾', isNowOpen ? '▾' : '▸');
}

// ── Tab navigation ────────────────────────────────────────────

function switchTab(name) {
  const isProgress = name === 'progress';
  document.getElementById('view-workouts').style.display = isProgress ? 'none'  : 'block';
  document.getElementById('view-progress').style.display = isProgress ? 'block' : 'none';
  document.getElementById('btn-add-day').style.display   = isProgress ? 'none'  : '';
  document.getElementById('tab-workouts').classList.toggle('active', !isProgress);
  document.getElementById('tab-progress').classList.toggle('active',  isProgress);
  if (isProgress) populateProgressSelect();
}

// ── Progress tab ──────────────────────────────────────────────

function populateProgressSelect() {
  const data   = loadData();
  const names  = new Set();
  data.days.forEach(day => day.exercises.forEach(ex => names.add(ex.name)));

  const sel = document.getElementById('progress-select');
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
  document.getElementById('stat-best1rm').textContent  = `~${best.toFixed(1)} ${unit}`;
  document.getElementById('stat-sessions').textContent = `${plotData.length} session${plotData.length !== 1 ? 's' : ''}`;
  document.getElementById('stat-first-date').textContent = plotData[0].date;
  statsRow.style.display = 'flex';

  // Show chart
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

  const vals = data.map(d => d.rm);
  const rawMin = Math.min(...vals);
  const rawMax = Math.max(...vals);
  // Give a little breathing room; handle flat data (all same value)
  const padding = rawMax === rawMin ? rawMax * 0.1 || 10 : (rawMax - rawMin) * 0.15;
  const minV = rawMin - padding;
  const maxV = rawMax + padding;
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

// ── Exercise library ──────────────────────────────────────────

const EXERCISE_LIBRARY = {
  'Chest':     ['Bench Press','Incline Bench Press','Dumbbell Bench Press','Incline Dumbbell Press','Chest Fly','Cable Fly','Push-Ups','Dips'],
  'Back':      ['Pull-Ups','Lat Pulldown','Barbell Row','Dumbbell Row','Seated Cable Row','T-Bar Row','Deadlift','Face Pull'],
  'Shoulders': ['Shoulder Press','Dumbbell Shoulder Press','Lateral Raise','Rear Delt Fly','Front Raise','Arnold Press','Shrugs'],
  'Arms':      ['Barbell Curl','Dumbbell Curl','Hammer Curl','Preacher Curl','Tricep Pushdown','Skull Crushers','Overhead Tricep Extension','Close-Grip Bench Press'],
  'Legs':      ['Squat','Leg Press','Romanian Deadlift','Leg Extension','Leg Curl','Walking Lunges','Calf Raise','Hip Thrust'],
  'Core':      ['Plank','Hanging Leg Raise','Cable Crunch','Russian Twist','Sit-Ups','Ab Wheel Rollout']
};

let selectedLibraryName = '';

function renderLibrary(query = '') {
  const q    = query.trim().toLowerCase();
  const list = document.getElementById('lib-list');
  let html = '';
  let any  = false;

  for (const [cat, exercises] of Object.entries(EXERCISE_LIBRARY)) {
    const matches = q ? exercises.filter(e => e.toLowerCase().includes(q)) : exercises;
    if (!matches.length) continue;
    any = true;
    html += `<div class="lib-category">${cat}</div>`;
    matches.forEach(name => {
      const sel = name === selectedLibraryName ? ' selected' : '';
      html += `<button class="lib-item${sel}" type="button" data-name="${escHtml(name)}" onclick="pickExercise(this.dataset.name)">${escHtml(name)}</button>`;
    });
  }

  list.innerHTML = any ? html : '<p class="lib-empty">No exercises match.</p>';

  if (selectedLibraryName) {
    const sel = list.querySelector('.lib-item.selected');
    if (sel) sel.scrollIntoView({ block: 'nearest' });
  }
}

function filterLibrary() {
  renderLibrary(document.getElementById('lib-search').value);
}

function toggleLibrary() {
  const panel = document.getElementById('lib-panel');
  const btn   = document.getElementById('lib-toggle');
  const open  = panel.classList.toggle('open');
  btn.textContent = open ? 'Browse exercise library ▾' : 'Browse exercise library ▸';
  if (open) {
    document.getElementById('lib-search').value = '';
    renderLibrary(); // respects selectedLibraryName for highlight
    setTimeout(() => document.getElementById('lib-search').focus(), 50);
  }
}

function pickExercise(name) {
  selectedLibraryName = name;
  document.getElementById('ex-name').value = name;
  // Update highlight in-place without closing the panel
  document.querySelectorAll('#lib-list .lib-item').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.name === name);
  });
  updateLibHint();
}

function onExNameInput() {
  const val = document.getElementById('ex-name').value.trim().toLowerCase();
  const all = Object.values(EXERCISE_LIBRARY).flat();
  const match = all.find(e => e.toLowerCase() === val) || '';
  selectedLibraryName = match;
  // Sync highlight if library list is visible
  document.querySelectorAll('#lib-list .lib-item').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.name === match);
  });
  updateLibHint();
}

function updateLibHint() {
  const hint = document.getElementById('ex-lib-hint');
  if (hint) hint.textContent = selectedLibraryName ? 'Selected from library' : '';
}

function resetLibrary() {
  selectedLibraryName = '';
  document.getElementById('lib-panel').classList.remove('open');
  document.getElementById('lib-toggle').textContent = 'Browse exercise library ▸';
  const hint = document.getElementById('ex-lib-hint');
  if (hint) hint.textContent = '';
}

// ── Keyboard shortcuts ────────────────────────────────────────

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('day-modal').classList.remove('open');
    document.getElementById('exercise-modal').classList.remove('open');
    document.getElementById('update-modal').classList.remove('open');
  }
  // Submit modals with Enter
  if (e.key === 'Enter') {
    if (document.getElementById('day-modal').classList.contains('open'))      saveDay();
    if (document.getElementById('exercise-modal').classList.contains('open')) saveExercise();
    if (document.getElementById('update-modal').classList.contains('open'))   saveUpdate();
  }
});

// ── Init ──────────────────────────────────────────────────────
render();
// Redraw chart on window resize so canvas stays responsive
window.addEventListener('resize', () => {
  if (document.getElementById('view-progress').style.display !== 'none') {
    renderProgressChart();
  }
});
