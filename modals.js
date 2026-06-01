// ── Modals ────────────────────────────────────────────────────
// Sole responsibility: open/close/fill/read all four modals and
// call workoutService to commit changes, then re-render.

function closeAllModals() {
  document.getElementById('day-modal').classList.remove('open');
  document.getElementById('exercise-modal').classList.remove('open');
  document.getElementById('update-modal').classList.remove('open');
  document.getElementById('log-all-modal').classList.remove('open');
  editingDayId      = null;
  targetDayId       = null;
  editingExerciseId = null;
  updateDayId       = null;
  updateExId        = null;
  logAllDayId       = null;
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
    const day  = data.days.find(d => d.id === editingDayId);
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
  if (!name) { alert('Please enter a name for this workout day.'); return; }

  if (editingDayId) {
    updateDay(editingDayId, name);
  } else {
    addDay(name);
  }

  document.getElementById('day-modal').classList.remove('open');
  editingDayId = null;
  render();
}

function deleteDay(dayId) {
  if (!confirm('Delete this workout day and all its exercises?')) return;
  removeDay(dayId);
  render();
}

// ── Exercise modal ────────────────────────────────────────────

let targetDayId       = null;
let editingExerciseId = null;

function openExerciseModal(dayId, exerciseId) {
  targetDayId       = dayId;
  editingExerciseId = exerciseId || null;

  const modal = document.getElementById('exercise-modal');
  const title = document.getElementById('exercise-modal-title');
  document.getElementById('ex-error').textContent = '';

  if (editingExerciseId) {
    const data = loadData();
    const day  = data.days.find(d => d.id === targetDayId);
    const ex   = day && day.exercises.find(e => e.id === editingExerciseId);
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
  targetDayId       = null;
  editingExerciseId = null;
}

function saveExercise() {
  const name    = document.getElementById('ex-name').value.trim();
  const weight  = parseFloat(document.getElementById('ex-weight').value);
  const unit    = document.getElementById('ex-unit').value;
  const sets    = parseInt(document.getElementById('ex-sets').value, 10);
  const reps    = parseInt(document.getElementById('ex-reps').value, 10);
  const notes   = document.getElementById('ex-notes').value.trim();
  const errorEl = document.getElementById('ex-error');

  if (!name)                       { errorEl.textContent = 'Exercise name is required.';       return; }
  if (isNaN(weight) || weight < 0) { errorEl.textContent = 'Enter a valid weight (0 or more).'; return; }
  if (isNaN(sets)   || sets < 1)   { errorEl.textContent = 'Sets must be 1 or more.';           return; }
  if (isNaN(reps)   || reps < 1)   { errorEl.textContent = 'Reps must be 1 or more.';           return; }

  errorEl.textContent = '';

  if (editingExerciseId) {
    updateExercise(targetDayId, editingExerciseId, { name, weight, unit, sets, reps, notes });
  } else {
    addExercise(targetDayId, { name, weight, unit, sets, reps, notes });
  }

  document.getElementById('exercise-modal').classList.remove('open');
  targetDayId       = null;
  editingExerciseId = null;
  render();
}

function deleteExercise(dayId, exerciseId) {
  if (!confirm('Delete this exercise?')) return;
  removeExercise(dayId, exerciseId);
  render();
}

// ── Update (Log Session) modal ────────────────────────────────

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
  if (isNaN(sets)   || sets < 1)   { errorEl.textContent = 'Sets must be 1 or more.';           return; }
  if (isNaN(reps)   || reps < 1)   { errorEl.textContent = 'Reps must be 1 or more.';           return; }

  logExercise(updateDayId, updateExId, { weight, sets, reps, date: dateVal });

  document.getElementById('update-modal').classList.remove('open');
  updateDayId = null;
  updateExId  = null;
  render();
}

// ── Log All modal ─────────────────────────────────────────────

let logAllDayId = null;

function openLogAllModal(dayId) {
  const data = loadData();
  const day  = data.days.find(d => d.id === dayId);
  if (!day || !day.exercises.length) {
    alert('Add exercises to this day before logging.');
    return;
  }

  logAllDayId = dayId;
  document.getElementById('log-all-title').textContent = `Log All — ${day.name}`;
  document.getElementById('log-all-date').value        = todayISO();
  document.getElementById('log-all-error').textContent = '';

  const rowsEl = document.getElementById('log-all-rows');
  rowsEl.innerHTML = day.exercises.map((ex, i) => {
    const unit = ex.unit || 'kg';
    return `
      <div class="log-all-row" data-ex-id="${ex.id}" data-idx="${i}">
        <div class="log-all-ex-name">${escHtml(ex.name)}</div>
        <div class="row">
          <div>
            <label>Weight (${unit})</label>
            <input type="number" class="log-all-weight" value="${ex.weight}" min="0" step="0.5" />
          </div>
          <div>
            <label>Sets</label>
            <input type="number" class="log-all-sets" value="${ex.sets}" min="1" step="1" />
          </div>
          <div>
            <label>Reps</label>
            <input type="number" class="log-all-reps" value="${ex.reps}" min="1" step="1" />
          </div>
        </div>
        <div>
          <label>Notes (optional)</label>
          <input type="text" class="log-all-notes" placeholder="Optional notes" maxlength="120" />
        </div>
      </div>`;
  }).join('');

  // Set notes via property (safe for any character, avoids HTML-escaping issues)
  day.exercises.forEach((ex, i) => {
    const row = rowsEl.querySelector(`[data-idx="${i}"]`);
    if (row) row.querySelector('.log-all-notes').value = ex.notes || '';
  });

  document.getElementById('log-all-modal').classList.add('open');
  setTimeout(() => rowsEl.querySelector('.log-all-weight').focus(), 50);
}

function closeLogAllModal(event) {
  if (event && event.target !== document.getElementById('log-all-modal')) return;
  document.getElementById('log-all-modal').classList.remove('open');
  logAllDayId = null;
}

function saveLogAll() {
  const dateVal = document.getElementById('log-all-date').value || todayISO();
  const errorEl = document.getElementById('log-all-error');
  const rows    = document.querySelectorAll('#log-all-rows .log-all-row');

  const updates = [];
  for (const row of rows) {
    const exId   = row.dataset.exId;
    const name   = row.querySelector('.log-all-ex-name').textContent;
    const weight = parseFloat(row.querySelector('.log-all-weight').value);
    const sets   = parseInt(row.querySelector('.log-all-sets').value, 10);
    const reps   = parseInt(row.querySelector('.log-all-reps').value, 10);
    const notes  = row.querySelector('.log-all-notes').value.trim();

    if (isNaN(weight) || weight < 0) { errorEl.textContent = `Invalid weight for "${name}".`; return; }
    if (isNaN(sets)   || sets < 1)   { errorEl.textContent = `Invalid sets for "${name}".`;   return; }
    if (isNaN(reps)   || reps < 1)   { errorEl.textContent = `Invalid reps for "${name}".`;   return; }
    updates.push({ exId, weight, sets, reps, notes });
  }

  errorEl.textContent = '';
  logAllExercises(logAllDayId, updates, dateVal);

  document.getElementById('log-all-modal').classList.remove('open');
  logAllDayId = null;
  render();
}
