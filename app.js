// ── App entry point ───────────────────────────────────────────
// Sole responsibility: tab switching, global keyboard shortcuts,
// the resize listener, and the initial render call.

function switchTab(name) {
  const isProgress = name === 'progress';
  document.getElementById('view-workouts').style.display = isProgress ? 'none'  : 'block';
  document.getElementById('view-progress').style.display = isProgress ? 'block' : 'none';
  document.getElementById('btn-add-day').style.display   = isProgress ? 'none'  : '';
  document.getElementById('tab-workouts').classList.toggle('active', !isProgress);
  document.getElementById('tab-progress').classList.toggle('active',  isProgress);
  if (isProgress) populateProgressSelect();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeAllModals();
  }
  if (e.key === 'Enter') {
    if (document.getElementById('day-modal').classList.contains('open'))      saveDay();
    if (document.getElementById('exercise-modal').classList.contains('open')) saveExercise();
    if (document.getElementById('update-modal').classList.contains('open'))   saveUpdate();
  }
});

// Redraw chart on window resize so canvas stays responsive
window.addEventListener('resize', () => {
  if (document.getElementById('view-progress').style.display !== 'none') {
    renderProgressChart();
  }
});

render();

// Register service worker for offline/PWA support (requires HTTPS or localhost)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .catch(() => {}); // silently ignore in file:// or unsupported contexts
  });
}
