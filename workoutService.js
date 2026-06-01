// ── Workout service ───────────────────────────────────────────
// Sole responsibility: all data mutations for days and exercises.
// Reads and writes through storage.js. No DOM access here.

function addDay(name) {
  const data = loadData();
  data.days.push({ id: uid(), name, exercises: [] });
  saveData(data);
}

function updateDay(id, name) {
  const data = loadData();
  const day = data.days.find(d => d.id === id);
  if (day) day.name = name;
  saveData(data);
}

function removeDay(id) {
  const data = loadData();
  data.days = data.days.filter(d => d.id !== id);
  saveData(data);
}

function addExercise(dayId, exData) {
  const data = loadData();
  const day = data.days.find(d => d.id === dayId);
  if (!day) return;
  day.exercises.push({
    id: uid(),
    name:    exData.name,
    weight:  exData.weight,
    unit:    exData.unit,
    sets:    exData.sets,
    reps:    exData.reps,
    notes:   exData.notes,
    date:    new Date().toLocaleDateString(),
    history: []
  });
  saveData(data);
}

function updateExercise(dayId, exId, exData) {
  const data = loadData();
  const day = data.days.find(d => d.id === dayId);
  if (!day) return;
  const ex = day.exercises.find(e => e.id === exId);
  // Preserve history — only overwrite the fields the user changed
  if (ex) Object.assign(ex, exData);
  saveData(data);
}

function removeExercise(dayId, exerciseId) {
  const data = loadData();
  const day = data.days.find(d => d.id === dayId);
  if (day) day.exercises = day.exercises.filter(e => e.id !== exerciseId);
  saveData(data);
}

function logExercise(dayId, exId, logData) {
  const data = loadData();
  const day  = data.days.find(d => d.id === dayId);
  const ex   = day && day.exercises.find(e => e.id === exId);
  if (!ex) return;
  // Push current values into history before overwriting
  if (!ex.history) ex.history = [];
  ex.history.push({ weight: ex.weight, reps: ex.reps, sets: ex.sets, date: ex.date || todayISO() });
  ex.weight = logData.weight;
  ex.sets   = logData.sets;
  ex.reps   = logData.reps;
  ex.date   = logData.date;
  saveData(data);
}

function logAllExercises(dayId, updates, date) {
  const data = loadData();
  const day  = data.days.find(d => d.id === dayId);
  if (!day) return;
  updates.forEach(u => {
    const ex = day.exercises.find(e => e.id === u.exId);
    if (!ex) return;
    if (!ex.history) ex.history = [];
    ex.history.push({ weight: ex.weight, reps: ex.reps, sets: ex.sets, date: ex.date || todayISO() });
    ex.weight = u.weight;
    ex.sets   = u.sets;
    ex.reps   = u.reps;
    ex.notes  = u.notes;
    ex.date   = date;
  });
  saveData(data);
}
