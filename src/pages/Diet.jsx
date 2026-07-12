import { useEffect, useState } from "react";
import { api } from "../api.js";
import { IconPlus, IconTrash, IconFlame } from "../components/Icons.jsx";

const MEALS = ["café", "almoço", "lanche", "janta"];

export default function Diet() {
  const today = new Date().toISOString().slice(0, 10);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ meal: "café", food: "", quantity: "", calories: "" });
  const [err, setErr] = useState(null);

  const load = () => api.diet(today).then(setEntries).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!form.food.trim()) return;
    await api.addDiet(form);
    setForm({ ...form, food: "", quantity: "", calories: "" });
    load();
  };

  const remove = async (id) => { await api.delDiet(id); load(); };

  const totalKcal = entries.reduce((s, e) => s + e.calories, 0);
  const totalProt = entries.reduce((s, e) => s + e.protein, 0);

  if (err) return <p className="muted">Erro ao carregar dieta: {err}</p>;

  return (
    <>
      <div className="stats" style={{ marginBottom: 14 }}>
        <div className="stat">
          <div className="stat-head"><IconFlame size={16} /></div>
          <div className="val red">{Math.round(totalKcal)}</div>
          <div className="lbl">kcal hoje</div>
        </div>
        <div className="stat">
          <div className="val">{Math.round(totalProt)}g</div>
          <div className="lbl">proteína</div>
        </div>
      </div>

      <form className="card" onSubmit={add}>
        <h2>Adicionar refeição</h2>
        <label>Refeição</label>
        <select value={form.meal} onChange={(e) => setForm({ ...form, meal: e.target.value })}>
          {MEALS.map((m) => <option key={m}>{m}</option>)}
        </select>
        <label>Alimento</label>
        <input value={form.food} onChange={(e) => setForm({ ...form, food: e.target.value })} placeholder="Frango grelhado" />
        <div className="row">
          <div>
            <label>Quantidade</label>
            <input value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="150g" />
          </div>
          <div>
            <label>Calorias</label>
            <input type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} placeholder="0" />
          </div>
        </div>
        <br />
        <button className="primary" type="submit"><IconPlus size={18} /> Adicionar</button>
      </form>

      <div className="card">
        <h2>Hoje</h2>
        {entries.length === 0 && <p className="muted">Nada registrado ainda.</p>}
        {MEALS.map((meal) => {
          const items = entries.filter((e) => e.meal === meal);
          if (!items.length) return null;
          return (
            <div className="meal-group" key={meal}>
              <h3>{meal}</h3>
              {items.map((e) => (
                <div className="food" key={e.id}>
                  <span>{e.food} {e.quantity && <span className="muted">· {e.quantity}</span>}</span>
                  <span className="kcal">
                    {Math.round(e.calories)} kcal
                    <button className="icon-btn" onClick={() => remove(e.id)} aria-label="Remover"><IconTrash size={16} /></button>
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
