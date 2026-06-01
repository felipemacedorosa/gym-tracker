// ── Form helpers ──────────────────────────────────────────────
// Sole responsibility: read form input values and validate them.
// Pure readers — no modal state, no storage calls, no side effects.

function getExerciseFormData() {
  return {
    name:   document.getElementById('ex-name').value.trim(),
    weight: parseFloat(document.getElementById('ex-weight').value),
    unit:   document.getElementById('ex-unit').value,
    sets:   parseInt(document.getElementById('ex-sets').value, 10),
    reps:   parseInt(document.getElementById('ex-reps').value, 10),
    notes:  document.getElementById('ex-notes').value.trim(),
  };
}

function validateExerciseData(data) {
  if (!data.name)                             return 'Exercise name is required.';
  if (isNaN(data.weight) || data.weight < 0) return 'Enter a valid weight (0 or more).';
  if (isNaN(data.sets)   || data.sets   < 1) return 'Sets must be 1 or more.';
  if (isNaN(data.reps)   || data.reps   < 1) return 'Reps must be 1 or more.';
  return '';
}

function getUpdateFormData() {
  return {
    weight: parseFloat(document.getElementById('upd-weight').value),
    sets:   parseInt(document.getElementById('upd-sets').value, 10),
    reps:   parseInt(document.getElementById('upd-reps').value, 10),
    date:   document.getElementById('log-date').value || todayISO(),
  };
}

// name is optional — when provided, error messages reference the exercise by name
// (used by Log All where multiple rows are validated in sequence)
function validateLogData(data, name) {
  if (isNaN(data.weight) || data.weight < 0)
    return name ? `Invalid weight for "${name}".` : 'Enter a valid weight (0 or more).';
  if (isNaN(data.sets) || data.sets < 1)
    return name ? `Invalid sets for "${name}".`   : 'Sets must be 1 or more.';
  if (isNaN(data.reps) || data.reps < 1)
    return name ? `Invalid reps for "${name}".`   : 'Reps must be 1 or more.';
  return '';
}

function getLogAllFormData() {
  const date    = document.getElementById('log-all-date').value || todayISO();
  const rows    = document.querySelectorAll('#log-all-rows .log-all-row');
  const updates = [];
  for (const row of rows) {
    updates.push({
      exId:   row.dataset.exId,
      name:   row.querySelector('.log-all-ex-name').textContent,
      weight: parseFloat(row.querySelector('.log-all-weight').value),
      sets:   parseInt(row.querySelector('.log-all-sets').value, 10),
      reps:   parseInt(row.querySelector('.log-all-reps').value, 10),
      notes:  row.querySelector('.log-all-notes').value.trim(),
    });
  }
  return { date, updates };
}
