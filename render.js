// ── Render ────────────────────────────────────────────────────
// Sole responsibility: build and insert DOM for workout days and exercises.
// Reads data via loadData(); never writes to storage.
//
// Note: the onclick strings below reference functions from modals.js, which
// loads after this file. That is intentional — onclick handlers are only
// invoked at click-time (after all scripts have loaded), not at parse-time.

const ICONS = {
  edit: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`,
  trash: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
  logAll: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  chevronRight: `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>`,
};

function render() {
  const data = loadData();
  const container = document.getElementById('days-container');
  const emptyMsg  = document.getElementById('empty-msg');

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
  const units     = [...new Set(day.exercises.map(ex => ex.unit || 'kg'))];
  const unitLabel = units.length === 1 ? units[0] : 'mixed units';

  const card = document.createElement('div');
  card.className = 'day-card';

  card.innerHTML = `
    <div class="day-header">
      <h2>${escHtml(day.name)}</h2>
      <div class="day-header-actions">
        <button class="btn-log-all" onclick="openLogAllModal('${day.id}')">${ICONS.logAll} Log All</button>
        <button class="icon-btn edit-day" title="Edit day name" onclick="openDayModal('${day.id}')">${ICONS.edit}</button>
        <button class="icon-btn del-day" title="Delete day" onclick="deleteDay('${day.id}')">${ICONS.trash}</button>
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
  const unit    = ex.unit || 'kg';
  const volume  = ex.weight * ex.reps * ex.sets;
  const history = ex.history || [];

  const notesHtml = ex.notes
    ? `<div class="exercise-notes">${escHtml(ex.notes)}</div>`
    : '';

  const historyHtml = history.length > 0 ? `
    <div class="history-toggle" onclick="toggleHistory('${ex.id}')">
      <span class="history-chevron">${ICONS.chevronRight}</span>${history.length} previous entr${history.length === 1 ? 'y' : 'ies'}
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
        <button class="icon-btn edit" title="Edit exercise" onclick="openExerciseModal('${dayId}', '${ex.id}')">${ICONS.edit}</button>
        <button class="icon-btn del" title="Delete exercise" onclick="deleteExercise('${dayId}', '${ex.id}')">${ICONS.trash}</button>
      </div>
    </div>
  `;
}

function toggleHistory(exId) {
  const el = document.getElementById('history-' + exId);
  if (!el) return;
  const isNowOpen = el.classList.toggle('open');
  const toggle = el.previousElementSibling;
  if (toggle) {
    const chevron = toggle.querySelector('.history-chevron');
    if (chevron) chevron.classList.toggle('open', isNowOpen);
  }
}
