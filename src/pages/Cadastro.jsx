import { useEffect, useState } from "react";
import { api } from "../api.js";
import { IconPlus, IconTrash, IconUpload } from "../components/Icons.jsx";

const WD = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function Cadastro() {
  const [tab, setTab] = useState("treinos");
  return (
    <>
      <div className="day-tab">
        {[["treinos", "Treinos"], ["perfil", "Perfil"], ["peso", "Peso"]].map(([k, l]) => (
          <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === "treinos" && <Treinos />}
      {tab === "perfil" && <Perfil />}
      {tab === "peso" && <Peso />}
    </>
  );
}

// ---------------- TREINOS ----------------
function Treinos() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", daysPerWeek: 3 });
  const load = () => api.plans().then(setPlans);
  useEffect(() => { load(); }, []);

  const criar = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await api.createPlan(form);
    setForm({ name: "", description: "", daysPerWeek: 3 });
    load();
  };

  return (
    <>
      <form className="card" onSubmit={criar}>
        <h2>Novo módulo de treino</h2>
        <label>Nome</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Treino ABC" />
        <div className="row">
          <div><label>Descrição</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><label>Dias/semana</label><input type="number" value={form.daysPerWeek} onChange={(e) => setForm({ ...form, daysPerWeek: e.target.value })} /></div>
        </div>
        <br /><button className="primary" type="submit"><IconPlus size={18} /> Criar plano</button>
      </form>

      {plans.map((p) => <PlanCard key={p.id} planId={p.id} onChange={load} />)}
      {plans.length === 0 && <p className="muted center">Nenhum plano ainda.</p>}
    </>
  );
}

function PlanCard({ planId, onChange }) {
  const [plan, setPlan] = useState(null);
  const [dayForm, setDayForm] = useState({ weekday: 1, focus: "" });
  const load = () => api.plan(planId).then(setPlan);
  useEffect(() => { load(); }, [planId]);
  if (!plan) return null;

  const addDay = async () => {
    if (!dayForm.focus.trim()) return;
    await api.addDay(planId, dayForm);
    setDayForm({ weekday: 1, focus: "" });
    load();
  };
  const removePlan = async () => { if (confirm("Excluir plano?")) { await api.deletePlan(planId); onChange(); } };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>{plan.name}</h2>
        <button className="icon-btn" onClick={removePlan}><IconTrash size={16} /></button>
      </div>
      <p className="muted" style={{ marginTop: 4 }}>{plan.description}</p>

      {plan.days.map((d) => <DayBlock key={d.id} planId={planId} day={d} onChange={load} />)}

      <div className="row" style={{ marginTop: 10, alignItems: "flex-end" }}>
        <div style={{ flex: "0 0 90px" }}>
          <label>Dia</label>
          <select value={dayForm.weekday} onChange={(e) => setDayForm({ ...dayForm, weekday: Number(e.target.value) })}>
            {WD.map((w, i) => <option key={i} value={i}>{w}</option>)}
          </select>
        </div>
        <div><label>Foco</label><input value={dayForm.focus} onChange={(e) => setDayForm({ ...dayForm, focus: e.target.value })} placeholder="Peito e Tríceps" /></div>
        <button className="ghost" onClick={addDay}><IconPlus size={16} /> Dia</button>
      </div>
    </div>
  );
}

function DayBlock({ planId, day, onChange }) {
  const [open, setOpen] = useState(false);
  const empty = { name: "", description: "", sets: 3, reps: "10", restSeconds: 60, imageUrl: "", videoUrl: "" };
  const [ex, setEx] = useState(empty);
  const [up, setUp] = useState("");

  const addEx = async () => {
    if (!ex.name.trim()) return;
    await api.addExercise(planId, day.id, ex);
    setEx(empty); setUp(""); setOpen(false); onChange();
  };
  const upFile = async (file, field) => {
    if (!file) return;
    setUp("Enviando...");
    try { const r = await api.upload(file); setEx((s) => ({ ...s, [field]: r.url })); setUp("Enviado: " + r.name); }
    catch (e) { setUp("Falha no upload (Storage exige plano Blaze)"); }
  };
  const removeDay = async () => { await api.deleteDay(planId, day.id); onChange(); };
  const removeEx = async (id) => { await api.deleteExercise(planId, day.id, id); onChange(); };

  return (
    <div style={{ borderLeft: "3px solid var(--red)", padding: "6px 12px", margin: "10px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>{WD[day.weekday]} · {day.focus}</strong>
        <button className="icon-btn" onClick={removeDay}><IconTrash size={15} /></button>
      </div>
      {(day.exercises || []).map((e) => (
        <div className="food" key={e.id}>
          <span>{e.name} — {e.sets}x{e.reps}</span>
          <button className="icon-btn" onClick={() => removeEx(e.id)}><IconTrash size={14} /></button>
        </div>
      ))}

      {!open && <button className="ghost" style={{ marginTop: 8 }} onClick={() => setOpen(true)}><IconPlus size={15} /> Exercício</button>}

      {open && (
        <div style={{ marginTop: 10 }}>
          <label>Nome</label>
          <input value={ex.name} onChange={(e) => setEx({ ...ex, name: e.target.value })} placeholder="Supino reto" />
          <div className="row">
            <div><label>Séries</label><input type="number" value={ex.sets} onChange={(e) => setEx({ ...ex, sets: e.target.value })} /></div>
            <div><label>Reps</label><input value={ex.reps} onChange={(e) => setEx({ ...ex, reps: e.target.value })} /></div>
            <div><label>Descanso (s)</label><input type="number" value={ex.restSeconds} onChange={(e) => setEx({ ...ex, restSeconds: e.target.value })} /></div>
          </div>
          <label>Descrição</label>
          <input value={ex.description} onChange={(e) => setEx({ ...ex, description: e.target.value })} />
          <label><IconUpload size={13} /> Imagem</label>
          <input type="file" accept="image/*" onChange={(e) => upFile(e.target.files[0], "imageUrl")} />
          <label>Vídeo (arquivo ou link)</label>
          <input type="file" accept="video/*" onChange={(e) => upFile(e.target.files[0], "videoUrl")} />
          <input style={{ marginTop: 6 }} value={ex.videoUrl} onChange={(e) => setEx({ ...ex, videoUrl: e.target.value })} placeholder="ou cole URL (YouTube)" />
          {up && <p className="muted" style={{ fontSize: 12 }}>{up}</p>}
          <div className="row" style={{ marginTop: 10 }}>
            <button className="primary" onClick={addEx}>Salvar</button>
            <button className="ghost" onClick={() => { setOpen(false); setEx(empty); setUp(""); }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- PERFIL ----------------
function Perfil() {
  const [form, setForm] = useState({ name: "", heightCm: "", goalWeightKg: "" });
  const [saved, setSaved] = useState(false);
  useEffect(() => { api.getProfile().then((p) => setForm({ name: p.name || "", heightCm: p.heightCm || "", goalWeightKg: p.goalWeightKg || "" })); }, []);

  const salvar = async (e) => {
    e.preventDefault();
    await api.saveProfile({
      name: form.name,
      heightCm: form.heightCm ? Number(form.heightCm) : null,
      goalWeightKg: form.goalWeightKg ? Number(form.goalWeightKg) : null,
    });
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  return (
    <form className="card" onSubmit={salvar}>
      <h2>Perfil</h2>
      <label>Nome</label>
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <div className="row">
        <div><label>Altura (cm)</label><input type="number" value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} /></div>
        <div><label>Meta de peso (kg)</label><input type="number" value={form.goalWeightKg} onChange={(e) => setForm({ ...form, goalWeightKg: e.target.value })} /></div>
      </div>
      <br /><button className="primary" type="submit">Salvar</button>
      {saved && <p className="muted" style={{ textAlign: "center", marginTop: 10 }}>Salvo!</p>}
    </form>
  );
}

// ---------------- PESO ----------------
function Peso() {
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({ weightKg: "", bodyFatPct: "" });
  const load = () => api.weight().then((l) => setLogs(l.slice().reverse()));
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!form.weightKg) return;
    await api.addWeight(form);
    setForm({ weightKg: "", bodyFatPct: "" });
    load();
  };
  const remove = async (id) => { await api.delWeight(id); load(); };

  return (
    <>
      <form className="card" onSubmit={add}>
        <h2>Registrar peso</h2>
        <div className="row">
          <div><label>Peso (kg)</label><input type="number" step="0.1" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} /></div>
          <div><label>% Gordura</label><input type="number" step="0.1" value={form.bodyFatPct} onChange={(e) => setForm({ ...form, bodyFatPct: e.target.value })} /></div>
        </div>
        <br /><button className="primary" type="submit"><IconPlus size={18} /> Registrar</button>
      </form>
      <div className="card">
        <h2>Histórico</h2>
        {logs.length === 0 && <p className="muted">Sem registros.</p>}
        {logs.map((w) => (
          <div className="food" key={w.id}>
            <span>{new Date(w.date).toLocaleDateString("pt-BR")} — {w.weightKg} kg {w.bodyFatPct ? `· ${w.bodyFatPct}%` : ""}</span>
            <button className="icon-btn" onClick={() => remove(w.id)}><IconTrash size={15} /></button>
          </div>
        ))}
      </div>
    </>
  );
}
