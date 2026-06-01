// ── Exercise library ──────────────────────────────────────────
// Sole responsibility: the pre-made exercise picker inside the exercise modal.

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
  btn.classList.toggle('open', open);
  if (open) {
    document.getElementById('lib-search').value = '';
    renderLibrary(); // respects selectedLibraryName for highlight
    setTimeout(() => document.getElementById('lib-search').focus(), 50);
  }
}

function pickExercise(name) {
  selectedLibraryName = name;
  document.getElementById('ex-name').value = name;
  document.querySelectorAll('#lib-list .lib-item').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.name === name);
  });
  updateLibHint();
  // Keep panel open; chevron stays rotated via .open class on button
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
  document.getElementById('lib-toggle').classList.remove('open');
  const hint = document.getElementById('ex-lib-hint');
  if (hint) hint.textContent = '';
}
