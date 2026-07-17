// Camada de dados do Lift usando Firestore (Firebase). Sem servidor Express.
// Mantém os mesmos nomes de função usados pelas telas (api.plans(), api.diet(), etc.).
import { auth, db, storage } from "./firebase.js";
import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
  setDoc, query, where, orderBy,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const uid = () => auth.currentUser?.uid;
const id16 = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// Primeira letra de cada palavra em maiúscula (mantém o resto como digitado)
const titleCase = (str) => String(str || "").replace(/\b\p{L}[\p{L}']*/gu, (w) => w.charAt(0).toUpperCase() + w.slice(1));
// Data local no formato YYYY-MM-DD (evita o bug de virar o dia às 21h por causa do fuso UTC)
const localDay = (d = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
export { localDay };

// coleções filtradas pelo dono
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

// ---------------- PLANOS (dias e exercícios embutidos) ----------------
async function plans() {
  return snapList(await getDocs(mine("plans")));
}
async function plan(planId) {
  const s = await getDoc(doc(db, "plans", planId));
  if (!s.exists()) return null;
  const data = { id: s.id, ...s.data() };
  data.days = data.days || [];
  return data;
}
async function createPlan({ name, description, daysPerWeek }) {
  const r = await addDoc(collection(db, "plans"), {
    ownerUid: uid(), name: titleCase(name), description: description || "",
    daysPerWeek: Number(daysPerWeek) || 3, days: [], createdAt: Date.now(),
  });
  return r.id;
}
async function updatePlan(planId, data) {
  await updateDoc(doc(db, "plans", planId), data);
}
async function deletePlan(planId) {
  await deleteDoc(doc(db, "plans", planId));
}
async function addDay(planId, { label }) {
  const p = await plan(planId);
  const name = titleCase((label || "Treino").trim());
  const days = [...(p.days || []), { id: id16(), label: name, focus: name, exercises: [] }];
  await updateDoc(doc(db, "plans", planId), { days });
}
async function updateDay(planId, dayId, { label }) {
  const p = await plan(planId);
  const name = titleCase((label || "Treino").trim());
  const days = (p.days || []).map((d) => (d.id !== dayId ? d : { ...d, label: name, focus: name }));
  await updateDoc(doc(db, "plans", planId), { days });
}
async function deleteDay(planId, dayId) {
  const p = await plan(planId);
  await updateDoc(doc(db, "plans", planId), { days: (p.days || []).filter((d) => d.id !== dayId) });
}
async function addExercise(planId, dayId, ex) {
  const p = await plan(planId);
  const days = (p.days || []).map((d) => {
    if (d.id !== dayId) return d;
    const exercises = [...(d.exercises || []), {
      id: id16(), name: titleCase(ex.name), description: ex.description || "",
      sets: Number(ex.sets) || 3, reps: String(ex.reps ?? "10"),
      restSeconds: Number(ex.restSeconds) || 60,
      imageUrl: ex.imageUrl || "", videoUrl: ex.videoUrl || "",
      order: (d.exercises || []).length,
    }];
    return { ...d, exercises };
  });
  await updateDoc(doc(db, "plans", planId), { days });
}
async function deleteExercise(planId, dayId, exId) {
  const p = await plan(planId);
  const days = (p.days || []).map((d) =>
    d.id !== dayId ? d : { ...d, exercises: (d.exercises || []).filter((e) => e.id !== exId) });
  await updateDoc(doc(db, "plans", planId), { days });
}
async function updateExercise(planId, dayId, exId, ex) {
  const p = await plan(planId);
  const days = (p.days || []).map((d) => {
    if (d.id !== dayId) return d;
    const exercises = (d.exercises || []).map((e) => (e.id !== exId ? e : {
      ...e,
      name: titleCase(ex.name), description: ex.description || "",
      sets: Number(ex.sets) || 3, reps: String(ex.reps ?? "10"),
      restSeconds: Number(ex.restSeconds) || 60,
      imageUrl: ex.imageUrl || "", videoUrl: ex.videoUrl || "",
    }));
    return { ...d, exercises };
  });
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
    ownerUid: uid(),
    day: body.date || localDay(now),
    createdAt: now.toISOString(),
    meal: body.meal || "lanche", food: titleCase(body.food), quantity: body.quantity || "",
    calories: Number(body.calories) || 0, protein: Number(body.protein) || 0,
    carbs: Number(body.carbs) || 0, fat: Number(body.fat) || 0,
  });
}
async function delDiet(docId) { await deleteDoc(doc(db, "diet", docId)); }

// ---------------- PESO ----------------
async function weight() {
  const snap = await getDocs(mine("weight"));
  return snapList(snap).sort((a, b) => (a.date > b.date ? 1 : -1));
}
async function addWeight(body) {
  await addDoc(collection(db, "weight"), {
    ownerUid: uid(),
    date: body.date || new Date().toISOString(),
    weightKg: Number(body.weightKg),
    bodyFatPct: body.bodyFatPct != null && body.bodyFatPct !== "" ? Number(body.bodyFatPct) : null,
  });
}
async function delWeight(docId) { await deleteDoc(doc(db, "weight", docId)); }

// ---------------- TREINOS CONCLUÍDOS ----------------
async function sessions() {
  const snap = await getDocs(mine("sessions"));
  return snapList(snap)
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .map((s) => ({
      id: s.id, date: s.date, notes: s.notes, durationMin: s.durationMin,
      day: { focus: s.dayFocus, weekday: s.dayWeekday },
      _count: { sets: (s.sets || []).length },
    }));
}
async function session(docId) {
  const s = await getDoc(doc(db, "sessions", docId));
  if (!s.exists()) return null;
  const d = s.data();
  return {
    id: s.id, date: d.date, notes: d.notes, durationMin: d.durationMin,
    day: { focus: d.dayFocus, weekday: d.dayWeekday },
    sets: (d.sets || []).map((x, i) => ({
      id: i, weightKg: x.weightKg, reps: x.reps, exercise: { name: x.exerciseName },
    })),
  };
}
async function addSession(body) {
  await addDoc(collection(db, "sessions"), {
    ownerUid: uid(),
    date: body.date || new Date().toISOString(),
    dayId: body.dayId || null, dayFocus: body.dayFocus || "Treino", dayWeekday: body.dayWeekday ?? null,
    notes: body.notes || "", durationMin: body.durationMin ?? null,
    sets: (body.sets || []).map((s) => ({
      exerciseId: s.exerciseId, exerciseName: s.exerciseName || "",
      setNumber: Number(s.setNumber) || 1,
      weightKg: s.weightKg !== undefined && s.weightKg !== "" ? Number(s.weightKg) : null,
      reps: s.reps !== undefined && s.reps !== "" ? Number(s.reps) : null,
    })),
  });
}
async function delSession(docId) { await deleteDoc(doc(db, "sessions", docId)); }

// ---------------- DASHBOARD (agregação no cliente) ----------------
async function dashboard() {
  const [profile, weightLogs, dietEntries, sessSnap] = await Promise.all([
    getProfile(),
    weight(),
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

  // Streak: dias consecutivos (data local) com treino registrado, terminando hoje ou ontem
  const dayset = new Set(sessSnap.map((s) => localDay(new Date(s.date))));
  let streak = 0;
  const cursor = new Date();
  if (!dayset.has(localDay(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (dayset.has(localDay(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }

  return {
    workoutsTotal: sessSnap.length, workoutsThisWeek, streak,
    workoutDays: [...dayset],
    user: { name: profile.name, heightCm: profile.heightCm ?? null, goalWeightKg: profile.goalWeightKg ?? null },
    currentWeight, startWeight,
    weightChange: currentWeight && startWeight ? Math.round((currentWeight - startWeight) * 10) / 10 : 0,
    goalWeightKg: profile.goalWeightKg ?? null,
    avgCalories, weightByMonth, caloriesByDay,
  };
}

// ---------------- UPLOAD (Firebase Storage) ----------------
async function upload(file) {
  const path = `uploads/${uid()}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  const r = ref(storage, path);
  await uploadBytes(r, file);
  return { url: await getDownloadURL(r), name: file.name };
}

export const api = {
  getProfile, saveProfile,
  plans, plan, createPlan, updatePlan, deletePlan, addDay, updateDay, deleteDay, addExercise, updateExercise, deleteExercise,
  diet, addDiet, delDiet,
  weight, addWeight, delWeight,
  sessions, session, addSession, delSession,
  dashboard, upload,
};
