// Camada de dados do Lift (Firestore). Exercícios agora são uma biblioteca reutilizável.
import { auth, db, storage } from "./firebase.js";
import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, setDoc, query, where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const uid = () => auth.currentUser?.uid;
const id16 = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const titleCase = (str) => String(str || "").replace(/\b\p{L}[\p{L}']*/gu, (w) => w.charAt(0).toUpperCase() + w.slice(1));
const localDay = (d = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
export { localDay };

const mine = (name) => query(collection(db, name), where("ownerUid", "==", uid()));
const snapList = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// ---------------- PERFIL ----------------
async function getProfile() {
  if (!uid()) return {};
  const s = await getDoc(doc(db, "profiles", uid()));
  return s.exists() ? s.data() : {};
}
async function saveProfile(data) {
  await setDoc(doc(db, "profiles", uid()), { ...data, ownerUid: uid() }, { merge: true });
}

// ---------------- BIBLIOTECA DE EXERCÍCIOS ----------------
async function libList() {
  return snapList(await getDocs(mine("exercises"))).sort((a, b) => (a.name > b.name ? 1 : -1));
}
async function libSave(id, data) {
  const payload = {
    ownerUid: uid(),
    name: titleCase(data.name),
    description: data.description || "",
    imageUrl: data.imageUrl || "",
    videoUrl: data.videoUrl || "",
    sets: Number(data.sets) || 3,
    reps: String(data.reps ?? "10"),
    restSeconds: Number(data.restSeconds) || 60,
    calories: Number(data.calories) || 0,
  };
  if (id) { await updateDoc(doc(db, "exercises", id), payload); return id; }
  const r = await addDoc(collection(db, "exercises"), { ...payload, createdAt: Date.now() });
  return r.id;
}
async function libDelete(id) { await deleteDoc(doc(db, "exercises", id)); }

// ---------------- PLANOS (dias com weekdays; itens referenciam a biblioteca) ----------------
async function plans() {
  return snapList(await getDocs(mine("plans")));
}
async function libMap() {
  const map = {};
  for (const e of await libList()) map[e.id] = e;
  return map;
}
function resolveDay(d, map) {
  const items = d.items || [];
  const resolved = items.map((it) => {
    const ex = map[it.refId] || {};
    return {
      id: it.id, itemId: it.id, refId: it.refId,
      name: ex.name || "(exercício removido)",
      description: ex.description || "",
      imageUrl: ex.imageUrl || "", videoUrl: ex.videoUrl || "",
      calories: ex.calories || 0,
      sets: Number(it.sets ?? ex.sets ?? 3),
      reps: String(it.reps ?? ex.reps ?? "10"),
      restSeconds: Number(it.restSeconds ?? ex.restSeconds ?? 60),
    };
  });
  // compat: planos antigos com exercícios embutidos
  let legacy = [];
  if (!items.length && (d.exercises || []).length) {
    legacy = d.exercises.map((e) => ({
      id: e.id, itemId: e.id, refId: null, name: e.name, description: e.description || "",
      imageUrl: e.imageUrl || "", videoUrl: e.videoUrl || "", calories: 0,
      sets: e.sets, reps: e.reps, restSeconds: e.restSeconds,
    }));
  }
  return { ...d, weekdays: d.weekdays || [], items, exercises: resolved.length ? resolved : legacy };
}
async function plan(planId) {
  const s = await getDoc(doc(db, "plans", planId));
  if (!s.exists()) return null;
  const map = await libMap();
  const data = { id: s.id, ...s.data() };
  data.days = (data.days || []).map((d) => resolveDay(d, map));
  return data;
}
async function createPlan({ name, description }) {
  const r = await addDoc(collection(db, "plans"), {
    ownerUid: uid(), name: titleCase(name), description: description || "", days: [], createdAt: Date.now(),
  });
  return r.id;
}
async function updatePlan(planId, data) { await updateDoc(doc(db, "plans", planId), data); }
async function deletePlan(planId) { await deleteDoc(doc(db, "plans", planId)); }

// helper: pega os dias crus (sem resolver) pra editar
async function rawDays(planId) {
  const s = await getDoc(doc(db, "plans", planId));
  return s.exists() ? (s.data().days || []) : [];
}
async function addDay(planId, { label, weekdays }) {
  const days = await rawDays(planId);
  days.push({ id: id16(), label: titleCase((label || "Treino").trim()), weekdays: weekdays || [], items: [] });
  await updateDoc(doc(db, "plans", planId), { days });
}
async function updateDay(planId, dayId, patch) {
  const days = (await rawDays(planId)).map((d) => d.id !== dayId ? d
    : { ...d, ...(patch.label !== undefined ? { label: titleCase(patch.label.trim()) } : {}),
        ...(patch.weekdays !== undefined ? { weekdays: patch.weekdays } : {}) });
  await updateDoc(doc(db, "plans", planId), { days });
}
async function deleteDay(planId, dayId) {
  await updateDoc(doc(db, "plans", planId), { days: (await rawDays(planId)).filter((d) => d.id !== dayId) });
}
async function addItem(planId, dayId, refId) {
  const days = (await rawDays(planId)).map((d) =>
    d.id !== dayId ? d : { ...d, items: [...(d.items || []), { id: id16(), refId }] });
  await updateDoc(doc(db, "plans", planId), { days });
}
async function updateItem(planId, dayId, itemId, overrides) {
  const clean = {};
  for (const k of ["sets", "reps", "restSeconds"]) {
    if (overrides[k] !== undefined && overrides[k] !== "") clean[k] = k === "reps" ? String(overrides[k]) : Number(overrides[k]);
  }
  const days = (await rawDays(planId)).map((d) => d.id !== dayId ? d
    : { ...d, items: (d.items || []).map((it) => it.id !== itemId ? it : { ...it, ...clean }) });
  await updateDoc(doc(db, "plans", planId), { days });
}
async function removeItem(planId, dayId, itemId) {
  const days = (await rawDays(planId)).map((d) =>
    d.id !== dayId ? d : { ...d, items: (d.items || []).filter((it) => it.id !== itemId) });
  await updateDoc(doc(db, "plans", planId), { days });
}
// move item entre dias (ou reordena no mesmo dia). toIndex = posição de destino (fim se null)
async function moveItem(planId, fromDayId, toDayId, itemId, toIndex = null) {
  const days = await rawDays(planId);
  const from = days.find((d) => d.id === fromDayId);
  const to = days.find((d) => d.id === toDayId);
  if (!from || !to) return;
  const idx = (from.items || []).findIndex((it) => it.id === itemId);
  if (idx < 0) return;
  const [moved] = from.items.splice(idx, 1);
  to.items = to.items || [];
  const insertAt = toIndex == null ? to.items.length : toIndex;
  to.items.splice(insertAt, 0, moved);
  await updateDoc(doc(db, "plans", planId), { days });
}

// ---------------- DIETA ----------------
async function diet(date) {
  const q = query(collection(db, "diet"), where("ownerUid", "==", uid()), where("day", "==", date));
  return snapList(await getDocs(q));
}
async function addDiet(body) {
  const now = new Date();
  await addDoc(collection(db, "diet"), {
    ownerUid: uid(), day: body.date || localDay(now), createdAt: now.toISOString(),
    meal: body.meal || "Lanche", food: titleCase(body.food), quantity: body.quantity || "",
    calories: Number(body.calories) || 0, protein: Number(body.protein) || 0,
    carbs: Number(body.carbs) || 0, fat: Number(body.fat) || 0,
  });
}
async function delDiet(docId) { await deleteDoc(doc(db, "diet", docId)); }

// ---------------- PESO ----------------
async function weight() {
  return snapList(await getDocs(mine("weight"))).sort((a, b) => (a.date > b.date ? 1 : -1));
}
async function addWeight(body) {
  await addDoc(collection(db, "weight"), {
    ownerUid: uid(), date: body.date || new Date().toISOString(),
    weightKg: Number(body.weightKg),
    bodyFatPct: body.bodyFatPct != null && body.bodyFatPct !== "" ? Number(body.bodyFatPct) : null,
  });
}
async function delWeight(docId) { await deleteDoc(doc(db, "weight", docId)); }

// ---------------- TREINOS CONCLUÍDOS ----------------
async function sessions() {
  return snapList(await getDocs(mine("sessions")))
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .map((s) => ({
      id: s.id, date: s.date, notes: s.notes, caloriesBurned: s.caloriesBurned || 0,
      day: { focus: s.dayFocus }, _count: { sets: (s.sets || []).length },
    }));
}
async function session(docId) {
  const s = await getDoc(doc(db, "sessions", docId));
  if (!s.exists()) return null;
  const d = s.data();
  return {
    id: s.id, date: d.date, notes: d.notes, caloriesBurned: d.caloriesBurned || 0, day: { focus: d.dayFocus },
    sets: (d.sets || []).map((x, i) => ({ id: i, weightKg: x.weightKg, reps: x.reps, exercise: { name: x.exerciseName } })),
  };
}
async function addSession(body) {
  await addDoc(collection(db, "sessions"), {
    ownerUid: uid(), date: body.date || new Date().toISOString(),
    dayId: body.dayId || null, dayFocus: body.dayFocus || "Treino",
    notes: body.notes || "", caloriesBurned: Number(body.caloriesBurned) || 0,
    sets: (body.sets || []).map((s) => ({
      exerciseId: s.exerciseId || null, exerciseName: s.exerciseName || "",
      setNumber: Number(s.setNumber) || 1,
      weightKg: s.weightKg !== undefined && s.weightKg !== "" ? Number(s.weightKg) : null,
      reps: s.reps !== undefined && s.reps !== "" ? Number(s.reps) : null,
    })),
  });
}
async function delSession(docId) { await deleteDoc(doc(db, "sessions", docId)); }

// Evolução de carga (peso máximo por sessão) de um exercício da biblioteca
async function exerciseProgress(refId) {
  const rows = [];
  for (const s of snapList(await getDocs(mine("sessions")))) {
    const rel = (s.sets || []).filter((x) => x.exerciseId === refId && x.weightKg != null);
    if (!rel.length) continue;
    rows.push({ date: s.date, maxWeight: Math.max(...rel.map((x) => x.weightKg)) });
  }
  return rows.sort((a, b) => (a.date > b.date ? 1 : -1));
}

// ---------------- DASHBOARD ----------------
async function dashboard() {
  const [profile, weightLogs, dietEntries, sessSnap] = await Promise.all([
    getProfile(), weight(),
    getDocs(mine("diet")).then(snapList),
    getDocs(mine("sessions")).then(snapList),
  ]);

  const currentWeight = weightLogs.length ? weightLogs[weightLogs.length - 1].weightKg : null;
  const startWeight = weightLogs.length ? weightLogs[0].weightKg : null;

  const byMonth = {};
  for (const log of weightLogs) {
    const d = new Date(log.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    (byMonth[key] ??= { label: `${MONTHS[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`, sum: 0, n: 0 });
    byMonth[key].sum += log.weightKg; byMonth[key].n += 1;
  }
  const weightByMonth = Object.values(byMonth).map((m) => ({ label: m.label, weightKg: Math.round((m.sum / m.n) * 10) / 10 }));

  const calByDay = {};
  for (const e of dietEntries) calByDay[e.day] = (calByDay[e.day] || 0) + (e.calories || 0);
  const caloriesByDay = Object.entries(calByDay).sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .map(([date, calories]) => ({ date, calories: Math.round(calories) })).slice(-7);
  const avgCalories = caloriesByDay.length
    ? Math.round(caloriesByDay.reduce((s, d) => s + d.calories, 0) / caloriesByDay.length) : 0;

  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const workoutsThisWeek = sessSnap.filter((s) => new Date(s.date) >= weekAgo).length;

  const today = localDay();
  const caloriesBurnedToday = sessSnap
    .filter((s) => localDay(new Date(s.date)) === today)
    .reduce((sum, s) => sum + (s.caloriesBurned || 0), 0);

  const dayset = new Set(sessSnap.map((s) => localDay(new Date(s.date))));
  let streak = 0;
  const cursor = new Date();
  if (!dayset.has(localDay(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (dayset.has(localDay(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }

  return {
    workoutsTotal: sessSnap.length, workoutsThisWeek, streak, caloriesBurnedToday,
    user: { name: profile.name, heightCm: profile.heightCm ?? null, goalWeightKg: profile.goalWeightKg ?? null },
    currentWeight, startWeight,
    weightChange: currentWeight && startWeight ? Math.round((currentWeight - startWeight) * 10) / 10 : 0,
    goalWeightKg: profile.goalWeightKg ?? null,
    avgCalories, weightByMonth, caloriesByDay,
  };
}

// ---------------- UPLOAD ----------------
async function upload(file) {
  const path = `uploads/${uid()}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  const r = ref(storage, path);
  await uploadBytes(r, file);
  return { url: await getDownloadURL(r), name: file.name };
}

export const api = {
  getProfile, saveProfile,
  libList, libSave, libDelete,
  plans, plan, createPlan, updatePlan, deletePlan,
  addDay, updateDay, deleteDay,
  addItem, updateItem, removeItem, moveItem,
  diet, addDiet, delDiet,
  weight, addWeight, delWeight,
  sessions, session, addSession, delSession, exerciseProgress,
  dashboard, upload,
};
