import { useEffect, useState } from "react";
import { api } from "../api.js";
import { IconPlus, IconTrash, IconUpload, IconEdit, IconGrip } from "../components/Icons.jsx";

const WD = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function Cadastro() {
  const [tab, setTab] = useState("treinos");
  return (
    <>
      <div className="day-tab">
        {[["treinos", "Treinos"], ["exercicios", "Exercícios"], ["perfil", "Perfil"], ["peso", "Peso"]].map(([k, l]) => (
          <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === "treinos" && <Treinos />}
      {tab === "exercicios" && <Biblioteca />}
      {tab === "perfil" && <Perfil />}
      {tab === "peso" && <Peso />}
    </>
  );
}

// =================== BIBLIOTECA DE EXERCÍCIOS ===================
const emptyEx = { name: "", description: "", sets: 3, reps: "10", restSeconds: 60, calories: 0, imageUrl: "", videoUrl: "" };

function Biblioteca() {
  const [list, setList] = useState([]);
  const [ex, setEx] = useState(emptyEx);
  const [editing, setEditing] = useState(null); // null | id
  const [up, setUp] = useState("");

  const load = () => api.libList().then(setList);
  useEffect(() => { load(); }, []);

  const reset = () => { setEx(emptyEx); setEditing(null); setUp(""); };
  const save = async (e) => {
    e.preventDefault();
    if (!ex.name.trim()) return;
    await api.libSave(editing, ex);
    reset(); load();
  };
  const edit = (x) => { setEditing(x.id); setUp(""); setEx({
    name: x.name, description: x.description || "", sets: x.sets, reps: x.reps,
    restSeconds: x.restSeconds, calories: x.calories || 0, imageUrl: x.imageUrl || "", videoUrl: x.videoUrl || "" }); };
  const remove = async (id) => { if (confirm("Excluir da biblioteca? Treinos que usam esse exercício ficam sem ele.")) { await api.libDelete(id); if (editing === id) reset(); load(); } };
  const upFile = async (file, field) => {
    if (!file) return;
    setUp("Enviando...");
    try { const r = await api.upload(file); setEx((s) => ({ ...s, [field]: r.url })); setUp("Enviado: " + r.name); }
    catch (err) { setUp("Falha no upload. Publique as regras do Storage: firebase deploy --only storage"); }
  };

  return (
    <>
      <form className="card" onSubmit={save}>
        <h2>{editing ? "Editar exercício" : "Novo exercício"}</h2>
        <label>Nome</label>
        <input value={ex.name} onChange={(e) => setEx({ ...ex, name: e.target.value })} placeholder="Supino reto" />
        <div className="row">
          <div><label>Séries</label><input type="number" value={ex.sets} onChange={(e) => setEx({ ...ex, sets: e.target.value })} /></div>
          <div><label>Reps</label><input value={ex.reps} onChange={(e) => setEx({ ...ex, reps: e.target.value })} /></div>
          <div><label>Descanso (s)</label><input type="number" value={ex.restSeconds} onChange={(e) => setEx({ ...ex, restSeconds: e.target.value })} /></div>
          <div><label>Calorias</label><input type="number" value={ex.calories} onChange={(e) => setEx({ ...ex, calories: e.target.value })} /></div>
        </div>
        <label>Descrição</label>
        <input value={ex.description} onChange={(e) => setEx({ ...ex, description: e.target.value })} />
        <label><IconUpload size={13} /> Imagem</label>
        {ex.imageUrl && <img src={ex.imageUrl} alt="" style={{ width: "100%", maxWidth: 320, borderRadius: 8, margin: "6px 0" }} />}
        <input type="file" accept="image/*" onChange={(e) => upFile(e.target.files[0], "imageUrl")} />
        <label>Vídeo (arquivo ou link)</label>
        <input type="file" accept="video/*" onChange={(e) => upFile(e.target.files[0], "videoUrl")} />
        <input style={{ marginTop: 6 }} value={ex.videoUrl} onChange={(e) => setEx({ ...ex, videoUrl: e.target.value })} placeholder="ou cole URL (YouTube)" />
        {up && <p className="muted" style={{ fontSize: 12 }}>{up}</p>}
        <div className="row" style={{ marginTop: 12 }}>
          <button className="primary" type="submit">{editing ? "Salvar" : "Adicionar"}</button>
          {editing && <button type="button" className="ghost" onClick={reset}>Cancelar</button>}
        </div>
      </form>

      <div className="card">
        <h2>Biblioteca ({list.length})</h2>
        {list.length === 0 && <p className="muted">Nenhum exercício cadastrado.</p>}
        {list.map((x) => (
          <div className="food" key={x.id}>
            <span onClick={() => edit(x)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              {x.imageUrl && <img src={x.imageUrl} alt="" style={{ width: 34, height: 34, borderRadius: 6, objectFit: "cover" }} />}
              {x.name} <span className="muted" style={{ fontSize: 12 }}>· {x.sets}x{x.reps} · {x.calories || 0} kcal</span>
            </span>
            <button className="icon-btn" onClick={() => remove(x.id)}><IconTrash size={15} /></button>
          </div>
        ))}
      </div>
    </>
  );
}

// =================== TREINOS ===================
function Treinos() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const load = () => api.plans().then(setPlans);
  useEffect(() => { load(); }, []);

  const criar = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await api.createPlan(form);
    setForm({ name: "", description: "" });
    load();
  };

  return (
    <>
      <form className="card" onSubmit={criar}>
        <h2>Novo módulo de treino</h2>
        <label>Nome</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Treino ABC" />
        <label>Descrição</label>
        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <br /><button className="primary" type="submit"><IconPlus size={18} /> Criar plano</button>
      </form>

      {plans.map((p) => <PlanCard key={p.id} planId={p.id} onChange={load} />)}
      {plans.length === 0 && <p className="muted center">Nenhum plano ainda.</p>}
    </>
  );
}

function PlanCard({ planId, onChange }) {
  const [plan, setPlan] = useState(null);
  const [lib, setLib] = useState([]);
  const [dayForm, setDayForm] = useState({ label: "", weekdays: [] });
  const [drag, setDrag] = useState(null); // { dayId, itemId }
  const load = () => { api.plan(planId).then(setPlan); api.libList().then(setLib); };
  useEffect(() => { load(); }, [planId]);
  if (!plan) return null;

  const toggleWd = (i) => setDayForm((f) => ({ ...f, weekdays: f.weekdays.includes(i) ? f.weekdays.filter((x) => x !== i) : [...f.weekdays, i] }));
  const addDay = async () => { if (!dayForm.label.trim()) return; await api.addDay(planId, dayForm); setDayForm({ label: "", weekdays: [] }); load(); };
  const removePlan = async () => { if (confirm("Excluir plano?")) { await api.deletePlan(planId); onChange(); } };

  const dropOnItem = async (targetDayId, targetItemId) => {
    if (!drag) return;
    const day = plan.days.find((d) => d.id === targetDayId);
    const idx = day.items.findIndex((it) => it.id === targetItemId);
    await api.moveItem(planId, drag.dayId, targetDayId, drag.itemId, idx);
    setDrag(null); load();
  };
  const dropOnDay = async (targetDayId) => {
    if (!drag) return;
    await api.moveItem(planId, drag.dayId, targetDayId, drag.itemId, null);
    setDrag(null); load();
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>{plan.name}</h2>
        <button className="icon-btn" onClick={removePlan}><IconTrash size={16} /></button>
      </div>
      {plan.description && <p className="muted" style={{ marginTop: 4 }}>{plan.description}</p>}

      {plan.days.map((d) => (
        <DayBlock key={d.id} planId={planId} day={d} lib={lib} drag={drag} setDrag={setDrag}
          onDropItem={dropOnItem} onDropDay={dropOnDay} onChange={load} />
      ))}

      <div style={{ borderTop: "1px solid #262626", marginTop: 14, paddingTop: 12 }}>
        <label>Novo treino (dia)</label>
        <input value={dayForm.label} onChange={(e) => setDayForm({ ...dayForm, label: e.target.value })} placeholder="Ex: A - Peito e Tríceps" />
        <label>Dias da semana que cobre</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {WD.map((w, i) => (
            <button key={i} type="button" onClick={() => toggleWd(i)}
              className={dayForm.weekdays.includes(i) ? "" : "ghost"}
              style={{ padding: "6px 10px", borderRadius: 8, fontSize: 12, background: dayForm.weekdays.includes(i) ? "var(--red)" : "transparent", color: "#fff", border: "1px solid " + (dayForm.weekdays.includes(i) ? "var(--red)" : "#444"), cursor: "pointer" }}>
              {w}
            </button>
          ))}
        </div>
        <br /><button className="ghost" onClick={addDay}><IconPlus size={16} /> Adicionar treino</button>
      </div>
    </div>
  );
}

function DayBlock({ planId, day, lib, drag, setDrag, onDropItem, onDropDay, onChange }) {
  const [pick, setPick] = useState("");
  const [editItem, setEditItem] = useState(null);
  const [ov, setOv] = useState({ sets: "", reps: "", restSeconds: "" });

  const add = async () => { if (!pick) return; await api.addItem(planId, day.id, pick); setPick(""); onChange(); };
  const removeDay = async () => { if (confirm("Excluir este treino?")) { await api.deleteDay(planId, day.id); onChange(); } };
  const removeItem = async (itemId) => { await api.removeItem(planId, day.id, itemId); onChange(); };
  const openEdit = (ex) => { setEditItem(ex.itemId); setOv({ sets: ex.sets, reps: ex.reps, restSeconds: ex.restSeconds }); };
  const saveOv = async () => { await api.updateItem(planId, day.id, editItem, ov); setEditItem(null); onChange(); };

  return (
    <div style={{ borderLeft: "3px solid var(--red)", padding: "8px 12px", margin: "12px 0" }}
      onDragOver={(e) => e.preventDefault()} onDrop={() => onDropDay(day.id)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>{day.label || day.focus}</strong>
        <button className="icon-btn" onClick={removeDay}><IconTrash size={15} /></button>
      </div>
      {day.weekdays?.length > 0 && (
        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{day.weekdays.map((i) => WD[i]).join(" · ")}</div>
      )}

      {day.exercises.map((ex) => (
        <div key={ex.itemId}
          draggable
          onDragStart={() => setDrag({ dayId: day.id, itemId: ex.itemId })}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.stopPropagation(); onDropItem(day.id, ex.itemId); }}
          style={{ background: "#0f0f0f", border: "1px solid #2a2a2a", borderRadius: 10, padding: "10px 12px", margin: "8px 0", cursor: "grab", opacity: drag?.itemId === ex.itemId ? 0.4 : 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="muted" style={{ cursor: "grab", display: "inline-flex" }}><IconGrip size={16} /></span>
              {ex.imageUrl && <img src={ex.imageUrl} alt="" style={{ width: 30, height: 30, borderRadius: 6, objectFit: "cover" }} />}
              <span>{ex.name}</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="muted" style={{ fontSize: 12 }}>{ex.sets}x{ex.reps}</span>
              <button className="icon-btn" onClick={() => openEdit(ex)} title="Editar séries/reps"><IconEdit size={14} /></button>
              <button className="icon-btn" onClick={() => removeItem(ex.itemId)}><IconTrash size={14} /></button>
            </span>
          </div>
          {editItem === ex.itemId && (
            <div className="row" style={{ marginTop: 8, alignItems: "flex-end" }}>
              <div><label>Séries</label><input type="number" value={ov.sets} onChange={(e) => setOv({ ...ov, sets: e.target.value })} /></div>
              <div><label>Reps</label><input value={ov.reps} onChange={(e) => setOv({ ...ov, reps: e.target.value })} /></div>
              <div><label>Descanso</label><input type="number" value={ov.restSeconds} onChange={(e) => setOv({ ...ov, restSeconds: e.target.value })} /></div>
              <button className="primary" style={{ width: "auto", padding: "8px 12px" }} onClick={saveOv}>Ok</button>
            </div>
          )}
        </div>
      ))}
      {day.exercises.length === 0 && <p className="muted" style={{ fontSize: 12 }}>Arraste exercícios aqui ou adicione abaixo.</p>}

      <div className="row" style={{ marginTop: 8, alignItems: "flex-end" }}>
        <div>
          <label>Adicionar da biblioteca</label>
          <select value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">Escolher exercício...</option>
            {lib.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </div>
        <button className="ghost" onClick={add}><IconPlus size={15} /></button>
      </div>
    </div>
  );
}

// =================== PERFIL ===================
function Perfil() {
  const [form, setForm] = useState({ name: "", heightCm: "", goalWeightKg: "" });
  const [saved, setSaved] = useState(false);
  useEffect(() => { api.getProfile().then((p) => setForm({ name: p.name || "", heightCm: p.heightCm || "", goalWeightKg: p.goalWeightKg || "" })); }, []);
  const salvar = async (e) => {
    e.preventDefault();
    await api.saveProfile({ name: form.name, heightCm: form.heightCm ? Number(form.heightCm) : null, goalWeightKg: form.goalWeightKg ? Number(form.goalWeightKg) : null });
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

// =================== PESO ===================
function Peso() {
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({ weightKg: "", bodyFatPct: "" });
  const load = () => api.weight().then((l) => setLogs(l.slice().reverse()));
  useEffect(() => { load(); }, []);
  const add = async (e) => { e.preventDefault(); if (!form.weightKg) return; await api.addWeight(form); setForm({ weightKg: "", bodyFatPct: "" }); load(); };
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
