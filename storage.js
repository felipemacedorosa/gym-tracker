// ── Storage ───────────────────────────────────────────────────
// Sole responsibility: read/write localStorage and generate IDs.

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
