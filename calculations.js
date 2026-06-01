// ── Calculations & formatting helpers ────────────────────────
// Sole responsibility: pure functions — math, dates, and safe HTML escaping.
// No DOM reads or writes here.

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

// Prevent XSS from user-typed input when inserting into innerHTML
function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
